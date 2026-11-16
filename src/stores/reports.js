import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { toApiDate } from "@/utils/api-date";
import { intlLocale, script, t } from "@/i18n";

const fullName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(" ");

// api: 16.2 getReportHistory
const toReport = (report) => ({
  id: report.id,
  name: report.name,
  description: report.description ?? "",
  scope: report.scope,
  // izveštaj za celu kompaniju nema tim, natpis se prevodi u getteru rows
  team: report.scope === "COMPANY" ? null : (report.team_name ?? ""),
  date_from: report.date_from,
  date_to: report.date_to,
  recipients: report.recipients ?? [],
  generated_by: fullName(report.generated_by),
  created_at: report.created_at
});

// api: 16.3, fajl tražimo kao blob
const readBlobError = async (error) => {
  if (!(error instanceof Blob)) return error;

  try {
    return JSON.parse(await error.text());
  } catch {
    return null;
  }
};

//API nema search parametar
const SEARCH_KEYS = ["name", "description", "team", "generated_by"];

// opcije sortiranja kartica: ključ i smjer
export const REPORT_SORTS = {
  newest: { key: "created_at", direction: "desc" },
  oldest: { key: "created_at", direction: "asc" },
  name: { key: "name", direction: "asc" }
};

// ALL | COMPANY | TEAM
export const REPORT_SCOPES = ["ALL", "COMPANY", "TEAM"];

export const useReportsStore = defineStore("reports", {
  state: () => ({
    items: [],
    is_loading: false,
    error: null,
    request_token: 0,
    search: "",
    sort: "newest",
    scope: "ALL",
    page: 1,
    // deljivo sa 2, 3 i 4 kolone kartica
    per_page: 12
  }),

  getters: {
    // redovi sa tekstom na trenutnom jeziku (getter, da prati promjenu jezika)
    rows: (state) =>
      state.items.map((item) => ({
        ...item,
        team: item.team === null ? t("reports.whole_company") : script(item.team),
        generated_by: script(item.generated_by)
      })),

    // brojevi za traku iznad kartica, uvijek nad svim izveštajima
    summary: (state) => {
      const month = new Date().toISOString().slice(0, 7);
      const company = state.items.filter((item) => item.scope === "COMPANY").length;

      return {
        total: state.items.length,
        this_month: state.items.filter((item) => String(item.created_at).startsWith(month)).length,
        company,
        team: state.items.length - company
      };
    },

    // pretraga i opseg u browseru, 16.2 ima samo scope i team_id
    filtered_items() {
      const query = this.search.trim().toLowerCase();
      const rows =
        this.scope === "ALL" ? this.rows : this.rows.filter((item) => item.scope === this.scope);

      if (!query) return rows;

      return rows.filter((item) =>
        SEARCH_KEYS.some((key) => item[key].toLowerCase().includes(query))
      );
    },

    // sortiranje takođe u browseru
    sorted_items() {
      const { key, direction } = REPORT_SORTS[this.sort] ?? REPORT_SORTS.newest;
      const factor = direction === "asc" ? 1 : -1;

      return [...this.filtered_items].sort(
        (a, b) => String(a[key]).localeCompare(String(b[key]), intlLocale()) * factor
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
    // api: 16.2 getReportHistory
    async fetchReports() {
      const token = ++this.request_token;

      this.is_loading = true;
      this.error = null;

      try {
        const { items, error } = await fetchAllPages("report/getReportHistory", "items");

        if (token !== this.request_token) return;

        if (error) {
          this.error = error;
          return error;
        }

        this.items = items
          .map(toReport)
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    // api: 16.1 generateReport, backend pravi PDF i šalje ga primaocima
    async generateReport({ name, description, scope, team_id, date_from, date_to, recipients }) {
      const { post } = useApi();

      const body = {
        scope,
        name,
        date_from: toApiDate(date_from),
        date_to: toApiDate(date_to)
      };

      if (description) body.description = description;
      if (scope === "TEAM") body.team_id = team_id;
      if (recipients.length) body.recipients = recipients;

      const { error } = await post("report/generateReport", body, { auth: true });

      if (error) return error;

      await this.fetchReports();
    },

    // api: 16.3 downloadReportHistory/{id}
    async downloadReport(report) {
      const { get } = useApi();
      const { data, error } = await get(`report/downloadReportHistory/${report.id}`, {
        auth: true,
        responseType: "blob"
      });

      if (error) return readBlobError(error);

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${report.name}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },

    setSearch(value) {
      this.search = value;
      this.page = 1;
    },

    setSort(sort) {
      this.sort = sort;
      this.page = 1;
    },

    setScope(scope) {
      this.scope = scope;
      this.page = 1;
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
