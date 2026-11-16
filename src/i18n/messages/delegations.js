// delegacije: stranica, paneli i dijalog za deaktivaciju
export default {
  sr: {
    title: "Delegacije",
    description: "Pregled i podešavanje delegacija i ovlašćenja.",
    add: "Dodaj delegaciju",
    settings_button: "Podešavanje delegiranja",
    search_placeholder: "Pretraži delegacije",
    filter_title: "Filter delegacija",
    status_label: "Status",
    status_placeholder: "Odaberite status delegacije",
    tabs: {
      all: "Sve delegacije",
      mine: "Moje delegacije"
    },
    status: {
      active: "Aktivna",
      scheduled: "Zakazana",
      expired: "Istekla",
      deactivated: "Deaktivirana"
    },
    groups: {
      active: "Aktivne",
      scheduled: "Zakazane",
      ended: "Istekle i deaktivirane"
    },
    summary: {
      label: "Pregled delegacija",
      total: "Ukupno",
      active: "Aktivne sada",
      scheduled: "Zakazane",
      ended: "Završene"
    },
    hero: {
      eyebrow_outgoing: "Vaša aktivna delegacija",
      eyebrow_incoming: "Delegirano vama",
      title_outgoing: "Vaša odobravanja preuzima zamenik",
      title_incoming: "Odobravate zahteve kao zamena",
      progress_label: "Proteklo od perioda delegacije",
      progress: "Dan {day} od {total}"
    },
    card: {
      from: "Delegira",
      to: "Zamenik",
      you: "Vi",
      arrow: "delegira na",
      open: "Otvori delegaciju: {from} na {to}",
      scope: "Ovlašćenje",
      scope_value: "Odobravanje zahteva za odsustvo",
      days_left: "još {count} dan | još {count} dana | još {count} dana",
      ends_today: "Završava se danas",
      starts_in: "počinje za {count} dan | počinje za {count} dana | počinje za {count} dana",
      ended_ago: "pre {count} dan | pre {count} dana | pre {count} dana",
      deactivated_on: "{date}"
    },
    actions_for: "Akcije za delegaciju od {name}",
    deactivate: "Deaktiviraj",
    count: "{count} delegacija | {count} delegacije | {count} delegacija",
    list_label: "Delegacije po statusu",
    empty: "Još nema delegacija",
    empty_hint: "Dodajte delegaciju kako bi zamenik odobravao zahteve dok ste odsutni.",
    empty_filtered: "Nema delegacija za zadatu pretragu",
    empty_filtered_hint: "Promenite pretragu ili filter i pokušajte ponovo.",
    clear_filters: "Očisti pretragu i filter",
    form: {
      delegated_by: "Delegirano od",
      delegated_by_placeholder: "Odaberite zaposlenog za koga se vrši delegacija zahteva",
      delegated_to: "Delegirano za",
      delegated_to_placeholder: "Odaberite zaposlenog kome se delegiraju zahtevi",
      absence_from: "Odsustvo od",
      absence_to: "Odsustvo do"
    },
    edit: {
      title: "Delegacija",
      deactivate: "Deaktiviraj delegaciju"
    },
    deactivate_dialog: {
      title: "Deaktiviraj delegaciju",
      notice:
        "Deaktiviranjem ove delegacije, izabrani zamenik više neće moći da pregleda niti odobrava zahteve u ime delegiranog zaposlenog. Svi zahtevi koji trenutno čekaju odobrenje biće vraćeni na podrazumevani lanac odobravanja.",
      confirm: "Da, deaktiviraj"
    },
    settings: {
      title: "Podešavanje delegiranja",
      backup_title: "Trajna rezerva",
      backup_text:
        "Osoba koja automatski preuzima Vaše delegirane zahteve ukoliko ne reagujete u roku, budete neaktivni ili ne posedujete aktiviranu delegaciju pre odsustva.",
      absence_title: "Delegacija pre odsustva",
      absence_text: "Odaberite zaposlenog ko odgovara na podnete zahteve ostalih zaposlenih.",
      backup_person: "Rezervna osoba",
      employee_placeholder: "Odaberi zaposlenog..."
    }
  },
  en: {
    title: "Delegations",
    description: "Review and manage delegations and approval rights.",
    add: "Add delegation",
    settings_button: "Delegation settings",
    search_placeholder: "Search delegations",
    filter_title: "Filter delegations",
    status_label: "Status",
    status_placeholder: "Select a delegation status",
    tabs: {
      all: "All delegations",
      mine: "My delegations"
    },
    status: {
      active: "Active",
      scheduled: "Scheduled",
      expired: "Expired",
      deactivated: "Deactivated"
    },
    groups: {
      active: "Active",
      scheduled: "Scheduled",
      ended: "Expired and deactivated"
    },
    summary: {
      label: "Delegation overview",
      total: "Total",
      active: "Active now",
      scheduled: "Scheduled",
      ended: "Ended"
    },
    hero: {
      eyebrow_outgoing: "Your active delegation",
      eyebrow_incoming: "Delegated to you",
      title_outgoing: "A stand-in is handling your approvals",
      title_incoming: "You're approving requests as a stand-in",
      progress_label: "Share of the delegation period elapsed",
      progress: "Day {day} of {total}"
    },
    card: {
      from: "Delegator",
      to: "Stand-in",
      you: "You",
      arrow: "delegates to",
      open: "Open delegation: {from} to {to}",
      scope: "Permission",
      scope_value: "Approving leave requests",
      days_left: "{count} day left | {count} days left",
      ends_today: "Ends today",
      starts_in: "starts in {count} day | starts in {count} days",
      ended_ago: "{count} day ago | {count} days ago",
      deactivated_on: "{date}"
    },
    actions_for: "Actions for delegation by {name}",
    deactivate: "Deactivate",
    count: "{count} delegation | {count} delegations",
    list_label: "Delegations by status",
    empty: "No delegations yet",
    empty_hint: "Add a delegation so a stand-in can approve requests while you're away.",
    empty_filtered: "No delegations match your search",
    empty_filtered_hint: "Change the search or filter and try again.",
    clear_filters: "Clear search and filter",
    form: {
      delegated_by: "Delegated by",
      delegated_by_placeholder: "Select the employee whose approvals are delegated",
      delegated_to: "Delegated to",
      delegated_to_placeholder: "Select the employee who will handle the requests",
      absence_from: "Absent from",
      absence_to: "Absent until"
    },
    edit: {
      title: "Delegation",
      deactivate: "Deactivate delegation"
    },
    deactivate_dialog: {
      title: "Deactivate delegation",
      notice:
        "Once deactivated, the selected stand-in can no longer view or approve requests on behalf of the delegating employee. All requests awaiting approval will return to the default approval chain.",
      confirm: "Yes, deactivate"
    },
    settings: {
      title: "Delegation settings",
      backup_title: "Permanent backup",
      backup_text:
        "The person who automatically takes over your delegated requests if you don't respond in time, are inactive, or have no active delegation before an absence.",
      absence_title: "Delegation before absence",
      absence_text: "Select the employee who will respond to requests submitted by others.",
      backup_person: "Backup person",
      employee_placeholder: "Select an employee..."
    }
  }
};
