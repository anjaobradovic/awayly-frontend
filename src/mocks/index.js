// mock backend za npm run dev:mock, podaci traju do refresha
// email sa "2fa" ide kroz QR, "locked" vraća 423, lozinka "pogresna" 401, kod 000000 je pogrešan

import {
  TEAMS,
  YEAR,
  DEFAULT_POLICY,
  MOCK_PDF,
  createLeaveTypes,
  createRoles,
  createUsers,
  createGlobalHolidays,
  createCompanyHolidays,
  createApproveRequests,
  createMyRequests,
  createTeamAbsences,
  createDelegations,
  createCurrentPolicy,
  createAuditLog,
  createAdSettings,
  createReports,
  createPositions,
  createApprovalChains,
  toDay
} from "./data";
import { useAuthStore } from "@/stores/auth";
import router from "@/router";
import { START_LOCATION } from "vue-router";
import { API_BASE_URL, APP_NAME } from "@/config";

const API_URL = API_BASE_URL;
const DELAY_MS = 300;
// prijavljeni korisnik je uvek Milan Stevanović (CompanyAdmin)
const ME = 1;

const APPROVAL_PERMISSIONS = ["REQUEST.APPROVE.TEAM", "REQUEST.APPROVE.ALL"];

// stanje
const db = {
  leave_types: createLeaveTypes(),
  roles: createRoles(),
  users: createUsers(),
  global_holidays: createGlobalHolidays(),
  company_holidays: createCompanyHolidays(),
  requests: [...createApproveRequests(), ...createMyRequests(), ...createTeamAbsences()],
  delegations: createDelegations(),
  policy: createCurrentPolicy(),
  scheduled_policy: null,
  ad: createAdSettings(),
  company: {
    id: 1,
    name: "NovaTech d.o.o.",
    tax_id: "108123456",
    address: "Bulevar oslobodjenja 10, 21000 Novi Sad",
    contact: "office@novatech.rs",
    two_factor_required: true,
    custom_approval_chains_enabled: false,
    team_calendar_visible_to_employees: true,
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-01-10T09:00:00Z"
  },
  // { [user_id]: { [leave_type_id]: used_days } }, godišnji je u user.balance
  used_days: {},
  // poslije resetTotp sljedeća prijava ide kroz QR
  totp_reset: false
};

db.audit_log = createAuditLog(db.users);

// vođa tima = najčešći menadžer članova tima
db.team_leads = Object.fromEntries(
  Object.keys(TEAMS).map((team_id) => {
    const counts = {};

    db.users
      .filter((user) => user.team_id === Number(team_id) && user.manager_id)
      .forEach((user) => (counts[user.manager_id] = (counts[user.manager_id] ?? 0) + 1));

    const [lead] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];

    return [team_id, lead ? Number(lead) : null];
  })
);
db.reports = createReports(db.users);
db.positions = createPositions(db.users);
db.approval_chains = createApprovalChains();

// obavještenja kao na backendu, entity_id pokazuje na pravi zahtjev
function createNotifications(requests) {
  const mine = requests.filter((request) => request.user_id === ME);
  const others = requests.filter((request) => request.user_id !== ME);
  const ago = (hours) =>
    new Date(Date.now() - hours * 3600 * 1000).toISOString().slice(0, 19) + "Z";
  const leaveParams = (request) => ({
    leave_type_name: findType(request.leave_type_id)?.name,
    start_date: day(request.start_date),
    end_date: day(request.end_date)
  });

  const rows = [
    ["LEAVE_REQUEST_APPROVED", mine[0].id, leaveParams(mine[0]), 0.2, false],
    [
      "LEAVE_REQUEST_REJECTED",
      mine[4].id,
      { leave_type_name: findType(mine[4].leave_type_id)?.name, rejection_reason: "ne može" },
      3,
      false
    ],
    ["LEAVE_REQUEST_SUBMITTED", others[0].id, leaveParams(others[0]), 12, false],
    [
      "DELEGATION_ASSIGNED",
      1,
      { delegator_name: "Admin Test", start_date: ago(-48), end_date: ago(-96) },
      26,
      true
    ],
    ["POLICY_SCHEDULED", 7, { version: 7, effective_from: "2027-01-01" }, 50, true],
    ["NEKI_NOVI_TIP", 1, {}, 24 * 8, true]
  ];

  return rows.map(([type, entity_id, params, hours_ago, is_read], index) => ({
    id: index + 1,
    type,
    entity_id,
    details: { params },
    read_at: is_read ? ago(hours_ago) : null,
    created_at: ago(hours_ago)
  }));
}

let next_id = 1000;
const nextId = () => ++next_id;
const now = () => new Date().toISOString().slice(0, 19) + "Z";
const day = (value) => String(value ?? "").slice(0, 10);

// odgovori
const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const ok = (data, status = 200) => json({ data: { code: status, message: "Ok", data } }, status);

const fail = (status, code, message, details = message) =>
  json({ error: { code, message, details } }, status);

const notFound = (what) => fail(404, "404.000.001", "Not found", `${what} not found`);

const paginate = (items, query, list_key) => {
  const page = Number(query.get("page") ?? 1);
  const page_size = Number(query.get("page_size") ?? 20);
  const start = (page - 1) * page_size;

  return ok({ [list_key]: items.slice(start, start + page_size), total_count: items.length });
};

// pomoćne
const findUser = (id) => db.users.find((user) => user.id === Number(id));
const findRole = (id) => db.roles.find((role) => role.id === Number(id));
const findType = (id) => db.leave_types.find((type) => type.id === Number(id));

const person = (id) => {
  const user = findUser(id);

  return user ? { id: user.id, first_name: user.first_name, last_name: user.last_name } : null;
};

const isApprover = (user_id) =>
  findRole(findUser(user_id)?.role_id)?.permissions.some((key) =>
    APPROVAL_PERMISSIONS.includes(key)
  ) ?? false;

const listUser = (user) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  phone_number: user.phone_number,
  status: user.status,
  hire_date: user.hire_date,
  date_of_birth: user.date_of_birth,
  manager_id: user.manager_id,
  team: user.team_id ? { id: user.team_id, name: TEAMS[user.team_id] } : null,
  role: { id: user.role_id, name: findRole(user.role_id)?.name },
  annual_leave_balance: {
    entitled_days: user.balance.allocated_days,
    allocated_days: user.balance.allocated_days,
    carried_over_days: 0,
    used_days: user.balance.used_days,
    remaining_days: user.balance.remaining_days
  }
});

const singleUser = (user) => {
  const { balance, ...rest } = user;

  return { ...rest, role: { id: user.role_id, name: findRole(user.role_id)?.name } };
};

// timovi: TEAMS iz data.js se mijenja u mjestu, vođa tima je u db.team_leads
const teamMembers = (team_id) => db.users.filter((user) => user.team_id === team_id);

const teamNameTaken = (name, except_id = null) =>
  Object.entries(TEAMS).some(
    ([id, team]) => Number(id) !== except_id && team.toLowerCase() === name.toLowerCase()
  );

const teamRow = (id, name) => {
  const lead = findUser(db.team_leads[id]);

  return {
    id,
    name,
    team_lead_id: lead?.id ?? null,
    team_lead_name: lead ? `${lead.first_name} ${lead.last_name}` : null,
    member_count: teamMembers(id).length
  };
};

// user objekat iz login / verify / getMyProfile
const authUser = (user) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  company_id: 1,
  status: user.status,
  first_time_otp: false,
  permissions: findRole(user.role_id)?.permissions ?? [],
  led_teams: Object.keys(TEAMS)
    .map(Number)
    .filter((team_id) => db.users.some((u) => u.team_id === team_id && u.manager_id === user.id))
    .map((team_id) => ({ id: team_id, name: TEAMS[team_id] }))
});

// dani koje tip daje godišnje, null = tip ne troši saldo
const ALLOCATED = { 1: null, 2: 10, 8: 5, 9: 2, 10: 5 };

const balancesOf = (user_id) => {
  const user = findUser(user_id);
  const used = db.used_days[user_id] ?? {};

  return db.leave_types.map((type) => {
    if (type.id === 1) {
      return {
        leave_type_id: 1,
        leave_type_name: type.name,
        counts_against_balance: true,
        allocated_days: user.balance.allocated_days,
        used_days: user.balance.used_days,
        remaining_days: user.balance.remaining_days
      };
    }

    const allocated = type.counts_against_balance ? (ALLOCATED[type.id] ?? 0) : 0;
    const used_days = used[type.id] ?? (type.id === 2 ? 3 : 0);

    return {
      leave_type_id: type.id,
      leave_type_name: type.name,
      counts_against_balance: type.counts_against_balance,
      allocated_days: allocated,
      used_days,
      remaining_days: type.counts_against_balance ? Math.max(0, allocated - used_days) : 0
    };
  });
};

// radni dani u periodu: bez vikenda i praznika koji važe za korisnika
const holidaysFor = (user_id, from, to) => {
  const religion = findUser(user_id)?.religion;

  return [
    ...db.global_holidays.filter(
      (holiday) => holiday.type === "NATIONAL" || holiday.religion === religion
    ),
    ...db.company_holidays
  ]
    .filter((holiday) => day(holiday.date) >= day(from) && day(holiday.date) <= day(to))
    .map((holiday) => ({ date: holiday.date, name: holiday.name }));
};

const workingDays = (user_id, from, to) => {
  const holidays = new Set(holidaysFor(user_id, from, to).map((holiday) => day(holiday.date)));
  const date = new Date(`${day(from)}T00:00:00`);
  const end = new Date(`${day(to)}T00:00:00`);
  let count = 0;

  for (; date <= end; date.setDate(date.getDate() + 1)) {
    if (date.getDay() % 6 !== 0 && !holidays.has(toDay(date))) count += 1;
  }

  return count;
};

const toRequest = (request) => {
  const user = findUser(request.user_id);
  const type = findType(request.leave_type_id);

  return {
    id: request.id,
    user: { ...person(user.id), team: { id: user.team_id, name: TEAMS[user.team_id] } },
    leave_type: { id: type.id, name: type.name },
    start_date: request.start_date,
    end_date: request.end_date,
    status: request.status,
    change_type: request.change_type,
    is_my_assignment: request.is_my_assignment,
    reason: request.reason,
    created_at: request.created_at
  };
};

const filterRequests = (requests, query) => {
  const type = query.get("leave_type_id");
  const from = query.get("from");
  const to = query.get("to");
  const status = query.get("status");

  return requests
    .filter((request) => !status || request.status === status)
    .filter((request) => !type || request.leave_type_id === Number(type))
    .filter((request) => !from || day(request.end_date) >= day(from))
    .filter((request) => !to || day(request.start_date) <= day(to))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(toRequest);
};

// zahtjevi u periodu kalendara, bez odbijenih i otkazanih
const CALENDAR_STATUSES = ["PENDING", "APPROVED", "PENDING_CANCELLATION"];

const calendarRequests = (query) => {
  const from = day(query.get("date_from"));
  const to = day(query.get("date_to"));

  return db.requests.filter(
    (request) =>
      CALENDAR_STATUSES.includes(request.status) &&
      day(request.end_date) >= from &&
      day(request.start_date) <= to
  );
};

const toDelegationListItem = (delegation) => ({
  ...delegation,
  delegator: person(delegation.delegator_id),
  delegate: person(delegation.delegate_id)
});

const createDelegation = (delegator_id, body) => {
  if (!isApprover(body.delegate_id)) {
    return fail(400, "400.014.002", "Bad request", "Delegate must have approval permissions");
  }

  if (day(body.end_date) < day(body.start_date)) {
    return fail(400, "400.014.001", "Bad request", "end_date must be after start_date");
  }

  const delegation = {
    id: nextId(),
    delegator_id,
    delegate_id: body.delegate_id,
    start_date: body.start_date,
    end_date: body.end_date,
    status: "ACTIVE",
    created_at: now(),
    updated_at: now()
  };

  db.delegations.unshift(delegation);
  return ok(delegation, 201);
};

const updateDelegation = (id, changes) => {
  const delegation = db.delegations.find((item) => item.id === Number(id));

  if (!delegation) return notFound("Delegation");

  Object.assign(delegation, changes, { updated_at: now() });
  return ok(delegation);
};

const roleWithCount = (role) => ({
  ...role,
  user_count: db.users.filter((user) => user.role_id === role.id && user.status !== "DEACTIVATED")
    .length
});

// obavještenja tek ovdje jer koriste findUser i findType
db.notifications = createNotifications(db.requests);

// lanci odobravanja, korak u odgovoru nosi ulogu ili osobu
const APPROVER_TYPES = ["TEAM_LEAD", "ROLE", "USER"];

const toApprovalChain = (chain) => ({
  id: chain.id,
  name: chain.name,
  applies_to_all: chain.applies_to_all,
  teams: chain.team_ids.filter((id) => TEAMS[id]).map((id) => ({ id, name: TEAMS[id] })),
  steps: chain.steps.map((step, index) => ({
    order: index + 1,
    approver_type: step.approver_type,
    role:
      step.approver_type === "ROLE"
        ? { id: step.role_id, name: findRole(step.role_id)?.name ?? null }
        : null,
    user: step.approver_type === "USER" ? person(step.user_id) : null
  })),
  is_active: chain.is_active,
  created_at: chain.created_at,
  updated_at: chain.updated_at
});

const approvalChainFrom = (body) => ({
  name: String(body.name ?? "").trim(),
  applies_to_all: Boolean(body.applies_to_all),
  team_ids: body.applies_to_all ? [] : (body.team_ids ?? []).map(Number),
  steps: (body.steps ?? []).map(({ approver_type, role_id, user_id }) => ({
    approver_type,
    role_id: approver_type === "ROLE" ? Number(role_id) : null,
    user_id: approver_type === "USER" ? Number(user_id) : null
  })),
  is_active: body.is_active ?? true
});

const validateApprovalChain = (chain, id = null) => {
  if (!db.company.custom_approval_chains_enabled) {
    return fail(403, "403.022.001", "Forbidden", "Custom approval chains are disabled");
  }

  if (!chain.name) {
    return fail(400, "400.001.003", "Invalid request body", "Field name cannot be empty");
  }

  if (!chain.applies_to_all && !chain.team_ids.length) {
    return fail(400, "400.022.001", "Bad request", "Chain must apply to at least one team");
  }

  if (!chain.steps.length) {
    return fail(400, "400.022.002", "Bad request", "Chain must have at least one step");
  }

  const invalid = chain.steps.some(
    (step) =>
      !APPROVER_TYPES.includes(step.approver_type) ||
      (step.approver_type === "ROLE" && !findRole(step.role_id)) ||
      (step.approver_type === "USER" && !findUser(step.user_id))
  );

  if (invalid) return fail(400, "400.022.003", "Bad request", "Invalid approver in chain step");

  const taken = db.approval_chains.some(
    (item) => item.id !== id && item.name.toLowerCase() === chain.name.toLowerCase()
  );

  if (taken) {
    return fail(
      409,
      "409.022.001",
      "Conflict",
      "An approval chain with the same name already exists"
    );
  }

  return null;
};

// rute
// [metoda, putanja, handler({ params, body, query })]
const ROUTES = [
  // 1. AUTH
  [
    "POST",
    "auth/login",
    ({ body }) => {
      if (!body?.email || !body?.password) {
        return fail(400, "400.001.003", "Invalid request body", "Field cannot be empty");
      }

      if (body.email.includes("locked")) {
        return fail(423, "423.001.001", "Locked", "Account is temporarily locked");
      }

      const user = authUser(findUser(ME));

      if (body.email.includes("2fa") || db.totp_reset) {
        return ok({ temporary_token: "mock-temporary", user: { ...user, first_time_otp: true } });
      }

      return ok({ access_token: "mock-access", user });
    }
  ],
  [
    "POST",
    "auth/retrieveTotp",
    () => ok({ totp_uri: "otpauth://totp/Awayly:demo?secret=JBSWY3DPEHPK3PXP&issuer=Awayly" })
  ],
  [
    "POST",
    "auth/verifyTotp",
    ({ body }) => {
      if (body?.otp === "000000") {
        return fail(401, "401.002.002", "Unauthorized", "Invalid one-time password");
      }

      db.totp_reset = false;

      return ok({
        access_token: "mock-access",
        user: authUser(findUser(ME)),
        backup_codes: Array.from({ length: 10 }, (_, index) =>
          `${4821 + index * 1117}-${7350 + index * 331}`.slice(0, 9)
        )
      });
    }
  ],
  [
    "POST",
    "auth/verifyBackupCode",
    () => ok({ access_token: "mock-access", user: authUser(findUser(ME)) })
  ],
  ["POST", "auth/requestPasswordReset", () => ok({ message: "Email sent" })],
  // lozinka "pogresna" vraća 401.002.008
  [
    "PATCH",
    "auth/changePassword",
    ({ body }) => {
      if (body?.current_password === "pogresna") {
        return fail(401, "401.002.008", "Unauthorized", "Current password is incorrect");
      }

      if (body?.new_password !== body?.confirmed_new_password) {
        return fail(
          400,
          "400.002.002",
          "Bad Request",
          "Field confirmed_new_password must match new_password"
        );
      }

      return ok({ message: "Password changed successfully" });
    }
  ],
  [
    "POST",
    "auth/resetTotp",
    ({ body }) => {
      if (body?.current_password === "pogresna") {
        return fail(401, "401.002.008", "Unauthorized", "Current password is incorrect");
      }

      db.totp_reset = true;
      return ok({ message: "2FA reset successfully" });
    }
  ],

  // 2. POLISA
  ["GET", "policy/getCurrentPolicy", () => ok(db.policy)],
  [
    "GET",
    "policy/getScheduledPolicy",
    () =>
      db.scheduled_policy
        ? ok(db.scheduled_policy)
        : fail(404, "404.002.002", "Not found", "No scheduled policy")
  ],
  ["GET", "policy/getDefaultPolicy", () => ok({ ...DEFAULT_POLICY })],
  [
    "POST",
    "policy/schedulePolicyChange",
    ({ body }) => {
      if (day(body.effective_from) <= toDay(new Date())) {
        return fail(400, "400.002.001", "Bad request", "effective_from must be in the future");
      }

      db.scheduled_policy = {
        id: 2,
        version: db.policy.version + 1,
        status: "SCHEDULED",
        effective_to: null,
        ...body
      };
      return ok(db.scheduled_policy, 201);
    }
  ],
  [
    "DELETE",
    "policy/cancelScheduledPolicy",
    () => {
      if (!db.scheduled_policy) return fail(404, "404.002.002", "Not found", "No scheduled policy");

      db.scheduled_policy = null;
      return ok({ message: "Cancelled" });
    }
  ],

  // 3. PRAZNICI
  [
    "GET",
    "holiday/getGlobalHolidays",
    ({ query }) => {
      const year = query.get("year") ?? String(YEAR);
      const type = query.get("type");
      const items = db.global_holidays
        .filter((holiday) => holiday.date.startsWith(year))
        .filter((holiday) => !type || holiday.type === type)
        .sort((a, b) => a.date.localeCompare(b.date));

      return paginate(items, query, "holidays");
    }
  ],
  [
    "GET",
    "holiday/getCompanyHolidays",
    ({ query }) => {
      const year = query.get("year") ?? String(YEAR);
      const items = db.company_holidays
        .filter((holiday) => holiday.date.startsWith(year))
        .sort((a, b) => a.date.localeCompare(b.date));

      return paginate(items, query, "holidays");
    }
  ],
  [
    "POST",
    "holiday/createCompanyHoliday",
    ({ body }) => {
      const holiday = { id: nextId(), date: body.date, name: body.name };

      db.company_holidays.push(holiday);
      return ok(holiday, 201);
    }
  ],
  [
    "PATCH",
    "holiday/updateCompanyHoliday/:id",
    ({ params, body }) => {
      const holiday = db.company_holidays.find((item) => item.id === Number(params.id));

      if (!holiday) return notFound("Company holiday");

      Object.assign(holiday, body);
      return ok(holiday);
    }
  ],
  [
    "DELETE",
    "holiday/deleteCompanyHoliday/:id",
    ({ params }) => {
      db.company_holidays = db.company_holidays.filter((item) => item.id !== Number(params.id));
      return ok({ message: "Deleted" });
    }
  ],

  // 4. ZAPOSLENI
  [
    "GET",
    "user/getUsers",
    ({ query }) => {
      const q = (query.get("q") ?? "").toLowerCase();
      const manager_id = query.get("manager_id");
      const team_id = query.get("team_id");
      const status = query.get("status");
      const items = db.users
        .filter(
          (user) =>
            !q || `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(q)
        )
        .filter((user) => !manager_id || user.manager_id === Number(manager_id))
        .filter((user) => !team_id || user.team_id === Number(team_id))
        .filter((user) => !status || user.status === status)
        .map(listUser);

      return paginate(items, query, "users");
    }
  ],
  [
    "GET",
    "user/getSingleUser/:id",
    ({ params }) => {
      const user = findUser(params.id);

      return user ? ok(singleUser(user)) : notFound("User");
    }
  ],
  [
    "GET",
    "user/getMyProfile",
    () => {
      const me = findUser(ME);

      // 4.7 vraća profil, auth store čita user, a delegacije polja direktno
      return ok({ ...singleUser(me), user: authUser(me) });
    }
  ],
  [
    "PATCH",
    "user/updateMyProfile",
    ({ body }) => {
      Object.assign(findUser(ME), body);
      return ok(singleUser(findUser(ME)));
    }
  ],
  [
    "POST",
    "user/createUser",
    ({ body }) => {
      if (db.users.some((user) => user.email === body.email)) {
        return fail(409, "409.005.001", "Conflict", "A user with the same email already exists");
      }

      const allocated = db.policy.annual_leave_days;
      const remaining = body.remaining_days ?? allocated;
      const user = {
        ...body,
        id: nextId(),
        status: "PENDING_INVITE",
        role_id: 2,
        auth_type: "LOCAL",
        two_factor_configured: false,
        permanent_backup_id: null,
        termination_date: null,
        created_at: now(),
        updated_at: now(),
        balance: {
          allocated_days: allocated,
          used_days: body.used_days ?? 0,
          remaining_days: remaining
        }
      };

      db.users.push(user);
      return ok({ id: user.id, email: user.email, status: user.status }, 201);
    }
  ],
  [
    "PATCH",
    "user/updateUser/:id",
    ({ params, body }) => {
      const user = findUser(params.id);

      if (!user) return notFound("User");

      Object.assign(user, body, { updated_at: now() });
      return ok(singleUser(user));
    }
  ],
  [
    "PATCH",
    "user/deactivateUser/:id",
    ({ params }) => {
      const user = findUser(params.id);

      if (!user) return notFound("User");
      if (user.id === ME) {
        return fail(403, "403.005.004", "Forbidden", "Users cannot deactivate their own account");
      }

      user.status = "DEACTIVATED";
      return ok({ message: "User deactivated" });
    }
  ],
  ["PATCH", "user/resetUserTotp/:id", () => ok({ message: "TOTP reset" })],
  [
    "GET",
    "user/getBulkImportTemplate",
    () =>
      new Response("first_name,last_name,email,hire_date,team\n", {
        headers: { "Content-Type": "text/csv" }
      })
  ],
  // 5.2 uvoz: JSON { users } iz pregleda ili šablon kao fajl (FormData, samo CSV u demu)
  [
    "POST",
    "user/bulkImportUsers",
    async ({ body }) => {
      let rows = body?.users;

      if (body instanceof FormData) {
        const file = body.get("file");

        if (!file?.name?.toLowerCase().endsWith(".csv")) {
          return fail(415, "415.005.001", "Unsupported media type", "Only CSV is supported");
        }

        const [head = "", ...lines] = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/);
        const separator = head.includes(";") ? ";" : ",";
        const split = (line) => line.split(separator).map((cell) => cell.trim());
        const keys = split(head);

        rows = lines
          .filter((line) => line.trim())
          .map((line) => Object.fromEntries(split(line).map((cell, i) => [keys[i], cell])));
      }

      if (!Array.isArray(rows)) return fail(400, "400.005.010", "Bad request", "No rows");

      const team_ids = Object.fromEntries(
        Object.entries(TEAMS).map(([id, name]) => [name.toLowerCase(), Number(id)])
      );
      const skipped = [];
      let imported = 0;

      rows.forEach((row, index) => {
        const email = String(row.email ?? "").trim();
        const team_id = row.team ? team_ids[String(row.team).trim().toLowerCase()] : null;
        let reason = null;

        if (!row.first_name || !row.last_name) reason = "missing_name";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reason = "invalid_email";
        else if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
          reason = "email_exists";
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.hire_date ?? "")) reason = "invalid_date";
        else if (team_id === undefined) reason = "unknown_team";

        if (reason) return skipped.push({ row: index + 1, email, reason });

        const allocated = db.policy.annual_leave_days;

        db.users.push({
          id: nextId(),
          first_name: String(row.first_name).trim(),
          last_name: String(row.last_name).trim(),
          email,
          phone_number: null,
          hire_date: row.hire_date,
          date_of_birth: null,
          onboarding_type: "NEW_EMPLOYEE",
          manager_id: null,
          team_id,
          religion: null,
          status: "PENDING_INVITE",
          role_id: 2,
          auth_type: "LOCAL",
          two_factor_configured: false,
          permanent_backup_id: null,
          termination_date: null,
          created_at: now(),
          updated_at: now(),
          balance: { allocated_days: allocated, used_days: 0, remaining_days: allocated }
        });
        imported += 1;
      });

      return ok({ imported, skipped }, 201);
    }
  ],

  // 7. ULOGE
  ["GET", "role/getRoles", () => ok({ roles: db.roles.map(roleWithCount) })],
  [
    "POST",
    "role/createRole",
    ({ body }) => {
      if (db.roles.some((role) => role.name.toLowerCase() === body.name.toLowerCase())) {
        return fail(409, "409.008.001", "Conflict", "Role with this name already exists");
      }

      const role = { ...body, id: nextId(), is_system: false };

      db.roles.push(role);
      return ok(role, 201);
    }
  ],
  [
    "PATCH",
    "role/updateRole/:id",
    ({ params, body }) => {
      const role = findRole(params.id);

      if (!role) return notFound("Role");
      if (role.is_system) return fail(403, "403.008.001", "Forbidden", "System roles are locked");

      Object.assign(role, body);
      return ok(role);
    }
  ],
  [
    "DELETE",
    "role/deleteRole/:id",
    ({ params }) => {
      const role = findRole(params.id);

      if (!role) return notFound("Role");
      if (role.is_system) return fail(403, "403.008.001", "Forbidden", "System roles are locked");
      if (roleWithCount(role).user_count) {
        return fail(409, "409.008.002", "Conflict", "Role is assigned to users");
      }

      db.roles = db.roles.filter((item) => item !== role);
      return ok({ message: "Deleted" });
    }
  ],
  [
    "PATCH",
    "role/changeUserRole",
    ({ body }) => {
      const user = findUser(body.user_id);

      if (!user) return notFound("User");

      user.role_id = body.role_id;
      return ok({ user_id: user.id, role_id: user.role_id });
    }
  ],

  // 9. ZAHTEVI
  [
    "GET",
    "leave/getLeaveRequestsToApprove",
    ({ query }) =>
      paginate(
        // kao pravi backend: korisnik sa REQUEST.APPROVE.ALL vidi i svoje zahteve
        filterRequests(db.requests, query),
        query,
        "requests"
      )
  ],
  [
    "GET",
    "leave/getLeaveRequests",
    // kao pravi backend: moji zahtjevi stižu bez user
    ({ query }) =>
      paginate(
        filterRequests(
          db.requests.filter((request) => request.user_id === ME),
          query
        ).map(({ user, ...request }) => request),
        query,
        "requests"
      )
  ],
  [
    "POST",
    "leave/createLeaveRequest",
    ({ body }) => {
      const type = findType(body.leave_type_id);

      if (!type) return notFound("Leave type");
      if (type.requires_reason && !body.reason) {
        return fail(400, "400.001.003", "Invalid request body", "Field 'reason' cannot be empty");
      }

      // pravila kao na pravom backendu (9.1)
      const today = new Date().toISOString().slice(0, 10);
      const notice_from = new Date(Date.now() + type.min_advance_notice_days * 86400000)
        .toISOString()
        .slice(0, 10);

      if (!type.allow_past_dates && day(body.start_date) < today) {
        return fail(
          400,
          "400.010.004",
          "Bad request",
          "start_date cannot be in the past for this leave type"
        );
      }

      if (!type.allow_past_dates && day(body.start_date) < notice_from) {
        return fail(
          400,
          "400.010.003",
          "Bad request",
          "start_date does not meet the minimum_advance_notice required for this leave type"
        );
      }

      if (
        type.name === "Maternity leave" &&
        body.maternity_leave_details?.expected_due_date &&
        day(body.maternity_leave_details.expected_due_date) <= day(body.start_date)
      ) {
        return fail(
          400,
          "400.010.019",
          "Bad request",
          "expected_due_date must be after start_date"
        );
      }

      if (type.name === "Maternity leave" && !body.maternity_leave_details?.expected_due_date) {
        return fail(
          400,
          "400.010.005",
          "Bad request",
          "maternity_leave_details is required for this leave type"
        );
      }

      const new_end = day(body.end_date ?? body.start_date);
      const overlaps = db.requests.some(
        (request) =>
          request.user_id === ME &&
          ["PENDING", "APPROVED", "PENDING_CANCELLATION"].includes(request.status) &&
          day(request.start_date) <= new_end &&
          day(request.end_date) >= day(body.start_date)
      );

      if (overlaps) {
        return fail(
          409,
          "409.010.001",
          "Conflict",
          "You already have a leave request that overlaps this date range"
        );
      }

      if (type.name === "Work from home") {
        const month = day(body.start_date).slice(0, 7);
        const used = db.requests
          .filter(
            (request) =>
              request.user_id === ME &&
              request.leave_type_id === type.id &&
              ["PENDING", "APPROVED"].includes(request.status) &&
              day(request.start_date).slice(0, 7) === month
          )
          .reduce((sum, request) => sum + workingDays(ME, request.start_date, request.end_date), 0);

        if (
          used + workingDays(ME, body.start_date, body.end_date) >
          db.policy.work_from_home_monthly_limit
        ) {
          return fail(
            400,
            "400.010.013",
            "Bad request",
            "This request would exceed the monthly work-from-home limit"
          );
        }
      }

      // porodiljsko: kraj računa backend iz polise
      if (type.name === "Maternity leave") {
        if (body.end_date) {
          return fail(
            400,
            "400.010.011",
            "Bad request",
            "end_date must not be provided for this leave type"
          );
        }

        const end = new Date(body.start_date);
        end.setUTCDate(end.getUTCDate() + db.policy.maternity_leave_days_first_second - 1);
        body.end_date = end.toISOString().slice(0, 19) + "Z";
      }

      const days = workingDays(ME, body.start_date, body.end_date);
      const balance = balancesOf(ME).find((item) => item.leave_type_id === type.id);

      if (type.counts_against_balance && balance.remaining_days < days) {
        return fail(400, "400.009.002", "Bad request", "Insufficient leave balance");
      }

      // saldo se rezerviše odmah (kao na pravom backendu)
      if (type.id === 1) {
        const me = findUser(ME);

        me.balance.used_days += days;
        me.balance.remaining_days -= days;
      } else if (type.counts_against_balance) {
        db.used_days[ME] = { ...db.used_days[ME], [type.id]: balance.used_days + days };
      }

      const request = {
        id: nextId(),
        user_id: ME,
        leave_type_id: type.id,
        start_date: body.start_date,
        end_date: body.end_date,
        status: type.requires_approval ? "PENDING" : "APPROVED",
        change_type: null,
        reason: body.reason ?? null,
        is_my_assignment: true,
        created_at: now()
      };

      db.requests.push(request);
      return ok(toRequest(request), 201);
    }
  ],
  [
    "GET",
    "leave/getSingleLeaveRequest/:id",
    ({ params }) => {
      const request = db.requests.find((item) => item.id === Number(params.id));

      if (!request) return notFound("Leave request");

      const type = findType(request.leave_type_id);
      const working_days = workingDays(request.user_id, request.start_date, request.end_date);
      const saldo = balancesOf(request.user_id).find(
        (item) => item.leave_type_id === request.leave_type_id
      );

      return ok({
        ...toRequest(request),
        working_days,
        rejection_reason: request.rejection_reason ?? null,
        // null za tipove bez salda, kao na pravom backendu
        balance: type.counts_against_balance
          ? {
              available: saldo.remaining_days,
              requested: working_days,
              remaining: saldo.remaining_days - working_days
            }
          : null,
        // odobrava tuđe zahteve na čekanju (prijavljeni je CompanyAdmin)
        can_approve:
          request.user_id !== ME && ["PENDING", "PENDING_CANCELLATION"].includes(request.status),
        updated_at: request.created_at
      });
    }
  ],
  [
    "POST",
    "leave/approveLeaveRequest/:id",
    ({ params }) => {
      const request = db.requests.find((item) => item.id === Number(params.id));

      if (!request) return notFound("Leave request");

      request.status = request.change_type === "CANCELLATION" ? "CANCELLED" : "APPROVED";
      request.change_type = null;
      return ok({ id: request.id, status: request.status });
    }
  ],
  [
    "POST",
    "leave/rejectLeaveRequest/:id",
    ({ params, body }) => {
      const request = db.requests.find((item) => item.id === Number(params.id));

      if (!request) return notFound("Leave request");
      if (!body?.reason) {
        return fail(400, "400.001.003", "Invalid request body", "Field 'reason' cannot be empty");
      }

      request.status = "REJECTED";
      request.rejection_reason = body.reason;
      return ok({ id: request.id, status: request.status });
    }
  ],
  // 9.6 povlačenje na čekanju, 9.7 otkazivanje odobrenog
  [
    "PATCH",
    "leave/withdrawLeaveRequest/:id",
    ({ params }) => {
      const request = db.requests.find((item) => item.id === Number(params.id));

      if (!request) return notFound("Leave request");
      if (request.status !== "PENDING") {
        return fail(
          409,
          "409.010.003",
          "Conflict",
          "Only requests in PENDING status can be withdrawn"
        );
      }

      request.status = "CANCELLED";
      return ok({ id: request.id, status: request.status, updated_at: now() });
    }
  ],
  [
    "PATCH",
    "leave/cancelLeaveRequest/:id",
    ({ params }) => {
      const request = db.requests.find((item) => item.id === Number(params.id));

      if (!request) return notFound("Leave request");
      if (request.status !== "APPROVED") {
        return fail(
          409,
          "409.010.004",
          "Conflict",
          "Only requests in APPROVED status can be cancelled"
        );
      }

      request.status = "PENDING_CANCELLATION";
      return ok({ id: request.id, status: request.status, updated_at: now() });
    }
  ],

  // 10. TIPOVI ODSUSTVA
  ["GET", "leaveType/getLeaveTypes", ({ query }) => paginate(db.leave_types, query, "leave_types")],
  [
    "POST",
    "leaveType/createLeaveType",
    ({ body }) => {
      const type = { ...body, id: nextId(), is_system: false };

      db.leave_types.push(type);
      return ok(type, 201);
    }
  ],
  [
    "PATCH",
    "leaveType/updateLeaveType/:id",
    ({ params, body }) => {
      const type = findType(params.id);

      if (!type) return notFound("Leave type");

      Object.assign(type, body);
      return ok(type);
    }
  ],
  [
    "DELETE",
    "leaveType/deleteLeaveType/:id",
    ({ params }) => {
      const type = findType(params.id);

      if (!type) return notFound("Leave type");
      if (type.is_system) {
        return fail(403, "403.011.001", "Forbidden", "System leave types cannot be deleted");
      }

      db.leave_types = db.leave_types.filter((item) => item !== type);
      return ok({ message: "Deleted" });
    }
  ],

  // 13. SALDA
  ["GET", "leaveBalance/getMyLeaveBalances", () => ok({ year: YEAR, balances: balancesOf(ME) })],
  [
    "GET",
    "leaveBalance/getUserLeaveBalances/:id",
    ({ params }) =>
      findUser(params.id)
        ? ok({ year: YEAR, balances: balancesOf(Number(params.id)) })
        : notFound("User")
  ],

  // 15. DASHBOARD (lični panel)
  [
    "GET",
    "dashboard/getUserRequestsSummary",
    () => {
      const mine = db.requests.filter((request) => request.user_id === ME);
      const count = (status) => mine.filter((request) => request.status === status).length;

      return ok({
        pending_requests_count: count("PENDING"),
        approved_requests_count: count("APPROVED"),
        next_upcoming_leave: null
      });
    }
  ],
  [
    "GET",
    "dashboard/getUserBalanceSummary",
    () => {
      const { allocated_days, used_days, remaining_days } = findUser(ME).balance;

      return ok({
        annual_leave: { used: used_days, entitled: allocated_days, remaining: remaining_days },
        carryover_expiring_days: { days_remaining: 2, expires_on: `${YEAR + 1}-06-01T00:00:00Z` },
        general_leave_days_used: { used: 3, entitled: 5, remaining: 2 }
      });
    }
  ],
  [
    "GET",
    "dashboard/getUserWorkFromHomeGraph",
    () =>
      ok({
        monthly_limit: 10,
        monthly_breakdown: [9, 6.6, 1.2, 7.4, 5, 9, 1.4, 1.5, 1.4, 4.8, 1.3, 0.3].map(
          (days_used, index) => ({ month: index + 1, days_used })
        )
      })
  ],
  [
    "GET",
    "dashboard/getUserAnnualLeaveGraph",
    () =>
      ok({
        monthly_breakdown: [0, 2, 0, 1, 5, 0, 8, 6, 0, 3, 0, 4].map((days_used, index) => ({
          month: index + 1,
          days_used
        }))
      })
  ],

  // 15. DASHBOARD
  [
    "GET",
    "team/getTeams",
    ({ query }) =>
      paginate(
        Object.entries(TEAMS).map(([id, name]) => teamRow(Number(id), name)),
        query,
        "teams"
      )
  ],
  [
    "GET",
    "team/getSingleTeam/:id",
    ({ params, query }) => {
      if (!TEAMS[params.id]) return notFound("Team");

      return paginate(teamMembers(Number(params.id)).map(listUser), query, "members");
    }
  ],
  [
    "POST",
    "team/createTeam",
    ({ body }) => {
      const name = String(body?.name ?? "").trim();

      if (!name)
        return fail(400, "400.001.003", "Invalid request body", "Field name cannot be empty");
      if (teamNameTaken(name)) return fail(409, "409.012.001", "Conflict", "Team already exists");

      const id = Math.max(...Object.keys(TEAMS).map(Number)) + 1;

      TEAMS[id] = name;
      if (body.team_lead_id) db.team_leads[id] = Number(body.team_lead_id);

      return ok(teamRow(id, name), 201);
    }
  ],
  [
    "PATCH",
    "team/updateTeam/:id",
    ({ params, body }) => {
      const id = Number(params.id);

      if (!TEAMS[id]) return notFound("Team");

      if ("name" in body) {
        const name = String(body.name ?? "").trim();

        if (!name)
          return fail(400, "400.001.003", "Invalid request body", "Field name cannot be empty");
        if (teamNameTaken(name, id))
          return fail(409, "409.012.001", "Conflict", "Team already exists");

        TEAMS[id] = name;
      }

      if ("team_lead_id" in body)
        db.team_leads[id] = body.team_lead_id ? Number(body.team_lead_id) : null;

      return ok(teamRow(id, TEAMS[id]));
    }
  ],
  [
    "DELETE",
    "team/deleteTeam/:id",
    ({ params }) => {
      const id = Number(params.id);

      if (!TEAMS[id]) return notFound("Team");

      db.users.forEach((user) => {
        if (user.team_id === id) user.team_id = null;
      });
      delete TEAMS[id];
      delete db.team_leads[id];

      return ok(null);
    }
  ],
  [
    "PATCH",
    "team/assignUsersToTeam/:id",
    ({ params, body }) => {
      const id = Number(params.id);

      if (!TEAMS[id]) return notFound("Team");

      (body?.user_ids ?? []).forEach((user_id) => {
        const user = findUser(user_id);
        if (user) user.team_id = id;
      });

      return ok(teamRow(id, TEAMS[id]));
    }
  ],
  [
    "PATCH",
    "team/removeUsersFromTeam/:id",
    ({ params, body }) => {
      const id = Number(params.id);

      if (!TEAMS[id]) return notFound("Team");

      (body?.user_ids ?? []).forEach((user_id) => {
        const user = findUser(user_id);
        if (user?.team_id === id) user.team_id = null;
      });

      return ok(teamRow(id, TEAMS[id]));
    }
  ],
  [
    "GET",
    "dashboard/getTeamRequestsSummary",
    ({ query }) => {
      const team_id = Number(query.get("team_id"));
      const members = db.users.filter((user) => user.team_id === team_id);
      const ids = new Set(members.map((user) => user.id));
      const requests = db.requests.filter((request) => ids.has(request.user_id));
      const today = toDay(new Date());
      const count = (status) => requests.filter((request) => request.status === status).length;

      return ok({
        team_id,
        team_name: TEAMS[team_id],
        pending_requests_count: count("PENDING"),
        approved_requests_count: count("APPROVED"),
        currently_absent: requests
          .filter(
            (request) =>
              request.status === "APPROVED" &&
              day(request.start_date) <= today &&
              day(request.end_date) >= today
          )
          .map((request) => {
            const user = findUser(request.user_id);

            return {
              user_id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              leave_type_name: findType(request.leave_type_id).name,
              start_date: request.start_date,
              end_date: request.end_date
            };
          })
      });
    }
  ],
  [
    "GET",
    "dashboard/getTeamBalanceSummary",
    ({ query }) => {
      const team_id = Number(query.get("team_id"));
      const members = db.users
        .filter((user) => user.team_id === team_id)
        .map((user) => ({
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          annual_leave: {
            used: user.balance.used_days,
            entitled: user.balance.allocated_days,
            remaining: user.balance.remaining_days
          }
        }));
      const used = members.reduce((sum, member) => sum + member.annual_leave.used, 0);
      const entitled = members.reduce((sum, member) => sum + member.annual_leave.entitled, 0);

      return ok({
        team_id,
        team_name: TEAMS[team_id],
        average_utilization_percentage: entitled ? Math.round((used / entitled) * 100) : 0,
        members
      });
    }
  ],
  ...["getTeamWorkFromHomeGraph", "getTeamAnnualLeaveGraph"].map((name, index) => [
    "GET",
    `dashboard/${name}`,
    ({ query }) =>
      ok({
        team_id: Number(query.get("team_id")),
        team_name: TEAMS[query.get("team_id")],
        monthly_breakdown: (index
          ? [3, 6, 2, 4, 9, 12, 18, 15, 4, 6, 2, 8]
          : [9, 7, 2, 8, 6, 9, 2, 2, 2, 6, 2, 1]
        ).map((days_used, month) => ({ month: month + 1, days_used }))
      })
  ]),
  [
    "GET",
    "dashboard/getCompanyRequestsSummary",
    () => {
      const today = toDay(new Date());
      const count = (status) => db.requests.filter((request) => request.status === status).length;

      return ok({
        pending_requests_count: count("PENDING"),
        approved_requests_count: count("APPROVED"),
        currently_absent: db.requests
          .filter(
            (request) =>
              request.status === "APPROVED" &&
              day(request.start_date) <= today &&
              day(request.end_date) >= today
          )
          .map((request) => {
            const user = findUser(request.user_id);

            return {
              user_id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              leave_type_name: findType(request.leave_type_id).name,
              start_date: request.start_date,
              end_date: request.end_date
            };
          })
      });
    }
  ],
  [
    "GET",
    "dashboard/getCompanyBalanceSummary",
    () => {
      const active = db.users.filter((user) => user.status === "ACTIVE");
      const percentage = (users) => {
        const used = users.reduce((sum, user) => sum + user.balance.used_days, 0);
        const entitled = users.reduce((sum, user) => sum + user.balance.allocated_days, 0);

        return entitled ? Math.round((used / entitled) * 1000) / 10 : 0;
      };

      return ok({
        average_utilization_percentage: percentage(active),
        active_employee_count: active.length,
        deactivated_employee_count: db.users.filter((user) => user.status === "DEACTIVATED").length,
        team_breakdown: Object.entries(TEAMS).map(([id, name]) => ({
          team_id: Number(id),
          team_name: name,
          average_utilization_percentage: percentage(
            active.filter((user) => user.team_id === Number(id))
          )
        }))
      });
    }
  ],
  ...["getCompanyWorkFromHomeGraph", "getCompanyAnnualLeaveGraph"].map((name, index) => [
    "GET",
    `dashboard/${name}`,
    () =>
      ok({
        monthly_breakdown: (index
          ? [12, 9, 14, 18, 22, 31, 46, 52, 17, 13, 9, 24]
          : [8, 6, 1, 7, 5, 9, 5, 4, 7, 6, 5, 3]
        ).map((days_used, month) => ({ month: month + 1, days_used }))
      })
  ]),
  [
    "GET",
    "dashboard/getMemberRequestsSummary/:id",
    ({ params }) => {
      const mine = db.requests.filter((request) => request.user_id === Number(params.id));
      const count = (status) => mine.filter((request) => request.status === status).length;

      return ok({
        user_id: Number(params.id),
        pending_requests_count: count("PENDING"),
        approved_requests_count: count("APPROVED"),
        next_upcoming_leave: null
      });
    }
  ],
  ...["getMemberWorkFromHomeGraph", "getMemberAnnualLeaveGraph"].map((name, index) => [
    "GET",
    `dashboard/${name}/:id`,
    ({ params }) =>
      ok({
        user_id: Number(params.id),
        monthly_limit: 10,
        monthly_breakdown: (index
          ? [0, 1, 0, 0, 2, 3, 5, 4, 0, 1, 0, 2]
          : [2, 1, 0, 3, 1, 2, 0, 0, 1, 2, 0, 0]
        ).map((days_used, month) => ({ month: month + 1, days_used }))
      })
  ]),

  // 14. DELEGACIJE
  [
    "GET",
    "delegation/getAllDelegations",
    ({ query }) => {
      const status = query.get("status");
      const items = db.delegations
        .filter((item) => !status || item.status === status)
        .map(toDelegationListItem);

      return paginate(items, query, "items");
    }
  ],
  [
    "GET",
    "delegation/getMyDelegations",
    ({ query }) => {
      const status = query.get("status");
      const items = db.delegations
        .filter((item) => item.delegator_id === ME)
        .filter((item) => !status || item.status === status)
        .map(toDelegationListItem);

      return paginate(items, query, "items");
    }
  ],
  [
    "GET",
    "delegation/getMyActiveDelegation",
    () => {
      const today = toDay(new Date());
      const active = db.delegations.find(
        (item) =>
          item.delegator_id === ME && item.status === "ACTIVE" && day(item.end_date) >= today
      );

      return active ? ok(active) : fail(404, "404.014.001", "Not found", "No active delegation");
    }
  ],
  ["POST", "delegation/createMyDelegation", ({ body }) => createDelegation(ME, body)],
  [
    "POST",
    "delegation/createDelegationForUser",
    ({ body }) => createDelegation(body.delegator_id, body)
  ],
  [
    "PATCH",
    "delegation/updateMyDelegation/:id",
    ({ params, body }) => updateDelegation(params.id, body)
  ],
  [
    "PATCH",
    "delegation/updateDelegation/:id",
    ({ params, body }) => updateDelegation(params.id, body)
  ],
  [
    "PATCH",
    "delegation/cancelMyDelegation/:id",
    ({ params }) => updateDelegation(params.id, { status: "CANCELLED" })
  ],
  [
    "PATCH",
    "delegation/cancelDelegation/:id",
    ({ params }) => updateDelegation(params.id, { status: "CANCELLED" })
  ],

  // 16. IZVEŠTAJI
  [
    "GET",
    "report/getReportHistory",
    ({ query }) =>
      paginate(
        [...db.reports].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        query,
        "items"
      )
  ],
  [
    "POST",
    "report/generateReport",
    ({ body }) => {
      const report = {
        id: nextId(),
        description: "",
        recipients: [],
        team_id: null,
        ...body,
        team_name: body.team_id ? TEAMS[body.team_id] : null,
        generated_by: person(ME),
        created_at: now()
      };

      db.reports.unshift(report);
      return ok(report, 201);
    }
  ],
  [
    "GET",
    "report/downloadReportHistory/:id",
    () => new Response(MOCK_PDF, { headers: { "Content-Type": "application/pdf" } })
  ],

  // 17. KALENDAR
  [
    "GET",
    "calendar/getCalendarSummary",
    ({ query }) => {
      const entries = calendarRequests(query);
      const status = query.get("status");
      const by_type = new Map();

      // status sužava samo by_leave_type, tabovi uvijek gledaju sve statuse
      entries
        .filter((request) => !status || request.status === status)
        .forEach((request) => {
          const type = findType(request.leave_type_id);
          const current = by_type.get(type.id) ?? {
            leave_type_id: type.id,
            leave_type_name: type.name,
            count: 0
          };

          by_type.set(type.id, { ...current, count: current.count + 1 });
        });

      return ok({
        total_count: entries.length,
        pending_count: entries.filter((request) => request.status === "PENDING").length,
        approved_count: entries.filter((request) => request.status === "APPROVED").length,
        by_leave_type: [...by_type.values()]
      });
    }
  ],
  [
    "GET",
    "calendar/getCalendarEntries",
    ({ query }) => {
      const status = query.get("status");
      const type = query.get("leave_type_id");
      const search = query.get("search")?.trim().toLowerCase();

      const entries = calendarRequests(query)
        .filter((request) => !status || request.status === status)
        .filter((request) => !type || request.leave_type_id === Number(type))
        .map((request) => {
          const user = findUser(request.user_id);

          return {
            leave_request_id: request.id,
            user_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            team_id: user.team_id ?? null,
            team_name: TEAMS[user.team_id] ?? null,
            leave_type_id: request.leave_type_id,
            leave_type_name: findType(request.leave_type_id).name,
            status: request.status,
            start_date: request.start_date,
            end_date: request.end_date
          };
        })
        .filter(
          (entry) =>
            !search || `${entry.first_name} ${entry.last_name}`.toLowerCase().includes(search)
        );

      return ok({
        entries,
        holidays:
          query.get("show_holidays") === "true"
            ? holidaysFor(ME, query.get("date_from"), query.get("date_to"))
            : [],
        include_weekends_in_calendar: false
      });
    }
  ],

  // 18. ISTORIJA AKTIVNOSTI
  [
    "GET",
    "auditLog/getAuditLog",
    ({ query }) => {
      const type = query.get("audit_type");
      const from = query.get("date_from");
      const to = query.get("date_to");
      const items = db.audit_log
        .filter((entry) => !type || entry.audit_type === type)
        .filter((entry) => !from || day(entry.created_at) >= day(from))
        .filter((entry) => !to || day(entry.created_at) <= day(to))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      return paginate(items, query, "entries");
    }
  ],

  // 8. KOMPANIJA
  ["GET", "company/getCompany", () => ok(db.company)],
  [
    "PATCH",
    "company/updateCompany",
    ({ body }) => {
      const empty = ["name", "address", "contact"].find(
        (key) => key in body && !String(body[key]).trim()
      );

      if (empty) {
        return fail(400, "400.001.003", "Invalid request body", `Field ${empty} cannot be empty`);
      }

      Object.assign(db.company, body, { updated_at: new Date().toISOString() });

      return ok(db.company);
    }
  ],

  // HIJERARHIJA (nije u API dokumentaciji), deaktivirani ne ulaze u stablo
  [
    "GET",
    "hierarchy/getHierarchy",
    () => {
      const users = db.users.filter((user) => user.status !== "DEACTIVATED");
      const ids = new Set(users.map((user) => user.id));

      return ok({
        nodes: users.map((user) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          status: user.status,
          position: db.positions[user.id] ?? null,
          // nadređeni koji nije u stablu -> korijen
          manager_id: ids.has(user.manager_id) ? user.manager_id : null,
          team: user.team_id ? { id: user.team_id, name: TEAMS[user.team_id] } : null,
          role: { id: user.role_id, name: findRole(user.role_id)?.name }
        }))
      });
    }
  ],

  // LANCI ODOBRAVANJA (nije u API dokumentaciji)
  [
    "GET",
    "approvalChain/getApprovalChains",
    ({ query }) => paginate(db.approval_chains.map(toApprovalChain), query, "approval_chains")
  ],
  [
    "POST",
    "approvalChain/createApprovalChain",
    ({ body }) => {
      const chain = approvalChainFrom(body ?? {});
      const error = validateApprovalChain(chain);

      if (error) return error;

      const created = { ...chain, id: nextId(), created_at: now(), updated_at: now() };

      db.approval_chains.push(created);
      return ok(toApprovalChain(created), 201);
    }
  ],
  [
    "PATCH",
    "approvalChain/updateApprovalChain/:id",
    ({ params, body }) => {
      const chain = db.approval_chains.find((item) => item.id === Number(params.id));

      if (!chain) return fail(404, "404.022.001", "Not found", "Approval chain not found");

      // šalje se samo ono što se promijenilo
      const merged = approvalChainFrom({ ...chain, ...body });
      const error = validateApprovalChain(merged, chain.id);

      if (error) return error;

      Object.assign(chain, merged, { updated_at: now() });
      return ok(toApprovalChain(chain));
    }
  ],
  [
    "DELETE",
    "approvalChain/deleteApprovalChain/:id",
    ({ params }) => {
      const exists = db.approval_chains.some((item) => item.id === Number(params.id));

      if (!exists) return fail(404, "404.022.001", "Not found", "Approval chain not found");

      db.approval_chains = db.approval_chains.filter((item) => item.id !== Number(params.id));
      return ok({ message: "Deleted" });
    }
  ],

  // 19. AKTIVNI DIREKTORIJUM
  ["GET", "ad/getAdSettings", () => ok(db.ad)],
  [
    "PATCH",
    "ad/updateAdSettings",
    ({ body }) => {
      Object.assign(db.ad, body, { tested_at: null });

      // lozinka i auth_type se nikad ne vraćaju
      const { auth_type, ldap_bind_password, ...settings } = db.ad;

      return ok(settings);
    }
  ],
  [
    "POST",
    "ad/testAdConnection",
    () => {
      // host sa "fail" u imenu daje neuspješan test
      if (db.ad.ldap_host.includes("fail")) {
        return fail(400, "400.020.001", "Bad request", "Cannot connect to AD server");
      }

      db.ad.tested_at = now();
      return ok({ tested_at: db.ad.tested_at });
    }
  ],
  [
    "PATCH",
    "ad/updateAuthenticationMethod",
    ({ body }) => {
      db.ad.auth_type = body.auth_type;
      return ok({ auth_type: db.ad.auth_type });
    }
  ],
  [
    "POST",
    "ad/triggerAdSync",
    () => ok({ created: 2, updated: 11, deactivated: 1, reactivated: 0 })
  ],
  // 20. OBAVEŠTENJA
  [
    "GET",
    "notification/getAllNotifications",
    ({ query }) => {
      const sorted = [...db.notifications].sort((a, b) => b.created_at.localeCompare(a.created_at));

      return paginate(sorted, query, "notifications");
    }
  ],
  [
    "GET",
    "notification/getUnreadCount",
    () => ok({ total_count: db.notifications.filter((item) => !item.read_at).length })
  ],
  [
    "PATCH",
    "notification/markAsRead/:id",
    ({ params }) => {
      const notification = db.notifications.find((item) => item.id === Number(params.id));

      if (!notification) return fail(404, "404.021.002", "Not found", "Notification not found");

      notification.read_at ??= now();
      return ok(null);
    }
  ],
  [
    "PATCH",
    "notification/markAllAsRead",
    () => {
      db.notifications.forEach((item) => (item.read_at ??= now()));
      return ok(null);
    }
  ]
];

// "user/getSingleUser/:id" -> regex
const COMPILED = ROUTES.map(([method, path, handler]) => ({
  method,
  pattern: new RegExp(`^${path.replace(/:(\w+)/g, "(?<$1>[^/]+)")}$`),
  handler
}));

const readBody = (body) => {
  if (!body || body instanceof FormData) return body ?? null;

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const real_fetch = window.fetch.bind(window);

window.fetch = async (input, options = {}) => {
  const url = new URL(String(input), window.location.href);

  if (!String(input).startsWith(API_URL)) return real_fetch(input, options);

  const endpoint = url.pathname.split("/api/v1/")[1] ?? "";
  const method = (options.method ?? "GET").toUpperCase();

  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));

  for (const route of COMPILED) {
    const match = route.method === method && route.pattern.exec(endpoint);

    if (match) {
      return route.handler({
        params: match.groups ?? {},
        body: readBody(options.body),
        query: url.searchParams
      });
    }
  }

  console.warn(`[mock] nema lažnog odgovora za ${method} ${endpoint}`);
  return fail(404, "404.000.000", "Not found", `Mock: ${method} ${endpoint} nije podržan`);
};

// bez prijave: token i korisnik su postavljeni odmah
// poslije odjave login radi normalno, prolazi bilo koji email i lozinka
const auth_store = useAuthStore();

auth_store.token = "mock-access";
auth_store.user = authUser(findUser(ME));

router.beforeEach((to, from) => {
  if (from !== START_LOCATION) return;

  if (["login", "two-factor", "two-factor-verify"].includes(to.name)) return { name: "home" };
});

console.info(`[mock] ${APP_NAME} radi sa lažnim podacima, bez prijave — backend se ne poziva.`);
