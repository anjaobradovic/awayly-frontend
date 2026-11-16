// lažni podaci za npm run dev:mock, oblik je isti kao u API dokumentaciji
// danas je stvarni današnji datum

const pad = (value) => String(value).padStart(2, "0");

export const toDay = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// datum pomjeren za days dana od danas, u obliku koji šalje server
export const daysFromToday = (days, time = "00:00:00") => {
  const date = new Date();

  date.setDate(date.getDate() + days);
  return `${toDay(date)}T${time}Z`;
};

export const YEAR = new Date().getFullYear();

export const TEAMS = {
  3: "Software Development",
  4: "Product Design",
  5: "UI/UX Research",
  6: "Data Analysis"
};

export const PERMISSION_KEYS = [
  "REQUEST.APPROVE.TEAM",
  "REQUEST.APPROVE.ALL",
  "BALANCE.VIEW.TEAM",
  "BALANCE.VIEW.ALL",
  "BALANCE.MANAGE.ALL",
  "USER.MANAGE",
  "REPORT.GENERATE.TEAM",
  "REPORT.GENERATE.ALL",
  "AUDIT_LOG.VIEW",
  "HIERARCHY.MANAGE",
  "DELEGATION.MANAGE.OTHERS"
];

// tipovi odsustva (10.1)
// [naziv, requires_approval, notice, requires_reason, allow_past, counts_against_balance]
export const createLeaveTypes = () =>
  [
    ["Annual leave", true, 7, false, false, true],
    ["Work from home", true, 1, false, false, true],
    ["Sick leave", false, 0, true, true, false],
    ["Sick day", false, 0, false, true, false],
    ["Pregnancy sick leave", true, 0, true, true, false],
    ["Maternity leave", true, 30, false, false, false],
    ["Parental leave", true, 30, false, false, false],
    ["Paid leave-General", true, 3, true, false, true],
    ["Paid leave-Blood donation", false, 0, false, true, true],
    ["Paid leave-Family death", false, 0, true, true, true],
    ["Slava/Krsna slava-Family patron saint day", true, 7, false, false, false],
    ["Unpaid leave", true, 14, true, false, false]
  ]
    .map(([name, requires_approval, notice, requires_reason, allow_past, counts], index) => ({
      id: index + 1,
      name,
      requires_approval,
      is_system: true,
      min_advance_notice_days: notice,
      requires_reason,
      allow_past_dates: allow_past,
      counts_against_balance: counts
    }))
    .concat({
      id: 13,
      name: "Dodatni dani",
      requires_approval: true,
      is_system: false,
      min_advance_notice_days: 2,
      requires_reason: false,
      allow_past_dates: false,
      counts_against_balance: false
    });

// uloge (7.1)
export const createRoles = () => [
  {
    id: 1,
    name: "CompanyAdmin",
    description: "Full access",
    is_system: true,
    permissions: [...PERMISSION_KEYS].filter((key) => key !== "REQUEST.APPROVE.TEAM"),
    approval_scopes: []
  },
  {
    id: 2,
    name: "Employee",
    description: "Basic role",
    is_system: true,
    permissions: [],
    approval_scopes: []
  },
  {
    id: 3,
    name: "Menadžer tima",
    description: "Odobrava zahteve i vidi salda svog tima, generiše timske izveštaje.",
    is_system: false,
    permissions: ["REQUEST.APPROVE.TEAM", "BALANCE.VIEW.TEAM", "REPORT.GENERATE.TEAM"],
    approval_scopes: []
  },
  {
    id: 4,
    name: "HR",
    description: "Upravlja zaposlenima i saldima, vidi istoriju aktivnosti.",
    is_system: false,
    permissions: ["USER.MANAGE", "BALANCE.VIEW.ALL", "BALANCE.MANAGE.ALL", "AUDIT_LOG.VIEW"],
    approval_scopes: []
  }
];

// zaposleni (4.2 / 4.3)
// [ime, prezime, tim, uloga, nadređeni, status, religija, preostalo/ukupno godišnjeg]
const USER_ROWS = [
  ["Anja", "Obradović", 3, 1, null, "ACTIVE", "ORTHODOX", [12, 22]],
  ["Joan", "Heller", 3, 3, 1, "ACTIVE", "CATHOLIC", [8, 21]],
  ["Cynthia", "Marsh", 4, 3, 1, "ACTIVE", "NONE", [15, 22]],
  ["Rita", "Krajcik", 5, 3, 1, "ACTIVE", "ORTHODOX", [5, 20]],
  ["Angela", "McKenzie", 6, 4, 1, "ACTIVE", "NONE", [19, 24]],
  ["Randal", "Jerde", 3, 2, 2, "ACTIVE", "ORTHODOX", [10, 20]],
  ["Rose", "Blick", 3, 2, 2, "ACTIVE", "MUSLIM", [2, 20]],
  ["May", "Wuckert", 4, 2, 3, "ACTIVE", "ORTHODOX", [14, 21]],
  ["Doreen", "Sanford", 4, 2, 3, "PENDING_INVITE", "NONE", [20, 20]],
  ["Bennett", "Wiegand", 5, 2, 4, "ACTIVE", "CATHOLIC", [7, 22]],
  ["Ellen", "Huels", 6, 2, 5, "ACTIVE", "JEWISH", [11, 20]],
  ["Keith", "Hane", 6, 2, 5, "DEACTIVATED", "NONE", [0, 20]],
  ["Lacy", "Ritchie", 5, 2, 4, "ACTIVE", "ORTHODOX", [16, 21]],
  ["Stefan", "Ilić", 3, 2, 2, "ACTIVE", "ORTHODOX", [9, 20]],
  ["Jelena", "Nikolić", 4, 2, 3, "ACTIVE", "ORTHODOX", [21, 23]]
];

const ascii = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const createUsers = () =>
  USER_ROWS.map(
    (
      [first_name, last_name, team_id, role_id, manager_id, status, religion, [left, total]],
      index
    ) => ({
      id: index + 1,
      first_name,
      last_name,
      email: ascii(`${first_name}.${last_name}@codebron.rs`).toLowerCase(),
      phone_number: `+38164${String(1234567 + index * 7919).slice(0, 7)}`,
      hire_date: `${2018 + (index % 7)}-${pad((index % 12) + 1)}-01T00:00:00Z`,
      date_of_birth: `${1985 + (index % 13)}-${pad(((index * 5) % 12) + 1)}-${pad((index % 27) + 1)}T00:00:00Z`,
      status,
      onboarding_type: index % 3 ? "NEW_EMPLOYEE" : "EXISTING_EMPLOYEE",
      religion,
      team_id,
      role_id,
      manager_id,
      auth_type: "LOCAL",
      two_factor_configured: status === "ACTIVE",
      permanent_backup_id: index === 0 ? 2 : null,
      termination_date: null,
      created_at: "2026-01-10T09:00:00Z",
      updated_at: "2026-01-10T09:00:00Z",
      balance: { allocated_days: total, used_days: total - left, remaining_days: left }
    })
  );

// praznici (3.1 / 3.2)
export const createGlobalHolidays = () =>
  [
    ["01-01", "NATIONAL", "Nova godina", null],
    ["01-02", "NATIONAL", "Nova godina (drugi dan)", null],
    ["01-07", "RELIGIOUS", "Božić", "ORTHODOX"],
    ["02-15", "NATIONAL", "Dan državnosti Srbije", null],
    ["02-16", "NATIONAL", "Dan državnosti Srbije (drugi dan)", null],
    ["04-10", "RELIGIOUS", "Veliki petak", "ORTHODOX"],
    ["04-13", "RELIGIOUS", "Vaskrs (ponedeljak)", "ORTHODOX"],
    ["04-05", "RELIGIOUS", "Uskrs", "CATHOLIC"],
    ["05-01", "NATIONAL", "Praznik rada", null],
    ["05-02", "NATIONAL", "Praznik rada (drugi dan)", null],
    ["03-20", "RELIGIOUS", "Ramazanski bajram", "MUSLIM"],
    ["05-27", "RELIGIOUS", "Kurban bajram", "MUSLIM"],
    ["09-21", "RELIGIOUS", "Jom Kipur", "JEWISH"],
    ["11-11", "NATIONAL", "Dan primirja", null],
    ["12-25", "RELIGIOUS", "Božić", "CATHOLIC"]
  ].flatMap(([date, type, name, religion], index) =>
    [YEAR - 1, YEAR, YEAR + 1].map((year, offset) => ({
      id: index * 3 + offset + 1,
      date: `${year}-${date}T00:00:00Z`,
      type,
      name,
      religion
    }))
  );

export const createCompanyHolidays = () => [
  { id: 1, date: `${YEAR}-06-12T00:00:00Z`, name: "Dan kompanije" },
  { id: 2, date: `${YEAR}-12-31T00:00:00Z`, name: "Novogodišnji kolektivni odmor" },
  { id: 3, date: `${YEAR}-08-14T00:00:00Z`, name: "Team building" }
];

// zahtjevi za odsustvo (9.2 / 9.3)
// [korisnik, tip, početak (dana od danas), trajanje, status, change_type, moja dodela]
const REQUEST_ROWS = [
  [6, 1, 5, 5, "PENDING", null, true],
  [7, 2, 2, 1, "PENDING", null, true],
  [14, 1, 20, 10, "PENDING", null, true],
  [8, 3, -2, 3, "APPROVED", null, true],
  [10, 8, 4, 1, "PENDING", null, false],
  [11, 9, 1, 1, "PENDING", null, true],
  [13, 6, 30, 90, "PENDING", null, true],
  [15, 1, 12, 4, "PENDING", "MODIFICATION", true],
  [2, 2, 3, 2, "PENDING_CANCELLATION", "CANCELLATION", true],
  [3, 12, 40, 7, "PENDING", null, false],
  [4, 11, 25, 1, "PENDING", null, true],
  [5, 10, 0, 2, "PENDING", null, true],
  [9, 13, 8, 2, "PENDING", null, true],
  [6, 2, -10, 1, "REJECTED", null, true]
];

export const createApproveRequests = () =>
  REQUEST_ROWS.map(([user_id, leave_type_id, start, length, status, change_type, mine], index) => ({
    id: index + 1,
    user_id,
    leave_type_id,
    start_date: daysFromToday(start),
    end_date: daysFromToday(start + length - 1),
    status,
    change_type,
    is_my_assignment: mine,
    reason: index % 3 ? null : "Porodične obaveze",
    created_at: daysFromToday(-3 - (index % 5), `${pad(8 + (index % 9))}:20:00`)
  }));

// moji zahtevi (prijavljen je korisnik 1)
export const createMyRequests = () =>
  [
    [1, -60, 5, "APPROVED"],
    [2, -20, 1, "APPROVED"],
    [1, 15, 3, "PENDING"],
    [4, -35, 1, "APPROVED"],
    [8, 9, 1, "REJECTED"],
    [2, 6, 1, "CANCELLED"]
  ].map(([leave_type_id, start, length, status], index) => ({
    id: 100 + index,
    user_id: 1,
    leave_type_id,
    start_date: daysFromToday(start),
    end_date: daysFromToday(start + length - 1),
    status,
    change_type: null,
    reason: null,
    created_at: daysFromToday(start - 10, "10:00:00")
  }));

// odobrena odsustva za mapu i panele
const ABSENT_TODAY = [
  [2, 1, -3, 12],
  [6, 3, -1, 3],
  [13, 1, -5, 9],
  [10, 8, 0, 1],
  [5, 12, -2, 6],
  [14, 2, 0, 1]
];

export const createTeamAbsences = () => {
  const users = [2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15];
  const types = [1, 1, 1, 2, 2, 3, 4, 8, 12];

  const year_rows = Array.from({ length: 220 }, (_, index) => {
    const start = new Date(YEAR, 0, 2 + ((index * 53) % 361));
    const end = new Date(start);

    end.setDate(end.getDate() + ((index * 7) % 5));

    return [users[index % users.length], types[index % types.length], toDay(start), toDay(end)];
  });

  // danas su odsutni samo oni iz ABSENT_TODAY
  const today = toDay(new Date());
  const past_and_future = year_rows.filter(([, , start, end]) => end < today || start > today);

  const today_rows = ABSENT_TODAY.map(([user_id, leave_type_id, start, length]) => [
    user_id,
    leave_type_id,
    daysFromToday(start).slice(0, 10),
    daysFromToday(start + length - 1).slice(0, 10)
  ]);

  return [...past_and_future, ...today_rows].map(([user_id, leave_type_id, start, end], index) => ({
    id: 300 + index,
    user_id,
    leave_type_id,
    start_date: `${start}T00:00:00Z`,
    end_date: `${end}T00:00:00Z`,
    status: "APPROVED",
    change_type: null,
    is_my_assignment: false,
    reason: null,
    created_at: `${start}T08:00:00Z`
  }));
};

// delegacije (14.x)
export const createDelegations = () =>
  [
    [1, 2, -2, 10, "ACTIVE"],
    [3, 7, 5, 14, "ACTIVE"],
    [4, 13, -40, -30, "CANCELLED"],
    [2, 6, 20, 27, "ACTIVE"],
    [5, 11, -15, -5, "ACTIVE"],
    [1, 5, -90, -80, "CANCELLED"],
    [3, 15, 30, 33, "ACTIVE"]
  ].map(([delegator_id, delegate_id, start, end, status], index) => ({
    id: index + 1,
    delegator_id,
    delegate_id,
    start_date: daysFromToday(start),
    end_date: daysFromToday(end),
    status,
    created_at: daysFromToday(start - 7, "09:30:00"),
    updated_at: daysFromToday(start - (index % 2 ? 7 : 3), "09:30:00")
  }));

// polisa (2.x)
export const DEFAULT_POLICY = {
  balance_model: "MODEL_A",
  negative_balance_allowed: false,
  max_negative_balance: 0,
  annual_leave_days: 20,
  eligibility_period_days: 30,
  first_part_min_days: 10,
  max_carryover_days: 10,
  carryover_deadline_month: 6,
  carryover_deadline_day: 30,
  paid_leave_general_days: 5,
  paid_leave_blood_donation_days: 2,
  paid_leave_family_death_days: 5,
  maternity_leave_days_first_second: 365,
  maternity_leave_days_third_plus: 730,
  work_from_home_monthly_limit: 8,
  birthday_bonus_enabled: true,
  birthday_bonus_days: 1,
  seniority_bonus_enabled: true,
  seniority_bonus_days_per_interval: 1,
  seniority_bonus_interval_years: 5,
  escalation_period_days: 3,
  auto_escalation_enabled: true,
  fallback_routing_enabled: true,
  modification_cutoff_days: 2,
  include_weekends_in_calendar: false
};

export const createCurrentPolicy = () => ({
  id: 1,
  version: 3,
  status: "ACTIVE",
  effective_from: `${YEAR}-01-01T00:00:00Z`,
  effective_to: null,
  ...DEFAULT_POLICY,
  annual_leave_days: 22,
  work_from_home_monthly_limit: 10
});

// istorija aktivnosti (18.1)
export const createAuditLog = (users) => {
  const name = (id) => `${users[id - 1].first_name} ${users[id - 1].last_name}`;
  const rows = [
    ["USER", 1, "LOGIN", { source: "LOCAL" }],
    [
      "USER",
      2,
      "LEAVE_REQUEST_APPROVED",
      {
        leave_type: "Annual leave",
        requesting_user_id: 6,
        start_date: daysFromToday(5),
        end_date: daysFromToday(9)
      }
    ],
    [
      "USER",
      3,
      "LEAVE_REQUEST_REJECTED",
      {
        leave_type: "Work from home",
        requesting_user_id: 8,
        start_date: daysFromToday(1),
        end_date: daysFromToday(1),
        rejection_reason: "Rok projekta"
      }
    ],
    [
      "SYSTEM",
      null,
      "LEAVE_REQUEST_ESCALATED",
      {
        leave_type: "Annual leave",
        requesting_user_id: 14,
        start_date: daysFromToday(20),
        end_date: daysFromToday(29)
      }
    ],
    ["USER", 1, "POLICY_SCHEDULED", { version: 4, effective_from: `${YEAR + 1}-01-01T00:00:00Z` }],
    ["USER", 5, "USER_CREATED", { email: "doreen.sanford@codebron.rs" }],
    ["USER", 1, "HOLIDAY_CREATED", { name: "Dan kompanije", date: `${YEAR}-06-12T00:00:00Z` }],
    ["USER", 1, "ROLE_UPDATED", { name: "Menadžer tima" }],
    [
      "USER",
      2,
      "DELEGATION_CREATED",
      { start_date: daysFromToday(20), end_date: daysFromToday(27) }
    ],
    [
      "SYSTEM",
      null,
      "LEAVE_BALANCE_UPDATED",
      { leave_type: "Annual leave", requesting_user_id: 7 }
    ],
    ["USER", 4, "LOGIN", { source: "LOCAL" }],
    ["USER", 1, "LEAVE_TYPE_CREATED", { name: "Dodatni dani" }],
    [
      "USER",
      3,
      "LEAVE_REQUEST_APPROVED",
      {
        leave_type: "Sick leave",
        requesting_user_id: 8,
        start_date: daysFromToday(-2),
        end_date: daysFromToday(0)
      }
    ],
    ["USER", 5, "USER_DEACTIVATED", { email: "keith.hane@codebron.rs" }],
    ["USER", 1, "REPORT_GENERATED", { name: "Software Development — oktobar 2026" }]
  ];

  // 3 kruga istih događaja unazad, dovoljno za nekoliko strana
  return [0, 1, 2].flatMap((round) =>
    rows.map(([actor_type, actor_id, audit_type, metadata], index) => ({
      id: round * rows.length + index + 1,
      actor_type,
      actor_name: actor_id ? name(actor_id) : null,
      audit_type,
      metadata,
      created_at: daysFromToday(
        -(round * 7 + Math.floor(index / 3)),
        `${pad(16 - (index % 8))}:${pad((index * 13) % 60)}:00`
      )
    }))
  );
};

// AD (19.x)
export const createAdSettings = () => ({
  ldap_host: "ldap.codebron.local",
  ldap_port: 636,
  ldap_base_dn: "dc=codebron,dc=local",
  ldap_bind_dn: "cn=awayly,ou=service,dc=codebron,dc=local",
  use_ssl: true,
  tested_at: null,
  auth_type: "LOCAL"
});

// izvještaji (16.x)
const MONTH_NAMES = [
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "jun",
  "jul",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar"
];

const REPORT_COUNT = 13;

// naziv kao što bi ga HR dao: tim/kompanija + mesec perioda
const reportName = (is_company, team_id, date_to) => {
  const date = new Date(date_to);
  const period = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  return is_company ? `Pregled odsustava kompanije — ${period}` : `${TEAMS[team_id]} — ${period}`;
};

export const createReports = (users) => {
  const emails = (count) => [1, 5, 6, 7, 8, 9, 10].slice(0, count).map((id) => users[id - 1].email);

  return Array.from({ length: REPORT_COUNT }, (_, index) => {
    const is_company = index % 4 === 1;
    const team_id = [3, 4, 5, 6][index % 4];
    const author = users[index % 4];
    const back = 10 + index * 12;
    const date_to = daysFromToday(-back);

    return {
      id: index + 1,
      scope: is_company ? "COMPANY" : "TEAM",
      team_id: is_company ? null : team_id,
      team_name: is_company ? null : TEAMS[team_id],
      name: reportName(is_company, team_id, date_to),
      description: is_company
        ? "Pregled odsustava za celu kompaniju u izabranom periodu."
        : `Mesečni pregled odsustava tima ${TEAMS[team_id]} — godišnji odmori, bolovanja i rad od kuće.`,
      date_from: daysFromToday(-back - 30),
      date_to,
      recipients: emails((index % 7) + 1),
      generated_by: { id: author.id, first_name: author.first_name, last_name: author.last_name },
      created_at: daysFromToday(-back + 1, `${pad(8 + (index % 9))}:15:00`)
    };
  });
};

// radna mjesta za hijerarhiju (nije u API dokumentaciji), naziv je podatak sa servera
const LEAD_POSITIONS = {
  1: "Chief Executive Officer",
  2: "Engineering Lead",
  3: "Design Lead",
  4: "Research Lead",
  5: "HR Manager"
};

const TEAM_POSITIONS = {
  3: "Software Engineer",
  4: "Product Designer",
  5: "UX Researcher",
  6: "Data Analyst"
};

// { [user_id]: naziv radnog mjesta }
export const createPositions = (users) =>
  Object.fromEntries(
    users.map((user) => [user.id, LEAD_POSITIONS[user.id] ?? TEAM_POSITIONS[user.team_id] ?? null])
  );

// lanci odobravanja (nije u API dokumentaciji)
// korak: TEAM_LEAD (vođa tima podnosioca), ROLE (bilo ko sa ulogom) ili USER (tačno ta osoba)
export const createApprovalChains = () =>
  [
    ["Standardni lanac", true, [], [["TEAM_LEAD"], ["ROLE", 4]], true],
    ["Razvoj — duža odsustva", false, [3], [["TEAM_LEAD"], ["ROLE", 4], ["USER", 1]], true],
    ["Dizajn i istraživanje", false, [4, 5], [["TEAM_LEAD"], ["USER", 5]], false]
  ].map(([name, applies_to_all, team_ids, steps, is_active], index) => ({
    id: index + 1,
    name,
    applies_to_all,
    team_ids,
    steps: steps.map(([approver_type, id]) => ({
      approver_type,
      role_id: approver_type === "ROLE" ? id : null,
      user_id: approver_type === "USER" ? id : null
    })),
    is_active,
    created_at: daysFromToday(-60 + index * 9, "10:00:00"),
    updated_at: daysFromToday(-20 + index * 6, "10:00:00")
  }));
