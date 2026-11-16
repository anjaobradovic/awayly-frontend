import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";

export const useCompanyStore = defineStore("company", {
  state: () => ({
    company: null,
    is_loading: false,
    error: null
  }),

  getters: {
    name: (state) => state.company?.name ?? ""
  },

  actions: {
    async fetchCompany() {
      const { get } = useApi();

      this.is_loading = true;
      this.error = null;

      const { data, error } = await get("company/getCompany", { auth: true });

      this.is_loading = false;

      if (error) {
        this.error = error;
        return error;
      }

      this.company = data?.data?.data ?? null;
    },

    async updateCompany(changes) {
      const { patch } = useApi();

      const { data, error } = await patch("company/updateCompany", changes, { auth: true });

      if (error) return error;

      this.company = data?.data?.data ?? { ...this.company, ...changes };
    }
  }
});
