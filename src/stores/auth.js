// token se NE čuva u localStorage, živi samo u memoriji
// pa refresh stranice znači ponovni login
import { defineStore, getActivePinia } from "pinia";
import { useApi } from "@/composables/useApi";
import router from "@/router";
import QRCode from "qrcode";

const createDefaultUser = () => ({
  id: null,
  first_name: null,
  last_name: null,
  email: null,
  company_id: null,
  status: null,
  first_time_otp: null,
  permissions: [],
  led_teams: []
});

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null,
    refresh_token: null,
    temporary_token: null,
    qr_code: null,
    backup_codes: [],
    user: createDefaultUser(),
    // odgovor 4.7 getMyProfile
    profile: null,
    is_loading: false
  }),

  getters: {
    is_authenticated: (state) => Boolean(state.token),

    user_full_name: (state) =>
      [state.user.first_name, state.user.last_name].filter(Boolean).join(" ")
  },

  actions: {
    // LOGIN
    async login(credentials) {
      const { post } = useApi();

      this.is_loading = true;

      try {
        const { data, error, status } = await post("auth/login", credentials);

        // 423 = nalog privremeno zaključan poslije previše pogrešnih pokušaja
        if (status === 423) return { ...error, is_locked: true };
        if (error) return error;

        const payload = data?.data?.data;

        this.user = payload?.user ?? createDefaultUser();

        if (payload?.access_token) {
          this.token = payload.access_token;
          this.refresh_token = payload.refresh_token ?? null;

          router.replace("/home");
          return;
        }

        this.temporary_token = payload?.temporary_token ?? null;

        if (this.user.first_time_otp) router.push({ name: "two-factor" });
        else router.push({ name: "two-factor-verify" });
      } finally {
        this.is_loading = false;
      }
    },

    // QR KOD za prvo podešavanje 2FA
    async retrieveTotp() {
      const { post } = useApi();

      const { data, error } = await post("auth/retrieveTotp", {
        temporary_token: this.temporary_token
      });

      if (error) return error;

      const payload = data?.data?.data;

      // backend šalje otpauth link, pretvaramo ga u QR sliku
      const totp_uri = payload?.totp_uri;

      if (!totp_uri) return;

      this.qr_code = await QRCode.toDataURL(totp_uri, { width: 480, margin: 1 });
    },

    // VERIFY TOTP, šestocifreni kod iz aplikacije daje pravi token
    async verifyTotp(otp) {
      const { post } = useApi();

      const { data, error } = await post("auth/verifyTotp", {
        temporary_token: this.temporary_token,
        otp
      });

      if (error) return error;

      const payload = data?.data?.data;

      this.token = payload?.access_token ?? null;
      this.refresh_token = payload?.refresh_token ?? null;
      this.backup_codes = payload?.backup_codes ?? [];
      this.user = payload?.user ?? this.user;
      this.temporary_token = null;
    },

    // VERIFY BACKUP CODE, rezervni kod umjesto koda iz aplikacije
    async verifyBackupCode(backup_code) {
      const { post } = useApi();

      const { data, error } = await post("auth/verifyBackupCode", {
        temporary_token: this.temporary_token,
        backup_code
      });

      if (error) return error;

      const payload = data?.data?.data;

      this.token = payload?.access_token ?? null;
      this.refresh_token = payload?.refresh_token ?? null;
      this.user = payload?.user ?? this.user;
      this.temporary_token = null;
    },

    // ZABORAVLJENA LOZINKA, backend šalje mejl sa linkom
    async requestPasswordReset(email) {
      const { post } = useApi();

      const { error } = await post("auth/requestPasswordReset", { email });

      if (error) return error;
    },

    // GET ME
    async getMe() {
      const { get } = useApi();

      const { data, error } = await get("user/getMyProfile", { auth: true });

      if (error) return error;

      this.user = data?.data?.data?.user ?? createDefaultUser();
    },

    // 4.7 GET MY PROFILE
    async fetchMyProfile() {
      const { get } = useApi();

      const { data, error } = await get("user/getMyProfile", { auth: true });

      if (error) return { error };

      this.profile = data?.data?.data ?? null;
      return { data: this.profile };
    },

    // 4.6 UPDATE MY PROFILE
    async updateMyProfile(changes) {
      const { patch } = useApi();

      const { data, error } = await patch("user/updateMyProfile", changes, { auth: true });

      if (error) return { error };

      this.profile = data?.data?.data ?? this.profile;
      return { data: this.profile };
    },

    // 1.7 CHANGE PASSWORD
    async changePassword(passwords) {
      const { patch } = useApi();

      const { error } = await patch("auth/changePassword", passwords, { auth: true });

      if (error) return error;

      await this.logout();
    },

    // 1.10 RESET TOTP
    async resetTotp(current_password) {
      const { post } = useApi();

      const { error } = await post("auth/resetTotp", { current_password }, { auth: true });

      if (error) return error;

      await this.logout();
    },

    // LOGOUT, api 1.6
    async logout() {
      if (this.refresh_token) {
        const { post } = useApi();

        await post("auth/logout", { refresh_token: this.refresh_token });
      }

      await router.replace("/login");

      this.resetAllStores();
    },

    // reset svih store-ova odjednom
    resetAllStores() {
      getActivePinia()?._s.forEach((store) => store.$reset());
    }
  }
});
