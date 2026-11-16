import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { leaveTypeName } from "@/utils/leave-type-name";
import { todayIso } from "@/utils/calendar-date";
import { useAuthStore } from "@/stores/auth";

// lični panel, brojke stižu sa backenda (15.1 do 15.4), ovdje ih samo slažemo
// nadolazeća odsustva idu preko 9.2 jer 15.1 vraća samo prvo
const UPCOMING_LIMIT = 4;

const day = (value) => String(value ?? "").slice(0, 10);
const number = (value) => Number(value) || 0;

// backend može da izostavi dio, kartica tada prikazuje 0
const toBalance = (balance) => ({
  used: number(balance?.used),
  entitled: number(balance?.entitled),
  remaining: number(balance?.remaining)
});

// uvijek 12 mjeseci, i kad backend pošalje samo one sa danima
const toMonths = (breakdown) =>
  Array.from({ length: 12 }, (_, index) =>
    number((breakdown ?? []).find((item) => Number(item.month) === index + 1)?.days_used)
  );

const createState = () => ({
  requests: { pending: 0, approved: 0 },
  annual: toBalance(null),
  // preneseni dani starog godišnjeg i do kada važe
  carryover: { days: 0, expires_on: "" },
  general: toBalance(null),
  graphs: { work_from_home: toMonths([]), annual_leave: toMonths([]) },
  upcoming: [],
  team_name: "",
  is_loading: false,
  error: null
});

export const useDashboardStore = defineStore("dashboard", {
  state: createState,

  actions: {
    async fetchPersonal() {
      const { get } = useApi();
      const auth_store = useAuthStore();

      this.is_loading = true;
      this.error = null;

      const [requests, balance, wfh, annual, mine] = await Promise.all([
        get("dashboard/getUserRequestsSummary", { auth: true }),
        get("dashboard/getUserBalanceSummary", { auth: true }),
        get("dashboard/getUserWorkFromHomeGraph", { auth: true }),
        get("dashboard/getUserAnnualLeaveGraph", { auth: true }),
        fetchAllPages("leave/getLeaveRequests", "requests", { status: { value: "APPROVED" } }),
        // ime za pozdrav i tim, profil se možda još nije učitao
        !auth_store.profile && auth_store.fetchMyProfile()
      ]);

      this.is_loading = false;

      // bez salda i broja zahtjeva panel nema šta da prikaže
      const error = requests.error ?? balance.error;

      if (error) {
        this.error = error;
        return error;
      }

      const summary = requests.data?.data?.data ?? {};
      const balances = balance.data?.data?.data ?? {};

      this.requests = {
        pending: number(summary.pending_requests_count),
        approved: number(summary.approved_requests_count)
      };
      this.annual = toBalance(balances.annual_leave);
      this.carryover = {
        days: number(balances.carryover_expiring_days?.days_remaining),
        expires_on: day(balances.carryover_expiring_days?.expires_on)
      };
      this.general = toBalance(balances.general_leave_days_used);
      this.graphs = {
        work_from_home: toMonths(wfh.data?.data?.data?.monthly_breakdown),
        annual_leave: toMonths(annual.data?.data?.data?.monthly_breakdown)
      };

      // odobreni koji još nisu završeni, najbliži prvi
      const today = todayIso();

      this.upcoming = mine.items
        .filter((request) => request.status === "APPROVED" && day(request.end_date) >= today)
        .map((request) => ({
          id: request.id,
          leave_type: leaveTypeName(request.leave_type?.name),
          start_date: day(request.start_date),
          end_date: day(request.end_date)
        }))
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, UPCOMING_LIMIT);

      this.fetchTeamName();
    },

    // profil ima samo team_id, naziv uzimamo iz liste timova
    async fetchTeamName() {
      const team_id = useAuthStore().profile?.team_id;

      if (!team_id) return;

      const { items } = await fetchAllPages("team/getTeams", "teams");

      this.team_name = items.find((team) => team.id === team_id)?.name ?? "";
    },

    resetStore() {
      Object.assign(this, createState());
    }
  }
});
