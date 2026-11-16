// tipovi odsustva; names su sistemski tipovi koje backend šalje na engleskom
export default {
  sr: {
    title: "Tipovi odsustva",
    description: "Kategorije i definicije vrsta odsustava.",
    add: "Dodaj tip odsustva",
    names: {
      annual_leave: "Godišnji odmor",
      work_from_home: "Rad od kuće",
      sick_leave: "Bolovanje",
      sick_day: "Dan bolovanja",
      pregnancy_sick_leave: "Trudničko",
      maternity_leave: "Porodiljsko",
      parental_leave: "Roditeljsko",
      paid_leave_general: "Privatni poslovi",
      paid_leave_blood_donation: "Davanje krvi",
      paid_leave_family_death: "Smrtni slučaj",
      slava: "Krsna slava",
      unpaid_leave: "Neplaćeno odsustvo"
    },
    system: "Sistemski",
    custom: "Prilagođeni",
    approval: {
      yes: "Potrebno",
      no: "Nije potrebno"
    },
    reason: {
      yes: "Potreban",
      no: "Nije potreban"
    },
    past_dates: {
      yes: "Dozvoljeno",
      no: "Nije dozvoljeno"
    },
    balance: {
      yes: "Aktivirano",
      no: "Deaktivirano"
    },
    balance_option: {
      yes: "Umanjuje balans",
      no: "Ne umanjuje balans"
    },
    actions_for: "Akcije za {name}",
    empty: "Nema tipova odsustva za prikaz.",
    empty_text: "Dodajte prvi tip odsustva da bi zaposleni mogli da podnose zahteve.",
    no_results: "Nijedan tip ne odgovara pretrazi",
    no_results_text: "Probajte drugi naziv ili poništite filtere.",
    reset_filters: "Poništi filtere",
    search_placeholder: "Pretraži tipove odsustva",
    summary: {
      label: "Pregled tipova odsustva",
      total: "Ukupno tipova",
      system: "Sistemski",
      custom: "Prilagođeni",
      balance: "Umanjuju balans"
    },
    kind_filter: {
      all: "Svi",
      system: "Sistemski",
      custom: "Prilagođeni"
    },
    sort: {
      label: "Sortiranje",
      name_asc: "Naziv A–Š",
      name_desc: "Naziv Š–A",
      notice_desc: "Najduža najava",
      notice_asc: "Najkraća najava"
    },
    group_count: "{count} tip | {count} tipa | {count} tipova",
    shown_count: "Prikazano {count} od {total}",
    card: {
      open_details: "Detalji tipa {name}",
      notice: "Najava",
      no_notice: "Bez roka",
      approval: "Odobrenje",
      reason: "Razlog",
      past_dates: "Prošli datumi",
      balance: "Balans",
      balance_yes: "Umanjuje",
      balance_no: "Ne umanjuje",
      locked: "Sistemski tip se ne može menjati ni brisati"
    },
    form: {
      add_title: "Dodaj tip odsustva",
      edit_title: "Izmeni tip odsustva",
      details_title: "Detalji tipa odsustva",
      name: "Ime",
      name_placeholder: "Unesite ime tipa odsustva",
      balance: "Uticaj na balans",
      balance_placeholder: "Odaberite da li odobreni zahtev utiče na balans",
      approval: "Odobrenje",
      approval_placeholder: "Potrebno odobrenje nadređenog",
      reason: "Razlog podnošenja zahteva",
      reason_placeholder: "Odaberi potrebu unošenja razloga",
      notice: "Rok za podnošenje pre odobrenja",
      notice_placeholder: "Broj dana pre kog je podnošenje zahteva omogućeno",
      past_dates: "Dozvoli podnošenje u prošlosti",
      past_dates_placeholder: "Odaberi opciju",
      submit: "Dodaj tip"
    },
    delete_dialog: {
      title: "Obriši tip odsustva",
      text: "Da li ste sigurni da želite da obrišete tip odsustva „{name}“?",
      notice:
        "Zaposleni više neće moći da podnose zahteve za ovaj tip odsustva. Postojeći zahtevi ostaju sačuvani u istoriji.",
      confirm: "Obriši tip"
    }
  },
  en: {
    title: "Absence types",
    description: "Categories and rules for each kind of absence.",
    add: "Add absence type",
    names: {
      annual_leave: "Annual leave",
      work_from_home: "Work from home",
      sick_leave: "Sick leave",
      sick_day: "Sick day",
      pregnancy_sick_leave: "Pregnancy sick leave",
      maternity_leave: "Maternity leave",
      parental_leave: "Parental leave",
      paid_leave_general: "Personal leave",
      paid_leave_blood_donation: "Blood donation",
      paid_leave_family_death: "Bereavement leave",
      slava: "Slava (family patron saint day)",
      unpaid_leave: "Unpaid leave"
    },
    system: "System",
    custom: "Custom",
    approval: {
      yes: "Required",
      no: "Not required"
    },
    reason: {
      yes: "Required",
      no: "Not required"
    },
    past_dates: {
      yes: "Allowed",
      no: "Not allowed"
    },
    balance: {
      yes: "Enabled",
      no: "Disabled"
    },
    balance_option: {
      yes: "Deducts from balance",
      no: "Doesn't deduct from balance"
    },
    actions_for: "Actions for {name}",
    empty: "No absence types to show.",
    empty_text: "Add the first absence type so employees can start requesting time off.",
    no_results: "No types match your search",
    no_results_text: "Try another name or clear the filters.",
    reset_filters: "Clear filters",
    search_placeholder: "Search absence types",
    summary: {
      label: "Absence types overview",
      total: "Total types",
      system: "System",
      custom: "Custom",
      balance: "Deduct balance"
    },
    kind_filter: {
      all: "All",
      system: "System",
      custom: "Custom"
    },
    sort: {
      label: "Sort",
      name_asc: "Name A–Z",
      name_desc: "Name Z–A",
      notice_desc: "Longest notice",
      notice_asc: "Shortest notice"
    },
    group_count: "{count} type | {count} types",
    shown_count: "Showing {count} of {total}",
    card: {
      open_details: "Details for {name}",
      notice: "Notice",
      no_notice: "None",
      approval: "Approval",
      reason: "Reason",
      past_dates: "Past dates",
      balance: "Balance",
      balance_yes: "Deducts",
      balance_no: "No deduction",
      locked: "System types can't be edited or deleted"
    },
    form: {
      add_title: "Add absence type",
      edit_title: "Edit absence type",
      details_title: "Absence type details",
      name: "Name",
      name_placeholder: "Enter the absence type name",
      balance: "Balance impact",
      balance_placeholder: "Choose whether approved requests deduct from the balance",
      approval: "Approval",
      approval_placeholder: "Manager approval required",
      reason: "Reason for the request",
      reason_placeholder: "Choose whether a reason is required",
      notice: "Advance notice (days)",
      notice_placeholder: "How many days in advance a request must be submitted",
      past_dates: "Allow past dates",
      past_dates_placeholder: "Select an option",
      submit: "Add type"
    },
    delete_dialog: {
      title: "Delete absence type",
      text: "Are you sure you want to delete the absence type “{name}”?",
      notice:
        "Employees will no longer be able to request this absence type. Existing requests stay in the history.",
      confirm: "Delete type"
    }
  }
};
