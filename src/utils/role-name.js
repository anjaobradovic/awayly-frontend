import { t } from "@/i18n";

// backend šalje sistemske uloge na engleskom, prevodimo samo njih
// getteri: prevod se čita pri prikazu, pa prati promjenu jezika
const SYSTEM_ROLES = { Employee: "employee", CompanyAdmin: "company_admin" };

export const ROLE_LABELS = Object.defineProperties(
  {},
  Object.fromEntries(
    Object.entries(SYSTEM_ROLES).map(([name, key]) => [
      name,
      { enumerable: true, get: () => t(`roles.system.${key}.name`) }
    ])
  )
);

export const roleName = (name) => ROLE_LABELS[name] ?? name ?? "";

export const roleDescription = (role) => {
  const key = role.is_system && SYSTEM_ROLES[role.name];

  return (key && t(`roles.system.${key}.description`)) || role.description || "";
};
