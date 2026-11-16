import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";

export const POLICY_KEYS = [
  "balance_model",
  "negative_balance_allowed",
  "max_negative_balance",
  "annual_leave_days",
  "eligibility_period_days",
  "first_part_min_days",
  "max_carryover_days",
  "carryover_deadline_month",
  "carryover_deadline_day",
  "paid_leave_general_days",
  "paid_leave_blood_donation_days",
  "paid_leave_family_death_days",
  "maternity_leave_days_first_second",
  "maternity_leave_days_third_plus",
  "work_from_home_monthly_limit",
  "birthday_bonus_enabled",
  "birthday_bonus_days",
  "seniority_bonus_enabled",
  "seniority_bonus_days_per_interval",
  "seniority_bonus_interval_years",
  "escalation_period_days",
  "auto_escalation_enabled",
  "fallback_routing_enabled",
  "modification_cutoff_days",
  "include_weekends_in_calendar"
];

// iz bilo kog odgovora uzimamo samo polja polise
export const pickPolicy = (data) =>
  Object.fromEntries(POLICY_KEYS.map((key) => [key, data?.[key] ?? null]));

export const usePolicyStore = defineStore("policy", {
  state: () => ({
    // 2.3 getCurrentPolicy, trenutno aktivna polisa
    current: null,
    // 2.5 getScheduledPolicy, zakazana izmjena (null = nema je)
    scheduled: null,
    is_loading: false,
    is_saving: false,
    error: null
  }),

  actions: {
    async fetchPolicies() {
      this.is_loading = true;
      this.error = null;

      try {
        const { get } = useApi();
        const [current, scheduled] = await Promise.all([
          get("policy/getCurrentPolicy", { auth: true }),
          get("policy/getScheduledPolicy", { auth: true })
        ]);

        if (current.error) {
          this.error = current.error;
          return current.error;
        }

        this.current = current.data?.data?.data ?? null;

        // 404 kod zakazane polise nije greška, samo nema zakazane izmjene
        if (scheduled.error && scheduled.status !== 404) {
          this.error = scheduled.error;
          return scheduled.error;
        }

        this.scheduled = scheduled.error ? null : (scheduled.data?.data?.data ?? null);
      } finally {
        this.is_loading = false;
      }
    },

    // 2.1 getDefaultPolicy, za dugme Vrati na podrazumevana podešavanja
    async fetchDefaultPolicy() {
      const { get } = useApi();
      const { data, error } = await get("policy/getDefaultPolicy", { auth: true });

      if (error) return { error };

      return { data: data?.data?.data ?? null };
    },

    // 2.4 schedulePolicyChange, ako zakazana izmjena postoji ova je zamjenjuje
    async schedulePolicy(values, effective_from) {
      const body = { ...pickPolicy(values), effective_from };

      this.is_saving = true;

      try {
        const { post } = useApi();
        const { error } = await post("policy/schedulePolicyChange", body, { auth: true });

        if (error) return error;

        await this.fetchPolicies();
      } finally {
        this.is_saving = false;
      }
    },

    // 2.6 cancelScheduledPolicy, trenutna polisa ostaje
    async cancelScheduledPolicy() {
      const { del } = useApi();
      const { error } = await del("policy/cancelScheduledPolicy", { auth: true });

      if (error) return error;

      this.scheduled = null;
    }
  }
});
