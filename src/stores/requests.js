import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { leaveTypeName, leaveTypeSourceName } from "@/utils/leave-type-name";
import { toApiDate } from "@/utils/api-date";
import { fetchUserHolidays } from "@/utils/user-holidays";
import { refreshUntil } from "@/utils/refresh-until";
import { useAuthStore } from "@/stores/auth";
import { countFilters } from "@/utils/filter-count";

const fullName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(" ");

// isti oblik za 9.2 i 9.3, kartica ne mora da zna odakle je zahtjev
const toRequest = (request) => ({
  id: request.id,
  user_id: request.user?.id ?? null,
  employee: fullName(request.user),
  team: request.user?.team?.name ?? "",
  leave_type: leaveTypeName(request.leave_type?.name),
  start_date: request.start_date,
  end_date: request.end_date,
  status: request.status,
  change_type: request.change_type,
  is_my_assignment: request.is_my_assignment ?? true,
  created_at: request.created_at,
  is_decided: false
});

const createDefaultFilters = () => ({ leave_type_id: null, from: "", to: "" });

// trajanje ovih tipova računa backend iz polise, pa ne šaljemo end_date
// (400.010.011), dokumentacija to navodi samo za porodiljsko
const FIXED_DURATION_TYPES = ["Porodiljsko", "Smrtni slučaj", "Davanje krvi"];

export const useRequestsStore = defineStore("requests", {
  state: () => ({
    items: [],
    leave_types: [],
    mode: "approve",
    search: "",
    filters: createDefaultFilters(),
    is_loading: false,
    error: null,
    request_token: 0,
    // 9.2 ne vraća user, pa ime i tim dopunjujemo sami
    owner: null,
    // polisa i moji zahtjevi, za provjeru preklapanja i limita prije slanja
    policy: null,
    my_requests: [],
    my_team: ""
  }),

  getters: {
    // pretraga radi u browseru, API nema parametar za tekst
    filtered_items: (state) => {
      const query = state.search.trim().toLowerCase();

      if (!query) return state.items;

      return state.items.filter((item) =>
        [item.employee, item.team, item.leave_type].join(" ").toLowerCase().includes(query)
      );
    },

    has_filters: (state) =>
      Object.values(state.filters).some((value) => value !== null && value !== ""),

    filter_count: (state) => countFilters(state.filters),

    leave_type_options: (state) =>
      state.leave_types.map((type) => ({ value: type.id, label: type.name }))
  },

  actions: {
    // api: 9.3 ili 9.2, isti filteri
    async fetchRequests() {
      const token = ++this.request_token;
      const { leave_type_id, from, to } = this.filters;

      this.is_loading = true;
      this.error = null;

      try {
        const endpoint =
          this.mode === "approve" ? "leave/getLeaveRequestsToApprove" : "leave/getLeaveRequests";

        const auth_store = useAuthStore();

        // profil se učitava uporedo sa listom
        const [result] = await Promise.all([
          fetchAllPages(endpoint, "requests", {
            leave_type_id: { value: leave_type_id },
            from: { value: toApiDate(from) },
            to: { value: toApiDate(to) }
          }),
          this.mode === "mine" && !auth_store.profile && auth_store.fetchMyProfile()
        ]);

        // u međuvremenu je krenuo noviji zahtjev, ovaj odgovor je zastario
        if (token !== this.request_token) return;

        if (result.error) {
          this.error = result.error;
          return result.error;
        }

        const items = result.items.map(toRequest);

        // 9.2 ne vraća user, vlasnik je uvijek prijavljeni korisnik
        if (this.mode === "mine") {
          const owner = await this.resolveOwner(items);

          if (token !== this.request_token) return;

          this.items = items.map((item) => ({
            ...item,
            user_id: owner.id,
            employee: item.employee || owner.name,
            team: item.team || owner.team
          }));
          return;
        }

        // 9.3 već ima moje zahtjeve sa timom kad odobravam sve
        const my_team = items.find((item) => item.user_id === auth_store.user.id)?.team;

        if (my_team) this.my_team = my_team;

        this.items = items;
      } finally {
        if (token === this.request_token) this.is_loading = false;
      }
    },

    // ime (4.7) i tim (9.10) prijavljenog korisnika za Moje zahtjeve
    async resolveOwner(items) {
      if (this.owner?.team || (this.owner && !items.length)) return this.owner;

      const auth_store = useAuthStore();
      const me = auth_store.profile ?? auth_store.user;

      // tim iz liste 9.3 ako postoji, inače iz detalja jednog mog zahtjeva
      const team =
        this.my_team ||
        (items.length ? ((await this.fetchRequestDetails(items[0].id)).data?.team ?? "") : "");

      this.owner = {
        id: me.id ?? auth_store.user.id,
        name: fullName(me) || fullName(auth_store.user),
        team
      };

      return this.owner;
    },

    // api: 10.1 getLeaveTypes
    async fetchLeaveTypes() {
      const { get } = useApi();
      const [types, balances] = await Promise.all([
        fetchAllPages("leaveType/getLeaveTypes", "leave_types"),
        get("leaveBalance/getMyLeaveBalances", { auth: true })
      ]);

      if (types.error) return types.error;

      const balance_list = balances.error ? [] : (balances.data?.data?.data?.balances ?? []);

      this.leave_types = types.items.map((type) => {
        const balance = balance_list.find((item) => item.leave_type_id === type.id);

        return {
          ...type,
          name: leaveTypeName(type.name),
          // poredimo po prevedenom nazivu, ne zavisi od zapisa sa backenda
          fixed_duration: FIXED_DURATION_TYPES.includes(leaveTypeSourceName(type.name)),
          remaining: type.counts_against_balance && balance ? Number(balance.remaining_days) : null
        };
      });
    },

    // praznici korisnika, za broj radnih dana u formi
    async fetchHolidayDates(date_from, date_to) {
      const holidays = await fetchUserHolidays(date_from, date_to);

      return holidays.map((holiday) => holiday.date);
    },

    // polisa i moji zahtjevi za formu, ako pukne provjeru radi samo backend
    async fetchSubmitContext() {
      const { get } = useApi();
      const auth_store = useAuthStore();

      // profil treba zbog hire_date (pravo na godišnji)
      const [policy, mine] = await Promise.all([
        get("policy/getCurrentPolicy", { auth: true }),
        fetchAllPages("leave/getLeaveRequests", "requests"),
        !auth_store.profile && auth_store.fetchMyProfile()
      ]);

      this.policy = policy.error ? null : (policy.data?.data?.data ?? null);
      this.my_requests = mine.error ? [] : mine.items.map(toRequest);
    },

    // api: 9.1, porodiljsko šalje i maternity_leave_details
    async submitRequest({ leave_type_id, start_date, end_date, reason, maternity_leave_details }) {
      const { post } = useApi();
      const body = { leave_type_id, start_date: toApiDate(start_date) };

      if (end_date) body.end_date = toApiDate(end_date);
      if (reason) body.reason = reason;

      if (maternity_leave_details) {
        body.maternity_leave_details = {
          expected_due_date: toApiDate(maternity_leave_details.expected_due_date),
          child_order: maternity_leave_details.child_order
        };
      }

      const { data, error } = await post("leave/createLeaveRequest", body, { auth: true });

      if (error) return { error };

      const created = data?.data?.data ?? null;

      // osvježi listu da se novi zahtjev odmah vidi
      await Promise.all([
        this.fetchLeaveTypes(),
        refreshUntil(
          () => this.fetchRequests(),
          () => this.mode !== "mine" || this.items.some((item) => item.id === created?.id)
        )
      ]);

      return { created };
    },

    // api: 9.10 detalji zahtjeva za bočni panel
    async fetchRequestDetails(id) {
      // dokumentacija kaže POST, a backend prima samo GET
      const { get } = useApi();
      const { data, error } = await get(`leave/getSingleLeaveRequest/${id}`, { auth: true });

      if (error) return { error };

      const request = data?.data?.data ?? {};

      return {
        data: {
          ...toRequest(request),
          working_days: request.working_days ?? null,
          reason: request.reason ?? "",
          rejection_reason: request.rejection_reason ?? "",
          balance: request.balance ?? null,
          can_approve: Boolean(request.can_approve)
        }
      };
    },

    // api: 9.4 approveLeaveRequest/{id}
    async approveRequest(id) {
      // dokumentacija kaže PATCH, a backend prima samo POST
      const { post } = useApi();
      const { data, error } = await post(`leave/approveLeaveRequest/${id}`, null, { auth: true });

      if (error) return error;

      this.markDecided(id, data?.data?.data?.status ?? "APPROVED");
    },

    // api: 9.5 rejectLeaveRequest/{id}, razlog je obavezan
    async rejectRequest(id, reason) {
      // dokumentacija kaže PATCH, a backend prima samo POST
      const { post } = useApi();
      const { error } = await post(`leave/rejectLeaveRequest/${id}`, { reason }, { auth: true });

      if (error) return error;

      this.markDecided(id, "REJECTED");
    },

    // PENDING se povlači (9.6), APPROVED ide odobravaocu na otkazivanje (9.7)
    async cancelRequest(request) {
      const { patch } = useApi();
      const action = request.status === "PENDING" ? "withdrawLeaveRequest" : "cancelLeaveRequest";

      const { data, error } = await patch(`leave/${action}/${request.id}`, null, { auth: true });

      if (error) return error;

      const status = data?.data?.data?.status ?? "CANCELLED";

      this.items = this.items.map((item) => (item.id === request.id ? { ...item, status } : item));
    },

    // kartica ostaje na mjestu i pokazuje ishod do sljedećeg učitavanja
    markDecided(id, status) {
      this.items = this.items.map((item) =>
        item.id === id ? { ...item, status, is_decided: true } : item
      );
    },

    // staru listu odmah sklanjamo, nova dolazi cijela odjednom
    setMode(mode) {
      this.mode = mode;
      this.items = [];
      return this.fetchRequests();
    },

    setSearch(value) {
      this.search = value;
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      return this.fetchRequests();
    },

    clearFilters() {
      this.filters = createDefaultFilters();
      return this.fetchRequests();
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
