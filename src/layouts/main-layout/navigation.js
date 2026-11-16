// label je ključ prevoda (src/i18n/messages/nav.js)
export const NAVIGATION = [
  {
    label: "nav.dashboard",
    icon: "space_dashboard",
    children: [
      { label: "nav.personal_dashboard", to: "/home" },
      { label: "nav.team_dashboard", to: "/panel/team" },
      { label: "nav.company_dashboard", to: "/panel/company" }
    ]
  },
  {
    label: "nav.absences",
    icon: "luggage",
    children: [
      { label: "nav.calendar", to: "/abstances/calendar" },
      { label: "nav.requests", to: "/abstances/requests" },
      { label: "nav.delegations", to: "/abstances/delegations" },
      { label: "nav.holidays", to: "/abstances/holidays" },
      { label: "nav.absence_types", to: "/abstances/types" }
    ]
  },
  {
    label: "nav.organization",
    icon: "supervised_user_circle",
    children: [
      { label: "nav.employees", to: "/organization/employees" },
      { label: "nav.teams", to: "/organization/teams" },
      { label: "nav.roles", to: "/organization/roles" },
      { label: "nav.hierarchy", to: "/organization/hierarchy" }
    ]
  },
  {
    // Izvještaji nemaju padajući meni, klik vodi pravo na stranicu
    label: "nav.reports",
    icon: "description",
    to: "/reports"
  },
  {
    label: "nav.settings",
    icon: "settings",
    children: [
      { label: "nav.policies", to: "/settings/policies" },
      { label: "nav.approval_chains", to: "/settings/approval-chains" },
      { label: "nav.activity_log", to: "/settings/activity-log" },
      // ove dvije stavke otvaraju panel, nisu stranice
      { label: "nav.company_profile", action: "company-profile" },
      { label: "nav.integrations", action: "integrations" }
    ]
  }
];

const isPathActive = (path, to) => path === to || path.startsWith(`${to}/`);

// Ako se poklapa više stavki, pobjeđuje najduža putanja.
// Grupa bez children (npr. Izveštaji) je sama svoja stavka.
export const findActiveItem = (path) => {
  let result = null;

  for (const group of NAVIGATION) {
    for (const child of group.children ?? [group]) {
      if (!child.to || !isPathActive(path, child.to)) continue;

      if (!result || child.to.length > result.child.to.length) result = { group, child };
    }
  }

  return result;
};
