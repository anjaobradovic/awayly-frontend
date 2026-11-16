import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { leaveTypeName, leaveTypeSourceName } from "@/utils/leave-type-name";
import { toApiDate } from "@/utils/api-date";
import { fetchUserHolidays } from "@/utils/user-holidays";
import { refreshUntil } from "@/utils/refresh-until";
import { monthNames, fromIso, toIso, todayIso } from "@/utils/calendar-date";
import { t } from "@/i18n";
import { useAuthStore } from "@/stores/auth";
import { STATUS_FILTERS, compareEntries } from "@/views/calendar/calendar-config";
import { countFilters } from "@/utils/filter-count";

const day = (value) => String(value ?? "").slice(0, 10);

// entries u oblik koji koristi kalendar
const toEntry = (entry) => ({
  id: entry.leave_request_id,
  user_id: entry.user_id,
  employee: [entry.first_name, entry.last_name].filter(Boolean).join(" "),
  team: entry.team_name ?? "",
  leave_type_id: entry.leave_type_id,
  leave_type: leaveTypeName(entry.leave_type_name),
  status: entry.status,
  start_date: day(entry.start_date),
  end_date: day(entry.end_date)
});

const createSummary = () => ({
  total_count: 0,
  pending_count: 0,
  approved_count: 0,
  by_leave_type: []
});

// ponedjeljak je 0, nedjelja 6
const weekdayOf = (date) => (date.getDay() + 6) % 7;

const addDays = (iso, days) => {
  const date = fromIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
};

export const useCalendarStore = defineStore("calendar", {
  state: () => ({
    view: "month",
    // bilo koji dan u prikazanom mjesecu ili godini
    anchor: todayIso(),
    status: "all",
    // leave_type_id iz kartice ili filtera
    leave_type_id: null,
    search: "",
    is_mine: false,
    summary: createSummary(),
    entries: [],
    holidays: [],
    include_weekends: false,
    leave_types: [],
    is_loading: false,
    error: null,
    request_token: 0
  }),

  getters: {
    // period koji kalendar pokriva, za brojače i tekst u traci
    period: (state) => {
      const date = fromIso(state.anchor);
      const year = date.getFullYear();

      if (state.view === "year") return { from: `${year}-01-01`, to: `${year}-12-31` };

      return {
        from: toIso(new Date(year, date.getMonth(), 1)),
        to: toIso(new Date(year, date.getMonth() + 1, 0))
      };
    },

    // mjesečni prikaz ima pune sedmice, pa tražimo i dane susjednih mjeseci
    grid_period() {
      if (this.view === "year") return this.period;

      return {
        from: addDays(this.period.from, -weekdayOf(fromIso(this.period.from))),
        to: addDays(this.period.to, 6 - weekdayOf(fromIso(this.period.to)))
      };
    },

    title: (state) => {
      const date = fromIso(state.anchor);

      return state.view === "year"
        ? String(date.getFullYear())
        : `${monthNames()[date.getMonth()]} ${date.getFullYear()}`;
    },

    // 01 Jun - 30 Jun 2026
    range_label() {
      const label = (iso) => {
        const date = fromIso(iso);
        return `${String(date.getDate()).padStart(2, "0")} ${monthNames("short")[date.getMonth()]}`;
      };

      return `${label(this.period.from)} - ${label(this.period.to)} ${this.period.to.slice(0, 4)}`;
    },

    shows_today() {
      const today = todayIso();
      return today >= this.period.from && today <= this.period.to;
    },

    // Moji zahtjevi: API nema parametar, pa filtriramo po user_id
    visible_entries: (state) => {
      const my_id = useAuthStore().user.id;

      return state.is_mine ? state.entries.filter((entry) => entry.user_id === my_id) : state.entries;
    },

    // zahtjev koji ranije počinje stoji iznad
    sorted_entries() {
      return [...this.visible_entries].sort(compareEntries);
    },

    // brojevi za kartice po nazivu tipa
    type_counts() {
      const counts = {};

      // 17.1 broji sve vidljive zahtjeve, pa svoje brojimo sami
      if (this.is_mine) {
        const status = this.status_filter.api_status;

        this.visible_entries
          .filter((entry) => !status || entry.status === status)
          .filter((entry) => entry.end_date >= this.period.from && entry.start_date <= this.period.to)
          .forEach((entry) => {
            counts[entry.leave_type] = (counts[entry.leave_type] ?? 0) + 1;
          });

        return counts;
      }

      this.summary.by_leave_type.forEach((item) => {
        const name = leaveTypeName(item.leave_type_name);
        counts[name] = (counts[name] ?? 0) + item.count;
      });

      return counts;
    },

    status_filter: (state) => STATUS_FILTERS.find((filter) => filter.value === state.status),

    // brojevi za tabove sa statusom
    status_options: (state) =>
      STATUS_FILTERS.map((filter) => ({
        value: filter.value,
        label: t("calendar.status_option", {
          label: t(filter.label),
          count: state.summary[filter.count_key] ?? 0
        })
      })),

    selected_type: (state) =>
      leaveTypeName(state.leave_types.find((type) => type.id === state.leave_type_id)?.name) ||
      null,

    leave_type_options: (state) =>
      state.leave_types.map((type) => ({ value: type.id, label: leaveTypeName(type.name) })),

    has_filters: (state) => state.leave_type_id !== null,

    filter_count: (state) => countFilters({ leave_type_id: state.leave_type_id })
  },

  actions: {
    // api: 17.1 i 17.2 uporedo
    // backend traži datetime, period najviše 400 dana
    async fetchCalendar() {
      const token = ++this.request_token;
      const { get } = useApi();
      const status = this.status_filter.api_status;

      this.is_loading = true;
      this.error = null;

      try {
        const [summary, entries, holidays] = await Promise.all([
          get("calendar/getCalendarSummary", {
            auth: true,
            filters: {
              date_from: { value: toApiDate(this.period.from) },
              date_to: { value: toApiDate(this.period.to) },
              status: { value: status }
            }
          }),
          get("calendar/getCalendarEntries", {
            auth: true,
            filters: {
              date_from: { value: toApiDate(this.grid_period.from) },
              date_to: { value: toApiDate(this.grid_period.to) },
              status: { value: status },
              leave_type_id: { value: this.leave_type_id },
              search: { value: this.search.trim() }
            }
          }),
          // praznici idu posebno, greška u njima ne smije sakriti zahtjeve
          fetchUserHolidays(this.grid_period.from, this.grid_period.to)
        ]);

        // u međuvremenu je krenuo noviji zahtjev, ovaj je zastario
        if (token !== this.request_token) return;

        const error = summary.error ?? entries.error;

        if (error) {
          this.error = error;
          return error;
        }

        const payload = entries.data?.data?.data ?? {};

        this.summary = { ...createSummary(), ...(summary.data?.data?.data ?? {}) };
        this.entries = (payload.entries ?? []).map(toEntry);
        this.holidays = holidays;
        this.include_weekends = Boolean(payload.include_weekends_in_calendar);
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    // poslije slanja učitavaj dok se novi zahtjev ne pojavi, ako je u periodu
    refreshAfterSubmit(created) {
      const is_visible =
        created &&
        day(created.start_date) <= this.grid_period.to &&
        day(created.end_date) >= this.grid_period.from;

      return refreshUntil(
        () => this.fetchCalendar(),
        () => !is_visible || this.entries.some((entry) => entry.id === created.id)
      );
    },

    // api: 10.1 getLeaveTypes, za kartice i filter
    async fetchLeaveTypes() {
      const { items, error } = await fetchAllPages("leaveType/getLeaveTypes", "leave_types");

      if (!error) this.leave_types = items;
    },

    setView(view) {
      this.view = view;
      return this.fetchCalendar();
    },

    // strelice pomjeraju mjesec ili godinu, zavisno od prikaza
    shift(step) {
      const date = fromIso(this.anchor);
      const months = this.view === "year" ? step * 12 : step;

      this.anchor = toIso(new Date(date.getFullYear(), date.getMonth() + months, 1));
      return this.fetchCalendar();
    },

    // klik na mjesec ili dan u godišnjem prikazu otvara taj mjesec
    openMonth(iso) {
      this.view = "month";
      this.anchor = iso;
      return this.fetchCalendar();
    },

    goToToday() {
      this.anchor = todayIso();
      return this.fetchCalendar();
    },

    setStatus(status) {
      this.status = status;
      return this.fetchCalendar();
    },

    // isti tip ponovo skida filter
    selectType(name) {
      const type = this.leave_types.find(
        (item) => leaveTypeSourceName(item.name) === leaveTypeSourceName(name)
      );

      return this.setLeaveType(type && type.id !== this.leave_type_id ? type.id : null);
    },

    setLeaveType(leave_type_id) {
      this.leave_type_id = leave_type_id;
      return this.fetchCalendar();
    },

    setSearch(value) {
      this.search = value;
      return this.fetchCalendar();
    },

    // samo filtrira već učitane zahtjeve, novi poziv nije potreban
    toggleMine() {
      this.is_mine = !this.is_mine;
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
