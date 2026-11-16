import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { toApiDate } from "@/utils/api-date";
import { countFilters } from "@/utils/filter-count";
import { t, te } from "@/i18n";

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

// api 3.1, drzavni i vjerski praznici (vrsta se filtrira ovdje, da brojke ostanu tačne)
const fetchStateHolidays = async (year) => {
  const { items, error } = await fetchAllPages("holiday/getGlobalHolidays", "holidays", {
    year: { value: year }
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

const DAY_MS = 86_400_000;

// "2026-05-01" -> broj dana od epohe, za razlike između datuma
export const dayNumber = (key) => {
  const [year, month, day] = key.split("-").map(Number);

  return Date.UTC(year, month - 1, day) / DAY_MS;
};

// današnji dan kao "YYYY-MM-DD" u lokalnoj zoni
export const todayKey = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// "Nova godina (drugi dan)" -> "Nova godina"
const baseName = (name = "") =>
  name
    .replace(/\s*\(.*\)\s*$/, "")
    .trim()
    .toLowerCase();

// uzastopni dani istog državnog praznika postaju jedan raspon (1–2. januar)
export const toSpans = (items) => {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  const spans = [];

  for (const holiday of sorted) {
    const key = holiday.date.slice(0, 10);
    const last = spans[spans.length - 1];
    const joins =
      last &&
      holiday.scope === "state" &&
      last.scope === "state" &&
      last.kind === holiday.kind &&
      baseName(last.name) === baseName(holiday.name) &&
      dayNumber(key) - dayNumber(last.end) === 1;

    if (joins) {
      last.end = key;
      last.days += 1;
      last.holidays.push(holiday);
      continue;
    }

    spans.push({
      id: holiday.id,
      name: holiday.name,
      kind: holiday.kind,
      scope: holiday.scope,
      start: key,
      end: key,
      days: 1,
      holiday,
      holidays: [holiday]
    });
  }

  return spans;
};

export const useHolidaysStore = defineStore("holidays", {
  state: () => ({
    items: { state: [], company: [] },
    is_loading: false,
    is_loaded: false,
    error: null,
    request_token: 0,
    scope: "state",
    search: "",
    // godina ide backendu, vrsta se filtrira na klijentu
    filters: { type: null, year: null }
  }),

  getters: {
    // godina koja je prikazana (backend bez parametra vraća tekuću)
    year: (state) => state.filters.year ?? new Date().getFullYear(),

    // svi praznici godine, bez filtera, za istaknuti praznik i brojke
    all_spans: (state) => toSpans([...state.items.state, ...state.items.company]),

    // tab + vrsta + pretraga (api nema search parametar)
    filtered_items: (state) => {
      const query = state.search.trim().toLowerCase();
      const type = state.scope === "state" ? state.filters.type : null;

      return state.items[state.scope].filter(
        (item) =>
          (!type || item.kind === type) && (!query || item.name.toLowerCase().includes(query))
      );
    },

    spans() {
      return toSpans(this.filtered_items);
    },

    total_items() {
      return this.filtered_items.length;
    },

    // broj praznika po vrsti, u danima
    kind_counts: (state) => {
      const counts = { total: 0, NATIONAL: 0, RELIGIOUS: 0, COMPANY: 0 };

      for (const item of [...state.items.state, ...state.items.company]) {
        counts.total += 1;
        if (item.kind in counts) counts[item.kind] += 1;
      }

      return counts;
    },

    // sljedeći (ili današnji) neradni dan, iz oba izvora
    next_span() {
      const today = todayKey();

      return this.all_spans.find((span) => span.end >= today) ?? null;
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
    }
  },

  actions: {
    // oba izvora odjednom: tabovi se mijenjaju bez čekanja, a brojke su uvijek potpune
    async fetchHolidays() {
      const token = ++this.request_token;
      const { year } = this.filters;

      this.is_loading = true;
      this.error = null;

      try {
        const [state, company] = await Promise.all([
          fetchStateHolidays(year),
          fetchCompanyHolidays(year)
        ]);

        if (token !== this.request_token) return;

        const error = state.error ?? company.error;

        if (error) {
          this.error = error;
          return error;
        }

        this.items = { state: state.items, company: company.items };
        this.is_loaded = true;
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

      await this.fetchHolidays();
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

      await this.fetchHolidays();
    },

    // api 3.5
    async deleteCompanyHoliday(id) {
      const { del } = useApi();
      const { error } = await del(`holiday/deleteCompanyHoliday/${id}`, { auth: true });

      if (error) return error;

      await this.fetchHolidays();
    },

    // podaci za oba taba su već tu, samo se vrsta poništava
    setScope(scope) {
      this.scope = scope;
      this.filters.type = null;
    },

    setFilters(filters) {
      const year_changed = (filters.year ?? null) !== this.filters.year;

      this.filters = { ...this.filters, ...filters };
      if (year_changed) return this.fetchHolidays();
    },

    clearFilters() {
      const had_year = this.filters.year !== null;

      this.filters = { type: null, year: null };
      if (had_year) return this.fetchHolidays();
    },

    setSearch(value) {
      this.search = value;
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
