import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { roleDescription, roleName } from "@/utils/role-name";
import { intlLocale, t } from "@/i18n";

const APPROVAL_PERMISSIONS = ["REQUEST.APPROVE.TEAM", "REQUEST.APPROVE.ALL"];

// api 7.1
// naziv i opis sistemske uloge su getteri, prevod prati promjenu jezika
const toRole = (role) => ({
  id: role.id,
  api_name: role.name,
  get name() {
    return role.is_system ? roleName(role.name) : role.name;
  },
  get description() {
    return roleDescription(role);
  },
  is_system: role.is_system,
  user_count: role.user_count ?? 0,
  permissions: role.permissions ?? [],
  approval_scopes: role.approval_scopes ?? [],
  ...Object.fromEntries((role.permissions ?? []).map((key) => [key, true]))
});

const compareValues = (a, b) => {
  if (typeof a === "boolean" || typeof b === "boolean") {
    return Number(Boolean(a)) - Number(Boolean(b));
  }

  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a ?? "").localeCompare(String(b ?? ""), intlLocale());
};

const sameKeys = (a, b) => a.length === b.length && a.every((key) => b.includes(key));

const buildApprovalScopes = (permissions, role, leave_type_ids) => {
  const approve = permissions.filter((key) => APPROVAL_PERMISSIONS.includes(key));

  if (!approve.length) return { scopes: [] };

  const approve_before = (role?.permissions ?? []).filter((key) =>
    APPROVAL_PERMISSIONS.includes(key)
  );

  if (role?.approval_scopes.length && sameKeys(approve, approve_before)) {
    return { scopes: role.approval_scopes };
  }

  if (approve.length > 1) {
    return { error: { message: t("roles.errors.approval_conflict") } };
  }

  if (!leave_type_ids.length) {
    return { error: { message: t("roles.errors.no_leave_types") } };
  }

  return {
    scopes: leave_type_ids.map((leave_type_id) => ({ permission: approve[0], leave_type_id }))
  };
};

export const useRolesStore = defineStore("roles", {
  state: () => ({
    items: [],
    is_loading: false,
    error: null,
    sort: null,
    page: 1,
    per_page: 10,
    leave_type_ids: null
  }),
  getters: {
    approver_role_ids: (state) =>
      state.items
        .filter((role) => role.permissions.some((key) => APPROVAL_PERMISSIONS.includes(key)))
        .map((role) => role.id),

    sorted_items() {
      if (!this.sort) return this.items;

      const { key, direction } = this.sort;
      const factor = direction === "asc" ? 1 : -1;

      return [...this.items].sort((a, b) => compareValues(a[key], b[key]) * factor);
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
    async fetchRoles() {
      this.is_loading = true;
      this.error = null;

      try {
        //api  7.1
        const { get } = useApi();
        const { data, error } = await get("role/getRoles", { auth: true });

        if (error) {
          this.error = error;
          return error;
        }
        this.items = (data?.data?.data?.roles ?? []).map(toRole);
      } finally {
        this.is_loading = false;
      }
    },
    // api 10.1
    async fetchLeaveTypeIds() {
      if (this.leave_type_ids) return;

      const { items, error } = await fetchAllPages("leaveType/getLeaveTypes", "leave_types");

      if (error) return error;

      this.leave_type_ids = items.map((type) => type.id);
    },

    // body za kreiranje i izmjenu uloge
    async toRoleBody(form, role = null) {
      const has_approval = form.permissions.some((key) => APPROVAL_PERMISSIONS.includes(key));

      if (has_approval) {
        const error = await this.fetchLeaveTypeIds();

        if (error) return { error };
      }

      const { scopes, error } = buildApprovalScopes(
        form.permissions,
        role,
        this.leave_type_ids ?? []
      );

      if (error) return { error };

      return {
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          permissions: form.permissions,
          approval_scopes: scopes
        }
      };
    },

    // api 7.3
    async createRole(form) {
      const { body, error } = await this.toRoleBody(form);

      if (error) return error;

      const { post } = useApi();
      const result = await post("role/createRole", body, { auth: true });

      if (result.error) return result.error;

      await this.fetchRoles();
    },

    // api 7.4
    async updateRole(role, form) {
      const { body, error } = await this.toRoleBody(form, role);

      if (error) return error;

      const { patch } = useApi();
      const result = await patch(`role/updateRole/${role.id}`, body, { auth: true });

      if (result.error) return result.error;

      await this.fetchRoles();
    },

    //api 7.5
    async deleteRole(id) {
      const { del } = useApi();
      const { error } = await del(`role/deleteRole/${id}`, { auth: true });

      if (error) return error;

      this.items = this.items.filter((item) => item.id !== id);
      this.page = Math.min(this.page, this.total_pages);
    },
    setSort(sort) {
      this.sort = sort;
      this.page = 1;
    },
    resetStore() {
      this.$reset();
    }
  }
});
