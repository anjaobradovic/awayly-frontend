// timovi: lista, članovi i paneli
export default {
  sr: {
    title: "Timovi",
    description: "Struktura sektora, odeljenja i članova tima.",
    add: "Dodaj tim",
    search_placeholder: "Pretraži timove...",
    lead: "Vođa tima:",
    last_change: "poslednja izmena {date}",
    details: "Detalji tima",
    add_members: "Dodaj članove",
    remove_members: "Izbaci članove",
    member_search_placeholder: "Pretraži članove",
    select_all: "Izaberi sve na strani",
    select_member: "Izaberi {name}",
    row_actions: "Akcije za {name}",
    member_details: "Detalji zaposlenog",
    remove_member: "Isključi člana",
    remove_from_team: "Isključi člana iz tima",
    count_of: "od {count} zaposlenog | od {count} zaposlenih | od {count} zaposlenih",
    columns: {
      name: "Zaposleni",
      role: "Uloga",
      email: "Email",
      hire_date: "Datum zaposlenja"
    },
    empty: {
      no_search_teams: "Nema timova za ovu pretragu.",
      no_teams: "Još nema timova. Dodajte prvi tim.",
      no_search_members: "Nema zaposlenih za ovu pretragu.",
      no_members: "Tim još nema članova."
    },
    drawer: {
      title_add: "Dodaj novi tim",
      title_details: "Detalji tima",
      name: "Ime tima",
      name_placeholder: "Unesite ime tima",
      lead: "Vođa tima",
      lead_placeholder: "Odaberite vođu tima",
      delete: "Obriši tim",
      create: "Dodaj tim"
    },
    delete: {
      title: "Obriši tim",
      question: "Da li želite da obrišete tim {name}?",
      notice: "Svi članovi ostaju u kompaniji, ali bez tima. Možete ih kasnije dodati u drugi tim.",
      confirm: "Obriši tim"
    },
    add_dialog: {
      title: "Dodaj zaposlenog",
      text: "Izaberite nove članove tima",
      employee: "Zaposleni",
      placeholder: "Odaberi zaposlenog...",
      remove: "Ukloni {name}",
      submit: "Dodaj zaposlene"
    },
    remove_dialog: {
      title: "Isključi zaposlenog iz tima",
      question_one: "Da li želite da isključite zaposlenog {name} iz tima?",
      question_many:
        "Da li želite da isključite {n} zaposlenog iz tima? | Da li želite da isključite {n} zaposlena iz tima? | Da li želite da isključite {n} zaposlenih iz tima?",
      notice:
        "Zaposleni gubi pristup timskim podacima i rasporedu, ali njegov nalog u kompaniji ostaje aktivan. U svakom trenutku ga možete ponovo dodati.",
      confirm: "Isključi iz tima"
    }
  },
  en: {
    title: "Teams",
    description: "Departments, divisions and team members.",
    add: "Add team",
    search_placeholder: "Search teams...",
    lead: "Team lead:",
    last_change: "last updated {date}",
    details: "Team details",
    add_members: "Add members",
    remove_members: "Remove members",
    member_search_placeholder: "Search members",
    select_all: "Select all on page",
    select_member: "Select {name}",
    row_actions: "Actions for {name}",
    member_details: "Employee details",
    remove_member: "Remove member",
    remove_from_team: "Remove from team",
    count_of: "of {count} employee | of {count} employees",
    columns: {
      name: "Employee",
      role: "Role",
      email: "Email",
      hire_date: "Hire date"
    },
    empty: {
      no_search_teams: "No teams match your search.",
      no_teams: "No teams yet. Add the first one.",
      no_search_members: "No employees match your search.",
      no_members: "This team has no members yet."
    },
    drawer: {
      title_add: "Add new team",
      title_details: "Team details",
      name: "Team name",
      name_placeholder: "Enter team name",
      lead: "Team lead",
      lead_placeholder: "Select a team lead",
      delete: "Delete team",
      create: "Add team"
    },
    delete: {
      title: "Delete team",
      question: "Do you want to delete the {name} team?",
      notice: "All members stay in the company, just without a team. You can add them to another team later.",
      confirm: "Delete team"
    },
    add_dialog: {
      title: "Add employee",
      text: "Choose new team members",
      employee: "Employee",
      placeholder: "Select an employee...",
      remove: "Remove {name}",
      submit: "Add employees"
    },
    remove_dialog: {
      title: "Remove employee from team",
      question_one: "Do you want to remove {name} from the team?",
      question_many:
        "Do you want to remove {n} employee from the team? | Do you want to remove {n} employees from the team?",
      notice:
        "The employee loses access to team data and the schedule, but their company account stays active. You can add them back at any time.",
      confirm: "Remove from team"
    }
  }
};
