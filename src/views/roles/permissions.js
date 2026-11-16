import { t } from "@/i18n";

// dozvole uloga: ključ sa servera i ključ prevoda u roles.permissions
// label, form_label i description su getteri, pa prate promjenu jezika
const permission = (key, id, width, { form_label = false } = {}) => ({
  key,
  width,
  get label() {
    return t(`roles.permissions.${id}.label`);
  },
  get form_label() {
    return form_label ? t(`roles.permissions.${id}.form_label`) : undefined;
  },
  get description() {
    return t(`roles.permissions.${id}.description`);
  }
});

export const PERMISSIONS = [
  permission("REQUEST.APPROVE.TEAM", "request_approve_team", "5rem"),
  permission("REQUEST.APPROVE.ALL", "request_approve_all", "5rem"),
  permission("BALANCE.VIEW.TEAM", "balance_view_team", "4.25rem"),
  permission("BALANCE.VIEW.ALL", "balance_view_all", "4.25rem"),
  permission("BALANCE.MANAGE.ALL", "balance_manage_all", "4.75rem"),
  permission("USER.MANAGE", "user_manage", "5.5rem"),
  permission("REPORT.GENERATE.TEAM", "report_generate_team", "5.5rem"),
  permission("REPORT.GENERATE.ALL", "report_generate_all", "5.5rem"),
  // TODO: ključ za Istoriju akcija nije u dokumentaciji, provjeriti u getPermissions
  permission("AUDIT_LOG.VIEW", "audit_log_view", "5.25rem"),
  permission("HIERARCHY.MANAGE", "hierarchy_manage", "6.625rem"),
  permission("DELEGATION.MANAGE.OTHERS", "delegation_manage_others", "6.25rem", {
    form_label: true
  })
];
