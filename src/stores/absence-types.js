import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { leaveTypeName } from "@/utils/leave-type-name";
import { intlLocale } from "@/i18n";

// backend salje druga imena polja, ovdje ih prevodimo za tabelu
const toAbsenceType = (type) => ({
  id: type.id,
  // originalni naziv, za izmjenu se salje bas on; prevod pravi getter rows
  api_name: type.name,
  requires_approval: type.requires_approval,
  is_system: type.is_system,
  notice_days: type.min_advance_notice_days,
  requires_reason: type.requires_reason,
  allow_past_dates: type.allow_past_dates,
  reduces_balance: type.counts_against_balance
});

const compareValues = (a, b) => {
  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a).localeCompare(String(b), intlLocale());
};

export const useAbsenceTypesStore = defineStore("absence-types", {
  state: () => ({
    items: [],
    is_loading: false,
    error: null,
    sort: null,
    page: 1,
    per_page: 10
  }),

  getters: {
    // naziv se prevodi ovde, pa prati promenu jezika
    rows() {
      return this.items.map((item) => ({ ...item, name: leaveTypeName(item.api_name) }));
    },

    sorted_items() {
      if (!this.sort) return this.rows;

      const { key, direction } = this.sort;
      const factor = direction === "asc" ? 1 : -1;

      return [...this.rows].sort((a, b) => compareValues(a[key], b[key]) * factor);
    },

    total_items() {
      return this.items.length;
    },

    total_pages() {
      return Math.max(1, Math.ceil(this.total_items / this.per_page));
    },

    paginated_items() {
      const start = (this.page - 1) * this.per_page;

      return this.sorted_items.slice(start, start + this.per_page);
    }
  },

  actions: {
    async fetchTypes() {
      this.is_loading = true;
      this.error = null;

      try {
        const { items, error } = await fetchAllPages("leaveType/getLeaveTypes", "leave_types");

        if (error) {
          this.error = error;
          return error;
        }

        this.items = items.map(toAbsenceType);
      } finally {
        this.is_loading = false;
      }
    },

    // is_system server uvijek postavlja na false
    async createType(body) {
      const { post } = useApi();
      const { error } = await post("leaveType/createLeaveType", body, { auth: true });

      if (error) return error;

      await this.fetchTypes();
    },

    // kod sistemskih tipova name i counts_against_balance su zakljucani, pa ih ne saljemo
    async updateType(id, changes) {
      const { patch } = useApi();
      const { error } = await patch(`leaveType/updateLeaveType/${id}`, changes, { auth: true });

      if (error) return error;

      await this.fetchTypes();
    },

    // sistemski tipovi se ne mogu brisati
    async deleteType(id) {
      const { del } = useApi();
      const { error } = await del(`leaveType/deleteLeaveType/${id}`, { auth: true });

      if (error) return error;

      await this.fetchTypes();
    },

    setSort(sort) {
      this.sort = sort;
      this.page = 1;
    }
  }
});
