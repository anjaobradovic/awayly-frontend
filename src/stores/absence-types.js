import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { leaveTypeName } from "@/utils/leave-type-name";
import { intlLocale } from "@/i18n";

// backend salje druga imena polja, ovdje ih prevodimo za kartice
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

// sortiranje kartica; ključ ide u absence_types.sort.<ključ>
export const ABSENCE_TYPE_SORTS = {
  name_asc: (a, b) => a.name.localeCompare(b.name, intlLocale()),
  name_desc: (a, b) => b.name.localeCompare(a.name, intlLocale()),
  notice_desc: (a, b) => (b.notice_days ?? 0) - (a.notice_days ?? 0),
  notice_asc: (a, b) => (a.notice_days ?? 0) - (b.notice_days ?? 0)
};

// filter po vrsti: svi, sistemski ili prilagođeni
export const ABSENCE_TYPE_KINDS = ["all", "system", "custom"];

export const useAbsenceTypesStore = defineStore("absence-types", {
  state: () => ({
    items: [],
    is_loading: false,
    error: null,
    search: "",
    kind: "all",
    sort: "name_asc"
  }),

  getters: {
    // naziv se prevodi ovde, pa prati promenu jezika
    rows() {
      return this.items.map((item) => ({ ...item, name: leaveTypeName(item.api_name) }));
    },

    // pretraga po prevedenom i originalnom nazivu, pa vrsta, pa sortiranje
    filtered_items() {
      const query = this.search.trim().toLocaleLowerCase(intlLocale());
      const compare = ABSENCE_TYPE_SORTS[this.sort] ?? ABSENCE_TYPE_SORTS.name_asc;

      return this.rows
        .filter((row) => {
          if (this.kind === "system" && !row.is_system) return false;
          if (this.kind === "custom" && row.is_system) return false;
          if (!query) return true;

          return [row.name, row.api_name].some((name) =>
            String(name ?? "")
              .toLocaleLowerCase(intlLocale())
              .includes(query)
          );
        })
        .sort(compare);
    },

    total_items() {
      return this.filtered_items.length;
    },

    // brojevi za traku iznad kartica, uvijek nad svim tipovima
    summary() {
      return {
        total: this.items.length,
        system: this.items.filter((item) => item.is_system).length,
        custom: this.items.filter((item) => !item.is_system).length,
        balance: this.items.filter((item) => item.reduces_balance).length
      };
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

    setSearch(value) {
      this.search = value ?? "";
    },

    setKind(value) {
      this.kind = value;
    },

    setSort(value) {
      this.sort = value;
    },

    resetFilters() {
      this.search = "";
      this.kind = "all";
      this.sort = "name_asc";
    }
  }
});
