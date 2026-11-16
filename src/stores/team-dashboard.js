import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { t } from "@/i18n";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { leaveTypeName } from "@/utils/leave-type-name";
import {
  groupAbsences,
  leaveTypeLabel,
  fetchHeatmapEntries,
  fullName,
  number,
  toAbsent,
  toMonths
} from "@/utils/dashboard-data";
import { useAuthStore } from "@/stores/auth";

// timski panel: tim ide preko 15.5 do 15.8, zaposleni preko 15.13, 15.15 i 15.16
// mapa je iz 17.2, filtrira se na tim ili zaposlenog
const createState = () => ({
  teams: [],
  team_id: null,
  // null = svi zaposleni u timu
  member_id: null,
  // 15.6, služi i za opcije zaposlenih
  members: [],
  requests: { pending: 0, approved: 0 },
  absent: [],
  graphs: { work_from_home: toMonths([]), annual_leave: toMonths([]) },
  // mapa odsustva
  heatmap: { year: new Date().getFullYear(), leave_type_id: null, entries: [] },
  leave_types: [],
  // false dok init() ne učita listu timova
  is_ready: false,
  is_loading: false,
  error: null,
  request_token: 0,
  heatmap_token: 0
});

export const useTeamDashboardStore = defineStore("team-dashboard", {
  state: createState,

  getters: {
    team_options: (state) => state.teams.map((team) => ({ value: team.id, label: team.name })),

    member_options: (state) => [
      { value: null, label: t("dashboard.all_members") },
      ...state.members.map((member) => ({ value: member.user_id, label: member.name }))
    ],

    // najviše iskorišćenih prvo, a ako je izabran zaposleni samo on
    utilization: (state) =>
      state.members
        .filter((member) => !state.member_id || member.user_id === state.member_id)
        .slice()
        .sort((a, b) => b.used - a.used || a.name.localeCompare(b.name, "sr")),

    visible_absent: (state) =>
      state.absent.filter((person) => !state.member_id || person.user_id === state.member_id),

    leave_type_options: (state) => [
      { value: null, label: t("dashboard.all_leave_types") },
      ...state.leave_types.map((type) => ({
        value: type.id,
        label: leaveTypeLabel(leaveTypeName(type.name))
      }))
    ],

    absences_by_day(state) {
      const member_ids = new Set(state.members.map((member) => member.user_id));

      return groupAbsences(
        state.heatmap.entries.filter((entry) =>
          state.member_id
            ? entry.user_id === state.member_id
            : entry.team_id === state.team_id || member_ids.has(entry.user_id)
        )
      );
    }
  },

  actions: {
    // prvo otvaranje: timovi (12.1 ili oni koje vodim) i tipovi
    async init() {
      const auth_store = useAuthStore();

      const [teams, types] = await Promise.all([
        fetchAllPages("team/getTeams", "teams"),
        fetchAllPages("leaveType/getLeaveTypes", "leave_types"),
        !auth_store.profile && auth_store.fetchMyProfile()
      ]);

      this.teams = teams.error
        ? (auth_store.user?.led_teams ?? []).map((team) => ({ id: team.id, name: team.name }))
        : teams.items.map((team) => ({ id: team.id, name: team.name }));
      this.leave_types = types.error ? [] : types.items;

      this.is_ready = true;

      // podrazumijevano moj tim, inače prvi sa liste
      const own = auth_store.profile?.team_id;
      const team_id = this.teams.some((team) => team.id === own) ? own : this.teams[0]?.id;

      if (!team_id) {
        this.error = teams.error ?? null;
        return;
      }

      return this.selectTeam(team_id);
    },

    async selectTeam(team_id) {
      this.team_id = team_id;
      this.member_id = null;

      return Promise.all([this.fetchTeam(), this.fetchHeatmap()]);
    },

    selectMember(member_id) {
      this.member_id = member_id;

      return this.fetchMember();
    },

    async fetchTeam() {
      const { get } = useApi();
      const token = ++this.request_token;
      const filters = { team_id: { value: this.team_id } };

      this.is_loading = true;
      this.error = null;

      const [requests, balance, wfh, annual] = await Promise.all([
        get("dashboard/getTeamRequestsSummary", { auth: true, filters }),
        get("dashboard/getTeamBalanceSummary", { auth: true, filters }),
        get("dashboard/getTeamWorkFromHomeGraph", { auth: true, filters }),
        get("dashboard/getTeamAnnualLeaveGraph", { auth: true, filters })
      ]);

      if (token !== this.request_token) return;

      this.is_loading = false;

      const error = requests.error ?? balance.error;

      if (error) {
        this.error = error;
        return error;
      }

      const summary = requests.data?.data?.data ?? {};

      this.requests = {
        pending: number(summary.pending_requests_count),
        approved: number(summary.approved_requests_count)
      };
      this.absent = (summary.currently_absent ?? []).map(toAbsent);
      this.members = (balance.data?.data?.data?.members ?? []).map((member) => ({
        id: member.user_id,
        user_id: member.user_id,
        name: fullName(member),
        used: number(member.annual_leave?.used),
        entitled: number(member.annual_leave?.entitled)
      }));
      this.graphs = {
        work_from_home: toMonths(wfh.data?.data?.data?.monthly_breakdown),
        annual_leave: toMonths(annual.data?.data?.data?.monthly_breakdown)
      };
    },

    // izabran zaposleni: zahtjevi i grafikoni samo za njega
    async fetchMember() {
      if (!this.member_id) return this.fetchTeam();

      const { get } = useApi();
      const token = ++this.request_token;
      const id = this.member_id;

      this.is_loading = true;

      const [requests, wfh, annual] = await Promise.all([
        get(`dashboard/getMemberRequestsSummary/${id}`, { auth: true }),
        get(`dashboard/getMemberWorkFromHomeGraph/${id}`, { auth: true }),
        get(`dashboard/getMemberAnnualLeaveGraph/${id}`, { auth: true })
      ]);

      if (token !== this.request_token) return;

      this.is_loading = false;

      if (requests.error) {
        this.error = requests.error;
        return requests.error;
      }

      const summary = requests.data?.data?.data ?? {};

      this.requests = {
        pending: number(summary.pending_requests_count),
        approved: number(summary.approved_requests_count)
      };
      this.graphs = {
        work_from_home: toMonths(wfh.data?.data?.data?.monthly_breakdown),
        annual_leave: toMonths(annual.data?.data?.data?.monthly_breakdown)
      };
    },

    async fetchHeatmap() {
      const token = ++this.heatmap_token;
      const entries = await fetchHeatmapEntries(this.heatmap.year, this.heatmap.leave_type_id);

      if (token !== this.heatmap_token) return;

      this.heatmap.entries = entries;
    },

    setHeatmapYear(year) {
      this.heatmap.year = year;
      return this.fetchHeatmap();
    },

    setHeatmapType(leave_type_id) {
      this.heatmap.leave_type_id = leave_type_id;
      return this.fetchHeatmap();
    },

    resetStore() {
      Object.assign(this, createState());
    }
  }
});
