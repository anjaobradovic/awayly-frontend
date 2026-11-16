// organizaciona struktura (Organizacija -> Hijerarhija)
export default {
  sr: {
    title: "Hijerarhija",
    description: "Ko kome odgovara u kompaniji.",
    search_placeholder: "Pretraži osobu, tim ili poziciju...",
    expand_all: "Otvori sve",
    collapse_all: "Zatvori sve",
    view: {
      label: "Prikaz",
      chart: "Dijagram",
      list: "Lista"
    },
    stats: {
      people: "{count} osoba | {count} osobe | {count} osoba",
      managers: "{count} rukovodilac | {count} rukovodioca | {count} rukovodilaca",
      teams: "{count} tim | {count} tima | {count} timova"
    },
    results: "Pronađena {count} osoba | Pronađene {count} osobe | Pronađeno {count} osoba",
    show_all: "Prikaži celu strukturu",
    empty: "Struktura još nije postavljena.",
    no_results: "Nema osoba za ovu pretragu.",
    no_position: "Bez pozicije",
    no_team: "Bez tima",
    reports: "{count} podređeni | {count} podređena | {count} podređenih",
    expand: "Prikaži podređene: {name}",
    collapse: "Sakrij podređene: {name}",
    open_person: "Detalji: {name}",
    pending_invite: "Pozvan",
    drawer: {
      title: "Detalji zaposlenog",
      contact: "Kontakt i tim",
      email: "Email",
      team: "Tim",
      role: "Uloga",
      manager: "Nadređeni",
      no_manager: "Nema nadređenog — vrh strukture.",
      direct_reports: "Direktni podređeni",
      no_reports: "Nema direktnih podređenih.",
      chain: "Linija odgovornosti",
      show_in_chart: "Prikaži u strukturi"
    }
  },
  en: {
    title: "Hierarchy",
    description: "Who reports to whom across the company.",
    search_placeholder: "Search people, teams or positions...",
    expand_all: "Expand all",
    collapse_all: "Collapse all",
    view: {
      label: "View",
      chart: "Chart",
      list: "List"
    },
    stats: {
      people: "{count} person | {count} people",
      managers: "{count} manager | {count} managers",
      teams: "{count} team | {count} teams"
    },
    results: "{count} person found | {count} people found",
    show_all: "Show full structure",
    empty: "The structure hasn't been set up yet.",
    no_results: "No people match your search.",
    no_position: "No position",
    no_team: "No team",
    reports: "{count} direct report | {count} direct reports",
    expand: "Show reports of {name}",
    collapse: "Hide reports of {name}",
    open_person: "Details: {name}",
    pending_invite: "Invited",
    drawer: {
      title: "Employee details",
      contact: "Contact and team",
      email: "Email",
      team: "Team",
      role: "Role",
      manager: "Manager",
      no_manager: "No manager — top of the structure.",
      direct_reports: "Direct reports",
      no_reports: "No direct reports.",
      chain: "Reporting line",
      show_in_chart: "Show in chart"
    }
  }
};
