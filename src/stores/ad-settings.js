import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { t } from "@/i18n";
import { getErrorCode, getErrorMessage } from "@/utils/api-error";

// vrednost je ključ u errors.ad
const AD_ERRORS = {
  "409.020.001": "not_saved",
  "409.020.002": "not_tested",
  "409.020.004": "not_active",
  "409.020.005": "account_missing",
  "409.020.006": "no_users",
  "400.020.001": "connection_failed",
  "400.020.002": "bad_credentials"
};

export const getAdErrorMessage = (error) => {
  const key = AD_ERRORS[getErrorCode(error)];

  return key ? t(`errors.ad.${key}`) : getErrorMessage(error);
};

export const useAdSettingsStore = defineStore("ad-settings", {
  state: () => ({
    // odgovor 19.1 getAdSettings (lozinka se nikad ne vraća)
    settings: null,
    is_loading: false,
    error: null
  }),

  getters: {
    is_ad_active: (state) => state.settings?.auth_type === "AD",
    // test uspeo i podešavanja od tada nisu menjana (19.2 vraća tested_at na null)
    is_tested: (state) => Boolean(state.settings?.tested_at)
  },

  actions: {
    // api: 19.1 getAdSettings
    async fetchSettings() {
      const { get } = useApi();

      this.is_loading = true;
      this.error = null;

      const result = await get("ad/getAdSettings", { auth: true });

      this.is_loading = false;

      if (result.error) {
        this.error = result.error;
        return result.error;
      }

      this.settings = result.data?.data?.data ?? null;
    },

    // api: 19.2 updateAdSettings, šalju se samo izmijenjena polja
    async updateSettings(changes) {
      const { patch } = useApi();

      const result = await patch("ad/updateAdSettings", changes, { auth: true });

      if (result.error) return result.error;

      // odgovor nema auth_type, zadržavamo postojeći
      this.settings = { ...this.settings, ...result.data?.data?.data, tested_at: null };
    },

    // api: 19.3 testAdConnection, provjerava sačuvana podešavanja
    async testConnection() {
      const { post } = useApi();

      const result = await post("ad/testAdConnection", null, { auth: true });

      if (result.error) return result.error;

      this.settings = { ...this.settings, tested_at: result.data?.data?.data?.tested_at };
    },

    // api: 19.4 updateAuthenticationMethod, pa 19.5 triggerAdSync
    async activateAd() {
      const { patch, post } = useApi();

      const result = await patch(
        "ad/updateAuthenticationMethod",
        { auth_type: "AD" },
        { auth: true }
      );

      if (result.error) return { error: result.error };

      this.settings = { ...this.settings, auth_type: "AD" };


      const sync = await post("ad/triggerAdSync", null, { auth: true });

      return { sync_error: sync.error, sync: sync.data?.data?.data ?? null };
    }
  }
});
