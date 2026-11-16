import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { roleName } from "@/utils/role-name";
import { intlLocale } from "@/i18n";

const fullName = (user) => [user.first_name, user.last_name].filter(Boolean).join(" ");

// api: 12.1 getTeams
const toTeam = (team) => ({
  id: team.id,
  name: team.name,
  lead_id: team.team_lead_id ?? null,
  lead_name: team.team_lead_name ?? "",
  member_count: team.member_count ?? 0,
  updated_at: team.updated_at ?? team.created_at ?? null
});

// api: 12.2 getSingleTeam, jedan član tima
// role je getter da naziv sistemske uloge prati promjenu jezika
const toMember = (member) => ({
  id: member.id,
  name: fullName(member),
  email: member.email,
  get role() {
    return roleName(member.role?.name);
  },
  hire_date: member.hire_date
});

const compareValues = (a, b) => String(a ?? "").localeCompare(String(b ?? ""), intlLocale());

export const useTeamsStore = defineStore("teams", {
  state: () => ({
    teams: [],
    is_loading: false,
    error: null,
    team_search: "",

    // desna strana, članovi izabranog tima
    selected_id: null,
    members: [],
    is_members_loading: false,
    members_error: null,
    member_search: "",
    checked_ids: [],

    sort: null,
    page: 1,
    per_page: 10,
    request_token: 0,
    members_token: 0
  }),

  getters: {
    selected_team: (state) => state.teams.find((team) => team.id === state.selected_id) ?? null,

    // pretraga timova, lokalna
    filtered_teams: (state) => {
      const query = state.team_search.trim().toLowerCase();
      if (!query) return state.teams;

      return state.teams.filter((team) => team.name.toLowerCase().includes(query));
    },

    filtered_members: (state) => {
      const query = state.member_search.trim().toLowerCase();
      if (!query) return state.members;

      return state.members.filter((member) =>
        `${member.name} ${member.email}`.toLowerCase().includes(query)
      );
    },

    // sortiranje lokalno
    sorted_members() {
      if (!this.sort) return this.filtered_members;

      const { key, direction } = this.sort;
      const factor = direction === "asc" ? 1 : -1;

      return [...this.filtered_members].sort((a, b) => compareValues(a[key], b[key]) * factor);
    },

    total_items() {
      return this.filtered_members.length;
    },

    total_pages() {
      return Math.max(1, Math.ceil(this.total_items / this.per_page));
    },

    paginated_members() {
      const start = (this.page - 1) * this.per_page;
      return this.sorted_members.slice(start, start + this.per_page);
    }
  },

  actions: {
    refresh() {
      return Promise.all([this.fetchTeams(), this.fetchMembers()]);
    },

    // api: 12.1 getTeams
    async fetchTeams() {
      const token = ++this.request_token;
      this.is_loading = true;
      this.error = null;

      try {
        const { items, error } = await fetchAllPages("team/getTeams", "teams");
        if (token !== this.request_token) return;

        if (error) {
          this.error = error;
          return error;
        }

        this.teams = items.map(toTeam);

        if (!this.selected_team) await this.selectTeam(this.teams[0]?.id ?? null);
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    async selectTeam(id) {
      this.selected_id = id;
      this.member_search = "";
      this.checked_ids = [];
      this.sort = null;
      this.page = 1;

      return this.fetchMembers();
    },

    // api: 12.2 getSingleTeam
    async fetchMembers() {
      const token = ++this.members_token;
      this.members = [];
      this.members_error = null;

      if (!this.selected_id) return;

      this.is_members_loading = true;

      try {
        const { items, error } = await fetchAllPages(
          `team/getSingleTeam/${this.selected_id}`,
          "members"
        );
        if (token !== this.members_token) return;

        if (error) {
          this.members_error = error;
          return error;
        }

        this.members = items.map(toMember);
      } finally {
        if (token === this.members_token) this.is_members_loading = false;
      }
    },

    // api: 12.3 createTeam
    async createTeam(form) {
      const { post } = useApi();
      const { data, error } = await post(
        "team/createTeam",
        { name: form.name.trim(), team_lead_id: form.lead_id },
        { auth: true }
      );
      if (error) return error;

      await this.fetchTeams();
      await this.selectTeam(data?.data?.data?.id ?? this.selected_id);
    },

    // api: 12.4 editTeam
    async updateTeam(id, changes) {
      const { patch } = useApi();
      const { error } = await patch(`team/updateTeam/${id}`, changes, { auth: true });
      if (error) return error;

      await this.fetchTeams();
    },

    // api: 12.5 deleteTeam, soft delete
    async deleteTeam(id) {
      const { del } = useApi();
      const { error } = await del(`team/deleteTeam/${id}`, { auth: true });
      if (error) return error;

      if (this.selected_id === id) this.selected_id = null;
      await this.fetchTeams();
    },

    // api: 12.6 assignUsersToTeam
    async addMembers(user_ids) {
      const { patch } = useApi();
      const { error } = await patch(
        `team/assignUsersToTeam/${this.selected_id}`,
        { user_ids },
        { auth: true }
      );
      if (error) return error;

      await this.refresh();
    },

    // api: 12.7 removeUsersFromTeam
    async removeMembers(user_ids) {
      const { patch } = useApi();
      const { error } = await patch(
        `team/removeUsersFromTeam/${this.selected_id}`,
        { user_ids },
        { auth: true }
      );
      if (error) return error;

      this.checked_ids = this.checked_ids.filter((id) => !user_ids.includes(id));
      await this.refresh();
    },

    setTeamSearch(value) {
      this.team_search = value;
    },
    setMemberSearch(value) {
      this.member_search = value;
      this.page = 1;
    },
    setSort(sort) {
      this.sort = sort;
      this.page = 1;
    },
    toggleChecked(id) {
      this.checked_ids = this.checked_ids.includes(id)
        ? this.checked_ids.filter((checked) => checked !== id)
        : [...this.checked_ids, id];
    },
    toggleAllOnPage(checked) {
      const page_ids = this.paginated_members.map((member) => member.id);
      const rest = this.checked_ids.filter((id) => !page_ids.includes(id));

      this.checked_ids = checked ? [...rest, ...page_ids] : rest;
    },

    resetStore() {
      const request_token = this.request_token + 1;
      const members_token = this.members_token + 1;

      this.$reset();
      this.request_token = request_token;
      this.members_token = members_token;
    }
  }
});
