// delegacije: stranica, paneli i dijalog za deaktivaciju
export default {
  sr: {
    title: "Delegacije",
    description: "Pregled i podešavanje delegacija i ovlašćenja.",
    add: "Dodaj delegaciju",
    settings_button: "Podešavanje delegiranja",
    mine: "Moje delegacije",
    search_placeholder: "Pretraži delegacije",
    filter_title: "Filter delegacija",
    status_label: "Status",
    status_placeholder: "Odaberite status delegacije",
    status: {
      active: "Aktivna",
      inactive: "Neaktivna"
    },
    columns: {
      delegated_to: "Delegirano za",
      delegated_by: "Delegirano od",
      period: "Delegacija aktivna",
      status: "Status",
      created_at: "Kreirano",
      updated_at: "Izmenjeno"
    },
    actions_for: "Akcije za delegaciju od {name}",
    deactivate: "Deaktiviraj",
    count: "od {total} delegacije | od {total} delegacije | od {total} delegacija",
    empty: "Nema delegacija za prikaz.",
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
    mine: "My delegations",
    search_placeholder: "Search delegations",
    filter_title: "Filter delegations",
    status_label: "Status",
    status_placeholder: "Select a delegation status",
    status: {
      active: "Active",
      inactive: "Inactive"
    },
    columns: {
      delegated_to: "Delegated to",
      delegated_by: "Delegated by",
      period: "Active period",
      status: "Status",
      created_at: "Created",
      updated_at: "Updated"
    },
    actions_for: "Actions for delegation by {name}",
    deactivate: "Deactivate",
    count: "of {total} delegation | of {total} delegations",
    empty: "No delegations to show.",
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
