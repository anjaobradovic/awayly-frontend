import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { toApiDate } from "@/utils/api-date";
import { countFilters } from "@/utils/filter-count";
import { intlLocale, t, te } from "@/i18n";

// vrste državnih praznika koje backend zna (filter ?type=)
const STATE_KINDS = ["NATIONAL", "RELIGIOUS"];

// kind je kod (NATIONAL, RELIGIOUS, COMPANY), tekst se pravi pri prikazu
export const holidayKindLabel = (kind) =>
  kind && te(`holidays.kinds.${kind}`) ? t(`holidays.kinds.${kind}`) : (kind ?? "");

const toStateHoliday = (holiday) => ({
  id: `state-${holiday.id}`,
  name: holiday.name,
  date: holiday.date,
  kind: holiday.type,
  scope: "state"
});

const toCompanyHoliday = (holiday) => ({
  id: holiday.id,
  name: holiday.name,
  date: holiday.date,
  kind: "COMPANY",
  scope: "company"
});

// api 3.1, drzavni i vjerski praznici
const fetchStateHolidays = async (type, year) => {
  const { items, error } = await fetchAllPages("holiday/getGlobalHolidays", "holidays", {
    year: { value: year },
    type: { value: type }
  });

  return { items: items.map(toStateHoliday), error };
};

// api 3.2, kompanijski neradni dani (paginirano, nema type)
const fetchCompanyHolidays = async (year) => {
  const { items, error } = await fetchAllPages("holiday/getCompanyHolidays", "holidays", {
    year: { value: year }
  });

  return { items: items.map(toCompanyHoliday), error };
};

const YEAR_RANGE = 3;

export const useHolidaysStore = defineStore("holidays", {
  state: () => ({
    items: { state: [], company: [] },
    is_loading: false,
    error: null,
    request_token: 0,
    scope: "state",
    search: "",
    // ovo filtrira backend
    filters: { type: null, year: null },
    sort: null,
    page: 1,
    per_page: 10
  }),

  getters: {
    // ovdje je samo pretraga, api nema search parametar
    filtered_items: (state) => {
      const query = state.search.trim().toLowerCase();

      return state.items[state.scope].filter(
        (item) => !query || item.name.toLowerCase().includes(query)
      );
    },

    has_filters: (state) => Object.values(state.filters).some((value) => value !== null),

    filter_count: (state) => countFilters(state.filters),

    type_options: () => STATE_KINDS.map((value) => ({ value, label: holidayKindLabel(value) })),

    year_options: () => {
      const current = new Date().getFullYear();

      return Array.from(
        { length: YEAR_RANGE * 2 + 1 },
        (_, index) => current + YEAR_RANGE - index
      ).map((year) => ({ value: year, label: String(year) }));
    },

    sorted_items() {
      if (!this.sort) return this.filtered_items;

      const { key, direction } = this.sort;
      const factor = direction === "asc" ? 1 : -1;

      // vrsta se sortira po prevedenom nazivu
      const valueOf = (item) => (key === "kind" ? holidayKindLabel(item.kind) : item[key]);
      const locale = intlLocale();

      return [...this.filtered_items].sort(
        (a, b) => String(valueOf(a)).localeCompare(String(valueOf(b)), locale) * factor
      );
    },

    total_items() {
      return this.sorted_items.length;
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
    async fetchHolidays(scope = this.scope) {
      const token = ++this.request_token;
      const { type, year } = this.filters;

      this.is_loading = true;
      this.error = null;

      try {
        const { items, error } =
          scope === "state"
            ? await fetchStateHolidays(type, year)
            : await fetchCompanyHolidays(year);

        if (token !== this.request_token) return;

        if (error) {
          this.error = error;
          return error;
        }

        this.items[scope] = items;
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    // api 3.3
    async createCompanyHoliday({ date, name }) {
      const { post } = useApi();
      const { error } = await post(
        "holiday/createCompanyHoliday",
        { date: toApiDate(date), name },
        { auth: true }
      );

      if (error) return error;

      await this.fetchHolidays("company");
    },

    // api 3.4
    async updateCompanyHoliday(id, { date, name }) {
      const { patch } = useApi();
      const { error } = await patch(
        `holiday/updateCompanyHoliday/${id}`,
        { date: toApiDate(date), name },
        { auth: true }
      );

      if (error) return error;

      await this.fetchHolidays("company");
    },

    // api 3.5
    async deleteCompanyHoliday(id) {
      const { del } = useApi();
      const { error } = await del(`holiday/deleteCompanyHoliday/${id}`, { auth: true });

      if (error) return error;

      await this.fetchHolidays("company");
    },

    setScope(scope) {
      this.scope = scope;
      this.page = 1;

      this.filters.type = null;

      return this.fetchHolidays();
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      this.page = 1;
      return this.fetchHolidays();
    },

    clearFilters() {
      this.filters = { type: null, year: null };
      this.page = 1;
      return this.fetchHolidays();
    },

    setSearch(value) {
      this.search = value;
      this.page = 1;
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
