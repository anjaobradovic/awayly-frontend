// uloge i dozvole; system su sistemske uloge koje backend šalje na engleskom
export default {
  sr: {
    title: "Uloge",
    description: "Upravljanje pristupnim pravima i dozvolama.",
    add: "Dodaj ulogu",
    empty: "Nema uloga za prikaz.",
    count_of: "od {count} uloge | od {count} uloga | od {count} uloga",
    row_actions: "Akcije za {name}",
    delete_confirm: "Obrisati ulogu „{name}“? Korisnici sa ovom ulogom dobiće ulogu {employee}.",
    permission_value: "{permission}: {value}",
    type: {
      system: "Sistemska",
      custom: "Prilagođena"
    },
    columns: {
      name: "Uloga",
      type: "Tip",
      user_count: "Broj korisnika"
    },
    drawer: {
      title_details: "Detalji uloge",
      title_add: "Dodaj novu ulogu",
      basics: "Osnovni podaci",
      name: "Naziv uloge",
      name_placeholder: "Unesite naziv uloge...",
      description: "Opis",
      description_placeholder: "Unesite opis uloge...",
      permissions: "Odabir permisija",
      remove: "Ukloni ulogu",
      save: "Izmeni ulogu",
      create: "Dodaj ulogu"
    },
    errors: {
      approval_conflict:
        "„Zahtevi tima“ i „Svi zahtevi“ ne mogu zajedno: svaki tip odsustva sme da pripada samo jednoj od njih, a izbor tipova odsustva još nije deo forme.",
      no_leave_types: "Nema tipova odsustva za koje bi uloga odobravala zahteve."
    },
    system: {
      employee: {
        name: "Zaposleni",
        description:
          "Osnovna uloga svakog zaposlenog: podnošenje i praćenje sopstvenih zahteva za odsustvo."
      },
      company_admin: {
        name: "Administrator",
        description:
          "Pun pristup svim podešavanjima kompanije, zaposlenima, ulogama i zahtevima."
      }
    },
    permissions: {
      request_approve_team: {
        label: "Zahtevi tima",
        description: "Pregled i odobravanje zahteva za odsustva direktno podređenih članova tima."
      },
      request_approve_all: {
        label: "Svi zahtevi",
        description: "Uvid u sve podnete zahteve za odsustva na nivou cele kompanije."
      },
      balance_view_team: {
        label: "Saldo tima",
        description: "Pregled preostalih dana odsustva i bolovanja za članove svog tima."
      },
      balance_view_all: {
        label: "Saldo firme",
        description: "Uvid u slobodne dane, prenesene dane i statuse za sve zaposlene u kompaniji."
      },
      balance_manage_all: {
        label: "Izmena salda",
        description: "Mogućnost ručnog prilagođavanja i korekcije salda slobodnih dana zaposlenih."
      },
      user_manage: {
        label: "Korisnici",
        description: "Upravljanje nalozima zaposlenih, dodavanje novih korisnika i dodela uloga."
      },
      report_generate_team: {
        label: "Izveštaji tima",
        description: "Pristup analitici i preuzimanje izveštaja o odsustvima za sopstveni tim."
      },
      report_generate_all: {
        label: "Izveštaji firme",
        description: "Generisanje i izvoz kompletne zbirne statistike i izveštaja za celu kompaniju."
      },
      audit_log_view: {
        label: "Istorija akcija",
        description: "Pregled sistemskog dnevnika izmena (audit log) i aktivnosti korisnika."
      },
      hierarchy_manage: {
        label: "Hijerarhija",
        description: "Podešavanje organizacione strukture, timova i lanaca odobravanja."
      },
      delegation_manage_others: {
        label: "Delegacije",
        form_label: "Delegiranje odobravanja",
        description: "Ovlašćenje za odobravanje zahteva na zamenike tokom odsustva menadžera."
      }
    }
  },
  en: {
    title: "Roles",
    description: "Manage access rights and permissions.",
    add: "Add role",
    empty: "No roles to show.",
    count_of: "of {count} role | of {count} roles",
    row_actions: "Actions for {name}",
    delete_confirm: "Delete the “{name}” role? Users with this role will be moved to {employee}.",
    permission_value: "{permission}: {value}",
    type: {
      system: "System",
      custom: "Custom"
    },
    columns: {
      name: "Role",
      type: "Type",
      user_count: "Users"
    },
    drawer: {
      title_details: "Role details",
      title_add: "Add new role",
      basics: "Basic info",
      name: "Role name",
      name_placeholder: "Enter role name...",
      description: "Description",
      description_placeholder: "Enter role description...",
      permissions: "Permissions",
      remove: "Delete role",
      save: "Update role",
      create: "Add role"
    },
    errors: {
      approval_conflict:
        "“Team requests” and “All requests” can't be combined: each leave type can belong to only one of them, and choosing leave types isn't part of the form yet.",
      no_leave_types: "There are no leave types this role could approve requests for."
    },
    system: {
      employee: {
        name: "Employee",
        description: "Every employee's base role: submit and track their own leave requests."
      },
      company_admin: {
        name: "Administrator",
        description: "Full access to company settings, employees, roles and requests."
      }
    },
    permissions: {
      request_approve_team: {
        label: "Team requests",
        description: "Review and approve leave requests from direct reports."
      },
      request_approve_all: {
        label: "All requests",
        description: "View every leave request submitted across the company."
      },
      balance_view_team: {
        label: "Team balance",
        description: "View remaining leave and sick days for members of your team."
      },
      balance_view_all: {
        label: "Company balance",
        description: "View days off, carried-over days and statuses for all employees."
      },
      balance_manage_all: {
        label: "Edit balance",
        description: "Manually adjust and correct employees' leave balances."
      },
      user_manage: {
        label: "Users",
        description: "Manage employee accounts, add new users and assign roles."
      },
      report_generate_team: {
        label: "Team reports",
        description: "Access analytics and download leave reports for your own team."
      },
      report_generate_all: {
        label: "Company reports",
        description: "Generate and export full company-wide statistics and reports."
      },
      audit_log_view: {
        label: "Activity log",
        description: "View the system audit log and user activity."
      },
      hierarchy_manage: {
        label: "Hierarchy",
        description: "Configure the org structure, teams and approval chains."
      },
      delegation_manage_others: {
        label: "Delegations",
        form_label: "Approval delegation",
        description: "Delegate request approval to deputies while a manager is away."
      }
    }
  }
};
