import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { roleName } from "@/utils/role-name";

const fullName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(" ");

const byLabel = (a, b) => a.label.localeCompare(b.label, "sr");

// api: approvalChain/getApprovalChains
const toChain = (chain) => ({
  id: chain.id,
  name: chain.name,
  applies_to_all: Boolean(chain.applies_to_all),
  teams: chain.teams ?? [],
  steps: (chain.steps ?? []).map((step) => ({
    approver_type: step.approver_type,
    role_id: step.role?.id ?? null,
    role_name: roleName(step.role?.name),
    user_id: step.user?.id ?? null,
    user_name: fullName(step.user)
  })),
  is_active: Boolean(chain.is_active),
  updated_at: chain.updated_at ?? chain.created_at ?? null
});

// forma iz panela -> tijelo zahtjeva
const toPayload = (form) => ({
  name: form.name.trim(),
  applies_to_all: form.scope === "all",
  team_ids: form.scope === "all" ? [] : form.team_ids,
  steps: form.steps.map(({ approver_type, role_id, user_id }) => ({
    approver_type,
    role_id: approver_type === "ROLE" ? role_id : null,
    user_id: approver_type === "USER" ? user_id : null
  })),
  is_active: form.is_active
});

export const useApprovalChainsStore = defineStore("approval-chains", {
  state: () => ({
    chains: [],
    is_loading: false,
    error: null,
    request_token: 0,

    // opcije za panel: timovi, uloge i zaposleni
    team_options: [],
    role_options: [],
    user_options: []
  }),

  getters: {
    active_count: (state) => state.chains.filter((chain) => chain.is_active).length
  },

  actions: {
    // api: approvalChain/getApprovalChains
    async fetchChains() {
      const token = ++this.request_token;

      this.is_loading = true;
      this.error = null;

      try {
        const { items, error } = await fetchAllPages(
          "approvalChain/getApprovalChains",
          "approval_chains"
        );
        if (token !== this.request_token) return;

        if (error) {
          this.error = error;
          return error;
        }

        this.chains = items.map(toChain);
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    async fetchOptions() {
      const { get } = useApi();

      const [teams, roles, users] = await Promise.all([
        fetchAllPages("team/getTeams", "teams"),
        get("role/getRoles", { auth: true }),
        fetchAllPages("user/getUsers", "users")
      ]);

      if (!teams.error) {
        this.team_options = teams.items
          .map((team) => ({ value: team.id, label: team.name }))
          .sort(byLabel);
      }

      if (!roles.error) {
        this.role_options = (roles.data?.data?.data?.roles ?? [])
          .map((role) => ({ value: role.id, label: roleName(role.name) }))
          .sort(byLabel);
      }

      if (!users.error) {
        this.user_options = users.items
          .filter((user) => user.status !== "DEACTIVATED")
          .map((user) => ({ value: user.id, label: fullName(user) }))
          .sort(byLabel);
      }
    },

    // api: approvalChain/createApprovalChain
    async createChain(form) {
      const { post } = useApi();
      const { error } = await post("approvalChain/createApprovalChain", toPayload(form), {
        auth: true
      });
      if (error) return error;

      await this.fetchChains();
    },

    // api: approvalChain/updateApprovalChain
    async updateChain(id, form) {
      const { patch } = useApi();
      const { error } = await patch(`approvalChain/updateApprovalChain/${id}`, toPayload(form), {
        auth: true
      });
      if (error) return error;

      await this.fetchChains();
    },

    // prekidač na kartici, odmah se vidi, vraća se ako server odbije
    async setActive(id, is_active) {
      const chain = this.chains.find((item) => item.id === id);
      if (!chain) return;

      const previous = chain.is_active;
      chain.is_active = is_active;

      const { patch } = useApi();
      const { error } = await patch(
        `approvalChain/updateApprovalChain/${id}`,
        { is_active },
        { auth: true }
      );

      if (error) {
        chain.is_active = previous;
        return error;
      }
    },

    // api: approvalChain/deleteApprovalChain
    async deleteChain(id) {
      const { del } = useApi();
      const { error } = await del(`approvalChain/deleteApprovalChain/${id}`, { auth: true });
      if (error) return error;

      await this.fetchChains();
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
