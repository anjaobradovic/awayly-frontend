import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/stores/auth";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { toApiDate } from "@/utils/api-date";
import { countFilters } from "@/utils/filter-count";
import { intlLocale } from "@/i18n";

const createDefaultFilters = () => ({ status: null });

// trajna rezerva i delegacija prije odsustva
const createDefaultSettings = () => ({
  backup_employee_id: null,
  absence_employee_id: null,
  absence_start: "",
  absence_end: ""
});

const fullName = (user) => [user.first_name, user.last_name].filter(Boolean).join(" ");

// 14.2 / 14.6
const toDelegation = (delegation) => ({
  id: delegation.id,
  delegator_id: delegation.delegator?.id ?? delegation.delegator_id,
  delegate_id: delegation.delegate?.id ?? delegation.delegate_id,
  delegator_name: delegation.delegator ? fullName(delegation.delegator) : null,
  delegate_name: delegation.delegate ? fullName(delegation.delegate) : null,
  start_date: delegation.start_date,
  end_date: delegation.end_date,
  status: delegation.status,
  created_at: delegation.created_at,
  updated_at: delegation.updated_at
});

// rezerva i delegat moraju moći da odobravaju, inače backend vrati 400
const APPROVAL_PERMISSIONS = ["REQUEST.APPROVE.TEAM", "REQUEST.APPROVE.ALL"];

const toDateValue = (value) => (value ? String(value).slice(0, 10) : "");

// datumi stižu kao ponoć UTC, računamo u kalendarskim danima
const DAY_MS = 86400000;
const dayNumber = (value) => {
  const [year, month, day] = toDateValue(value).split("-").map(Number);
  return Date.UTC(year, month - 1, day) / DAY_MS;
};
const todayNumber = () => {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS;
};

// stanje za prikaz: aktivna sada, zakazana, istekla ili deaktivirana
export const DELEGATION_STATES = ["active", "scheduled", "expired", "deactivated"];

// grupe na stranici, istekle i deaktivirane idu zajedno
export const DELEGATION_GROUPS = [
  { key: "active", states: ["active"] },
  { key: "scheduled", states: ["scheduled"] },
  { key: "ended", states: ["expired", "deactivated"] }
];

const stateOf = (status, start, end, today) => {
  if (status !== "ACTIVE") return "deactivated";
  if (today < start) return "scheduled";
  if (today > end) return "expired";
  return "active";
};

const byName = (a, b) => a.localeCompare(b, intlLocale());

export const useDelegationsStore = defineStore("delegations", {
  state: () => ({
    delegations: [],
    employees: [],
    approver_role_ids: null,
    settings: createDefaultSettings(),
    // id aktivne delegacije prije odsustva, ako postoji čuvanje je izmjena
    active_delegation_id: null,
    can_manage_others: false,
    is_loading: false,
    // prvo učitavanje gotovo, kasnije se lista samo osvježava
    is_loaded: false,
    error: null,
    search: "",
    // Moje delegacije
    show_mine: false,
    filters: createDefaultFilters()
  }),

  getters: {
    current_user_id: () => useAuthStore().user.id,

    items: (state) => {
      const names = new Map(state.employees.map((employee) => [employee.id, employee.name]));
      const nameOf = (name, id) => name ?? names.get(id) ?? `#${id}`;

      const today = todayNumber();

      return state.delegations.map((delegation) => {
        const start = dayNumber(delegation.start_date);
        const end = dayNumber(delegation.end_date);
        const total_days = Math.max(1, end - start + 1);
        const elapsed_days = Math.min(total_days, Math.max(0, today - start + 1));

        return {
          id: delegation.id,
          delegator_id: delegation.delegator_id,
          delegate_id: delegation.delegate_id,
          delegated_by: nameOf(delegation.delegator_name, delegation.delegator_id),
          delegated_to: nameOf(delegation.delegate_name, delegation.delegate_id),
          start_date: delegation.start_date,
          end_date: delegation.end_date,
          is_active: delegation.status === "ACTIVE",
          created_at: delegation.created_at,
          updated_at:
            delegation.updated_at === delegation.created_at ? null : delegation.updated_at,
          state: stateOf(delegation.status, start, end, today),
          total_days,
          elapsed_days,
          // do kraja (0 = završava danas) i do početka za zakazane
          days_left: end - today,
          days_until: start - today,
          days_since_end: today - end
        };
      });
    },

    filtered_items() {
      const query = this.search.trim().toLowerCase();
      const status = this.filters.status;

      return this.items.filter(
        (item) =>
          (!status || item.state === status) &&
          (!query ||
            item.delegated_to.toLowerCase().includes(query) ||
            item.delegated_by.toLowerCase().includes(query))
      );
    },

    // brojke za traku na vrhu, bez obzira na pretragu i filter
    state_counts() {
      const counts = Object.fromEntries(DELEGATION_STATES.map((key) => [key, 0]));

      for (const item of this.items) counts[item.state] += 1;

      return { ...counts, ended: counts.expired + counts.deactivated, total: this.items.length };
    },

    // aktivne sada gdje je trenutni korisnik delegator ili zamjenik
    my_active_items() {
      const me = this.current_user_id;

      return this.items
        .filter(
          (item) => item.state === "active" && (item.delegator_id === me || item.delegate_id === me)
        )
        .sort((a, b) => a.days_left - b.days_left);
    },

    // aktivne: najprije one koje ističu, zakazane: najbliže prve, završene: najnovije prve
    grouped_items() {
      const order = {
        active: (a, b) => a.days_left - b.days_left,
        scheduled: (a, b) => a.days_until - b.days_until,
        ended: (a, b) => b.end_date.localeCompare(a.end_date)
      };

      return DELEGATION_GROUPS.map((group) => ({
        key: group.key,
        items: this.filtered_items
          .filter((item) => group.states.includes(item.state))
          .sort((a, b) => order[group.key](a, b) || byName(a.delegated_by, b.delegated_by))
      })).filter((group) => group.items.length);
    },

    employee_options: (state) =>
      state.employees
        .filter((employee) => employee.status === "ACTIVE")
        .map((employee) => ({ value: employee.id, label: employee.name })),

    // samo aktivni zaposleni čija uloga smije da odobrava zahtjeve
    approver_options: (state) =>
      state.employees
        .filter(
          (employee) =>
            employee.status === "ACTIVE" &&
            (!state.approver_role_ids || state.approver_role_ids.includes(employee.role_id))
        )
        .map((employee) => ({ value: employee.id, label: employee.name })),

    has_filters: (state) => Object.values(state.filters).some((value) => value !== null),

    filter_count: (state) => countFilters(state.filters)
  },

  actions: {
    async fetchDelegations() {
      this.is_loading = true;
      this.error = null;

      try {
        // api: 14.2 getMyDelegations ili 14.6 getAllDelegations (MANAGE.OTHERS)
        const endpoint = this.show_mine
          ? "delegation/getMyDelegations"
          : "delegation/getAllDelegations";
        // filter statusa je na klijentu (aktivna/zakazana/istekla/deaktivirana), pa se učitava sve
        const result = await fetchAllPages(endpoint, "items");

        if (!this.show_mine) this.can_manage_others = !result.error;

        if (result.error) {
          this.error = result.error;
          return result.error;
        }

        this.delegations = result.items.map(toDelegation);
        this.is_loaded = true;
      } finally {
        this.is_loading = false;
      }
    },

    async fetchEmployees() {
      if (this.employees.length) return;

      // api: 4.2 getUsers
      const { items, error } = await fetchAllPages("user/getUsers", "users");

      if (error) return error;

      this.employees = items.map((user) => ({
        id: user.id,
        name: fullName(user),
        status: user.status,
        role_id: user.role?.id ?? null
      }));
    },

    // API nema direktno ko smije da odobrava, pa spajamo getUsers i getRoles
    // učitava se jednom, tek kad zatreba
    async fetchApproverRoleIds() {
      if (this.approver_role_ids) return;

      const { get } = useApi();
      const { data, error } = await get("role/getRoles", { auth: true });

      if (error) return error;

      this.approver_role_ids = (data?.data?.data?.roles ?? [])
        .filter((role) =>
          (role.permissions ?? []).some((key) => APPROVAL_PERMISSIONS.includes(key))
        )
        .map((role) => role.id);
    },

    async createDelegation({ delegated_by_id, delegated_to_id, start_date, end_date }) {
      const { post } = useApi();
      const body = {
        delegate_id: delegated_to_id,
        start_date: toApiDate(start_date),
        end_date: toApiDate(end_date)
      };

      let result;

      if (delegated_by_id === this.current_user_id) {
        // api: 14.1 createMyDelegation
        result = await post("delegation/createMyDelegation", body, { auth: true });
      } else {
        // api: 14.5 createDelegationForUser, u ime drugog
        result = await post(
          "delegation/createDelegationForUser",
          { ...body, delegator_id: delegated_by_id },
          { auth: true }
        );
      }

      if (result.error) return result.error;

      await this.fetchDelegations();
    },

    async updateDelegation(item, { delegate_id, start_date, end_date }) {
      const { patch } = useApi();
      const body = {
        delegate_id,
        start_date: toApiDate(start_date),
        end_date: toApiDate(end_date)
      };

      let result;

      if (item.delegator_id === this.current_user_id) {
        // api: 14.3 updateMyDelegation/{id}
        result = await patch(`delegation/updateMyDelegation/${item.id}`, body, { auth: true });
      } else {
        // api: 14.7 updateDelegation/{id} (DELEGATION.MANAGE.OTHERS)
        result = await patch(`delegation/updateDelegation/${item.id}`, body, { auth: true });
      }

      if (result.error) return result.error;

      this.replaceDelegation(result.data?.data?.data);
    },

    // server delegaciju prebacuje u CANCELLED, ponovno aktiviranje ne postoji
    async cancelDelegation(item) {
      const { patch } = useApi();

      let result;

      if (item.delegator_id === this.current_user_id) {
        // api: 14.4 cancelMyDelegation/{id}
        result = await patch(`delegation/cancelMyDelegation/${item.id}`, null, { auth: true });
      } else {
        // api: 14.8 cancelDelegation/{id} (DELEGATION.MANAGE.OTHERS)
        result = await patch(`delegation/cancelDelegation/${item.id}`, null, { auth: true });
      }

      if (result.error) return result.error;

      this.replaceDelegation(result.data?.data?.data);
    },

    replaceDelegation(updated) {
      if (!updated) return;

      const next = toDelegation(updated);

      this.delegations = this.delegations.map((delegation) => {
        if (delegation.id !== next.id) return delegation;

        return {
          ...next,
          delegator_name:
            next.delegator_id === delegation.delegator_id ? delegation.delegator_name : null,
          delegate_name:
            next.delegate_id === delegation.delegate_id ? delegation.delegate_name : null
        };
      });
    },

    async fetchSettings() {
      const { get } = useApi();

      const [profile, active] = await Promise.all([
        // api: 4.7 getMyProfile, permanent_backup_id je trajna rezerva
        get("user/getMyProfile", { auth: true }),
        // api: 14.10 getMyActiveDelegation, delegacija prije odsustva
        get("delegation/getMyActiveDelegation", { auth: true })
      ]);

      if (profile.error) return profile.error;

      const me = profile.data?.data?.data;
      const active_delegation = active.error ? null : active.data?.data?.data;

      this.active_delegation_id = active_delegation?.id ?? null;
      this.settings = {
        backup_employee_id: me?.permanent_backup_id ?? null,
        absence_employee_id: active_delegation?.delegate_id ?? null,
        absence_start: toDateValue(active_delegation?.start_date),
        absence_end: toDateValue(active_delegation?.end_date)
      };
    },

    async saveSettings(form) {
      const { patch, post } = useApi();

      if (form.backup_employee_id !== this.settings.backup_employee_id) {
        const { error } = await patch(
          "user/updateMyProfile",
          { permanent_backup_id: form.backup_employee_id },
          { auth: true }
        );

        if (error) return error;
      }

      const has_absence = form.absence_employee_id && form.absence_start && form.absence_end;
      const absence_changed =
        form.absence_employee_id !== this.settings.absence_employee_id ||
        form.absence_start !== this.settings.absence_start ||
        form.absence_end !== this.settings.absence_end;

      if (has_absence && absence_changed) {
        const body = {
          delegate_id: form.absence_employee_id,
          start_date: toApiDate(form.absence_start),
          end_date: toApiDate(form.absence_end)
        };

        let result;

        if (this.active_delegation_id) {
          // api: 14.3 updateMyDelegation/{id}, već postoji aktivna
          result = await patch(`delegation/updateMyDelegation/${this.active_delegation_id}`, body, {
            auth: true
          });
        } else {
          // api: 14.1 createMyDelegation, nova delegacija prije odsustva
          result = await post("delegation/createMyDelegation", body, { auth: true });
        }

        if (result.error) return result.error;

        this.active_delegation_id = result.data?.data?.data?.id ?? this.active_delegation_id;

        // nova ili izmijenjena delegacija treba da se vidi i u tabeli
        await this.fetchDelegations();
      }

      this.settings = { ...form };
    },

    setSearch(value) {
      this.search = value;
    },

    // filter je na klijentu, ne treba novo učitavanje
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
    },

    clearFilters() {
      this.filters = createDefaultFilters();
    },

    setMine(value) {
      if (this.show_mine === value) return;

      this.show_mine = value;
      return this.fetchDelegations();
    }
  }
});
