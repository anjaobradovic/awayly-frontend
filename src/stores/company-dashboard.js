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

const toUtilization = (members) =>
  members
    .map((member) => ({
      id: member.user_id,
      name: fullName(member),
      used: number(member.annual_leave?.used),
      entitled: number(member.annual_leave?.entitled)
    }))
    .sort((a, b) => b.used - a.used || a.name.localeCompare(b.name, "sr"));

const createState = () => ({
  teams: [],
  // null = svi timovi
  team_id: null,
  requests: { pending: 0, approved: 0 },
  accounts: { pending: 0, active: 0 },
  absent: [],
  utilization: [],
  graphs: { work_from_home: toMonths([]), annual_leave: toMonths([]) },
  heatmap: { year: new Date().getFullYear(), leave_type_id: null, entries: [] },
  member_ids: [],
  leave_types: [],
  is_ready: false,
  is_loading: false,
  error: null,
  request_token: 0,
  heatmap_token: 0
});

// svi timovi: 15.9 do 15.12, izabran tim: 15.5 do 15.8
export const useCompanyDashboardStore = defineStore("company-dashboard", {
  state: createState,

  getters: {
    team_options: (state) => [
      { value: null, label: t("dashboard.all_teams") },
      ...state.teams.map((team) => ({ value: team.id, label: team.name }))
    ],

    leave_type_options: (state) => [
      { value: null, label: t("dashboard.all_leave_types") },
      ...state.leave_types.map((type) => ({
        value: type.id,
        label: leaveTypeLabel(leaveTypeName(type.name))
      }))
    ],

    absences_by_day(state) {
      if (!state.team_id) return groupAbsences(state.heatmap.entries);

      const member_ids = new Set(state.member_ids);

      return groupAbsences(
        state.heatmap.entries.filter(
          (entry) => entry.team_id === state.team_id || member_ids.has(entry.user_id)
        )
      );
    }
  },

  actions: {
    async init() {
      const [teams, types] = await Promise.all([
        fetchAllPages("team/getTeams", "teams"),
        fetchAllPages("leaveType/getLeaveTypes", "leave_types")
      ]);

      this.teams = teams.error ? [] : teams.items.map((team) => ({ id: team.id, name: team.name }));
      this.leave_types = types.error ? [] : types.items;
      this.is_ready = true;

      return this.selectTeam(null);
    },

    selectTeam(team_id) {
      this.team_id = team_id;

      return Promise.all([
        team_id ? this.fetchTeam() : this.fetchCompany(),
        this.fetchAccounts(),
        this.fetchHeatmap()
      ]);
    },

    async fetchCompany() {
      const { get } = useApi();
      const token = ++this.request_token;

      this.is_loading = true;
      this.error = null;

      const [requests, balance, wfh, annual] = await Promise.all([
        get("dashboard/getCompanyRequestsSummary", { auth: true }),
        get("dashboard/getCompanyBalanceSummary", { auth: true }),
        get("dashboard/getCompanyWorkFromHomeGraph", { auth: true }),
        get("dashboard/getCompanyAnnualLeaveGraph", { auth: true })
      ]);

      if (token !== this.request_token) return;

      this.is_loading = false;

      const error = requests.error ?? balance.error;

      if (error) {
        this.error = error;
        return error;
      }

      const summary = requests.data?.data?.data ?? {};
      const balances = balance.data?.data?.data ?? {};

      this.setSummary(summary, wfh, annual);
      this.member_ids = [];

      // 15.10 nema ljude, uzimamo ih iz 15.6 za svaki tim
      const people = await this.fetchAllMembers();

      if (token !== this.request_token) return;

      this.utilization = people
        ? toUtilization(people)
        : (balances.team_breakdown ?? [])
            .map((team) => ({
              id: team.team_id,
              name: team.team_name,
              percent: Math.round(number(team.average_utilization_percentage))
            }))
            .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name, "sr"));
    },

    // null kad nijedan tim nije učitan, tada ostaje prikaz po timovima
    async fetchAllMembers() {
      const { get } = useApi();

      const results = await Promise.all(
        this.teams.map((team) =>
          get("dashboard/getTeamBalanceSummary", {
            auth: true,
            filters: { team_id: { value: team.id } }
          })
        )
      );

      const loaded = results.filter((result) => !result.error);

      if (!loaded.length) return null;

      const people = new Map();

      loaded
        .flatMap((result) => result.data?.data?.data?.members ?? [])
        .forEach((member) => people.set(member.user_id, member));

      return [...people.values()];
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

      const members = balance.data?.data?.data?.members ?? [];

      this.setSummary(requests.data?.data?.data ?? {}, wfh, annual);
      this.utilization = toUtilization(members);
      this.member_ids = members.map((member) => member.user_id);
    },

    setSummary(summary, wfh, annual) {
      this.requests = {
        pending: number(summary.pending_requests_count),
        approved: number(summary.approved_requests_count)
      };
      this.absent = (summary.currently_absent ?? []).map(toAbsent);
      this.graphs = {
        work_from_home: toMonths(wfh.data?.data?.data?.monthly_breakdown),
        annual_leave: toMonths(annual.data?.data?.data?.monthly_breakdown)
      };
    },

    // treba nam samo total_count
    async fetchAccounts() {
      const { get } = useApi();
      const team_id = this.team_id;

      const count = async (status) => {
        const { data, error } = await get("user/getUsers", {
          auth: true,
          filters: {
            status: { value: status },
            team_id: { value: team_id },
            page_size: { value: 1 }
          }
        });

        return error ? 0 : number(data?.data?.data?.total_count);
      };

      const [pending, active] = await Promise.all([count("PENDING_INVITE"), count("ACTIVE")]);

      if (team_id !== this.team_id) return;

      this.accounts = { pending, active };
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
