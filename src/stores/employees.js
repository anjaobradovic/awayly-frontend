import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { ROLE_LABELS } from "@/utils/role-name";
import { toApiDate } from "@/utils/api-date";
import { countFilters } from "@/utils/filter-count";
import { intlLocale, t } from "@/i18n";

// ROLE_LABELS se izvozi i odavde, koriste ga paneli zaposlenih
export { ROLE_LABELS };

const fullName = (user) => [user.first_name, user.last_name].filter(Boolean).join(" ");

// api: 4.2 getUsers, saldo stiže uz svakog zaposlenog
const toBalance = (balance) => {
  if (balance?.remaining_days == null) return null;

  return { remaining: balance.remaining_days, total: balance.allocated_days };
};

// api: 4.2 getUsers
// role je getter da naziv sistemske uloge prati promjenu jezika
const toEmployee = (user) => ({
  id: user.id,
  name: fullName(user),
  email: user.email,
  status: user.status,
  role_name: user.role?.name ?? "",
  get role() {
    return ROLE_LABELS[this.role_name] ?? this.role_name;
  },
  role_id: user.role?.id ?? null,
  team_id: user.team?.id ?? null,
  team: user.team?.name ?? "",
  manager_id: user.manager_id,
  hire_date: user.hire_date,
  date_of_birth: user.date_of_birth ?? null,
  balance: toBalance(user.annual_leave_balance)
});

const toDays = (value) => (value === "" || value == null ? null : Number(value));

const compareValues = (a, b) => {
  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a ?? "").localeCompare(String(b ?? ""), intlLocale());
};

const sortValue = (row, key) => (key === "balance" ? row.balance?.remaining : row[key]);

const createDefaultFilters = () => ({ manager_id: null, team_id: null });

export const useEmployeesStore = defineStore("employees", {
  state: () => ({
    // zaposleni po pretrazi i filterima, filtrira backend
    users: [],
    all_users: [],
    is_loading: false,
    error: null,
    request_token: 0,
    search: "",
    filters: createDefaultFilters(),
    sort: null,
    page: 1,
    per_page: 10
  }),

  getters: {
    team_options: (state) => {
      const teams = new Map(
        state.all_users.filter((user) => user.team_id).map((user) => [user.team_id, user.team])
      );

      return [...teams]
        .map(([id, name]) => ({ value: id, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label, intlLocale()));
    },

    manager_options: (state) => {
      const manager_ids = new Set(state.all_users.map((user) => user.manager_id).filter(Boolean));

      return state.all_users
        .filter((user) => manager_ids.has(user.id))
        .map((user) => ({ value: user.id, label: user.name }));
    },

    // Nadređeni: aktivni zaposleni čija uloga ima pravo odobravanja
    // zaposleni ne može biti sam sebi nadređeni
    managerOptions:
      (state) =>
      (role_ids, exclude_id = null) =>
        state.all_users
          .filter(
            (user) =>
              user.status !== "DEACTIVATED" &&
              user.id !== exclude_id &&
              role_ids.includes(user.role_id)
          )
          .map((user) => ({ value: user.id, label: user.name })),

    has_filters: (state) => Object.values(state.filters).some((value) => value !== null),

    filter_count: (state) => countFilters(state.filters),

    is_unfiltered() {
      return !this.search.trim() && !this.has_filters;
    },

    sorted_items() {
      if (!this.sort) return this.users;

      const { key, direction } = this.sort;
      const factor = direction === "asc" ? 1 : -1;

      return [...this.users].sort(
        (a, b) => compareValues(sortValue(a, key), sortValue(b, key)) * factor
      );
    },

    total_items() {
      return this.users.length;
    },

    total_pages() {
      return Math.max(1, Math.ceil(this.total_items / this.per_page));
    },

    paginated_items() {
      const start = (this.page - 1) * this.per_page;
      return this.sorted_items.slice(start, start + this.per_page);
    }
  },

  actions: {
    // bez pretrage i filtera jedan poziv puni i tabelu i liste
    refresh() {
      if (this.is_unfiltered) return this.fetchEmployees();

      return Promise.all([this.fetchEmployees(), this.fetchOptions()]);
    },

    // pretraga i filteri na backendu
    async fetchEmployees() {
      const token = ++this.request_token;
      const query = this.search.trim();
      const { manager_id, team_id } = this.filters;

      this.is_loading = true;
      this.error = null;

      try {
        const { items, error } = await fetchAllPages("user/getUsers", "users", {
          q: { value: query },
          manager_id: { value: manager_id },
          team_id: { value: team_id }
        });

        if (token !== this.request_token) return;

        if (error) {
          this.error = error;
          return error;
        }

        this.users = items.map(toEmployee);

        if (!query && !manager_id && !team_id) this.all_users = this.users;
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    async fetchOptions() {
      const { items, error } = await fetchAllPages("user/getUsers", "users");

      if (!error) this.all_users = items.map(toEmployee);
    },

    // api: 4.1 createUser, server šalje pozivnicu na email
    // dani idu samo uz EXISTING_EMPLOYEE i to oba zajedno
    async createEmployee(form) {
      const is_existing = form.onboarding_type === "EXISTING_EMPLOYEE";
      const body = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || null,
        hire_date: toApiDate(form.hire_date),
        date_of_birth: toApiDate(form.date_of_birth) || null,
        onboarding_type: form.onboarding_type,
        manager_id: form.manager_id,
        team_id: form.team_id,
        religion: form.religion,
        general_leave_used_days: toDays(form.general_leave_used_days),
        general_leave_remaining_days: toDays(form.general_leave_remaining_days),
        ...(is_existing && {
          used_days: Number(form.used_days),
          remaining_days: Number(form.remaining_days)
        })
      };

      const { post } = useApi();
      const { error } = await post("user/createUser", body, { auth: true });

      if (error) return error;

      await this.refresh();
      this.page = 1;
    },

    // api: 4.3 getSingleUser/{id}, podaci za izmjenu
    async fetchEmployee(id) {
      const { get } = useApi();
      const { data, error } = await get(`user/getSingleUser/${id}`, { auth: true });

      if (error) return { error };

      return { data: data?.data?.data ?? null };
    },

    // api: 13.2 getUserLeaveBalances/{id}, salda za tekuću godinu
    async fetchEmployeeBalances(id) {
      const { get } = useApi();
      const { data, error } = await get(`leaveBalance/getUserLeaveBalances/${id}`, { auth: true });

      if (error) return { error };

      return { data: data?.data?.data?.balances ?? [] };
    },

    // api: 4.4 updateUser/{id}, mijenja samo HR podatke
    // hire_date smije mijenjati samo CompanyAdmin
    async updateEmployee(id, changes, { role_id, previous_role_id } = {}) {
      const NORMALIZE = {
        first_name: (value) => value.trim(),
        last_name: (value) => value.trim(),
        phone_number: (value) => value.trim() || null,
        hire_date: toApiDate,
        date_of_birth: (value) => toApiDate(value) || null
      };

      const body = Object.fromEntries(
        Object.entries(changes).map(([key, value]) => [
          key,
          NORMALIZE[key] ? NORMALIZE[key](value) : value
        ])
      );

      const { patch } = useApi();

      if (Object.keys(body).length) {
        const { error } = await patch(`user/updateUser/${id}`, body, { auth: true });

        if (error) return error;
      }

      if (role_id && role_id !== previous_role_id) {
        const { error: role_error } = await patch(
          "role/changeUserRole",
          { user_id: id, role_id },
          { auth: true }
        );

        if (role_error) return role_error;
      }

      // izmijenjeni red stiže ponovo kroz getUsers
      await this.refresh();
    },

    // api: 4.8 resetUserTotp/{id}, briše 2FA i odjavljuje zaposlenog
    async resetEmployeeTotp(id) {
      const { patch } = useApi();
      const { error } = await patch(`user/resetUserTotp/${id}`, null, { auth: true });

      return error ?? null;
    },

    // api: 4.5 deactivateUser/{id}, Obriši je zapravo deaktivacija
    async deactivateEmployee(id) {
      const { patch } = useApi();
      const { error } = await patch(`user/deactivateUser/${id}`, null, { auth: true });

      if (error) return error;

      // mijenja se na mjestu, spread bi pretvorio getter role u običan tekst
      const user = this.users.find((item) => item.id === id);

      if (user) user.status = "DEACTIVATED";
    },

    // api: 5.1 getBulkImportTemplate, vraća fajl (blob) bez data omotača
    // CSV podrazumijevano: uvoz u demu čita samo CSV
    async downloadTemplate(format = "CSV") {
      const { get } = useApi();
      const { data, error } = await get("user/getBulkImportTemplate", {
        auth: true,
        responseType: "blob",
        filters: { format: { value: format } }
      });

      if (error) return error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${t("employees.template_file")}.${format.toLowerCase()}`;
      link.click();
      URL.revokeObjectURL(url);
    },

    // api: 5.2 bulkImportUsers, redovi iz CSV-a ({ first_name, last_name, email, hire_date, team })
    // vraća { imported, skipped: [{ row, email, reason }] }
    async importEmployees(rows) {
      return this.sendImport({ users: rows });
    },

    // api: 5.2 bulkImportUsers, popunjen šablon kao fajl (multipart)
    async importTemplateFile(file) {
      const body = new FormData();

      body.append("file", file);

      return this.sendImport(body);
    },

    async sendImport(body) {
      const { post } = useApi();
      const { data, error } = await post("user/bulkImportUsers", body, { auth: true });

      if (error) return { error };

      // novi zaposleni odmah u listi i u izborima nadređenog i tima
      await this.refresh();
      this.page = 1;

      return { data: data?.data?.data ?? { imported: 0, skipped: [] } };
    },

    // view zove pretragu sa zakašnjenjem, ne na svako slovo
    setSearch(value) {
      this.search = value;
      this.page = 1;
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      this.page = 1;
      return this.fetchEmployees();
    },

    clearFilters() {
      this.filters = createDefaultFilters();
      this.page = 1;
      return this.fetchEmployees();
    },

    setSort(sort) {
      this.sort = sort;
      this.page = 1;
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
