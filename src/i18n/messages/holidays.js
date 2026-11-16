// praznici: državni i kompanijski
export default {
  sr: {
    title: "Praznici",
    description: "Pregled zvaničnih državnih i kompanijskih neradnih dana",
    add: "Dodaj praznik",
    filter_title: "Filter praznika",
    tabs: {
      state: "Državni praznici",
      company: "Kompanijski praznici"
    },
    kinds: {
      NATIONAL: "Državni",
      RELIGIOUS: "Religijski",
      COMPANY: "Kompanijski"
    },
    columns: {
      name: "Naziv",
      period: "Period",
      kind: "Vrsta"
    },
    filters: {
      kind: "Vrsta praznika",
      kind_placeholder: "Odaberite vrstu praznika",
      year: "Godina",
      year_placeholder: "Odaberite godinu praznika"
    },
    actions_for: "Akcije za {name}",
    details_for: "Detalji praznika {name}",
    count: "od {total} praznika",
    empty: "Nema praznika za prikaz.",
    drawer: {
      details_title: "Detalji praznika",
      name: "Ime praznika",
      name_placeholder: "Unesite ime praznika",
      kind: "Vrsta praznika",
      date: "Datum praznika"
    },
    remove: "Ukloni praznik",
    delete_dialog: {
      title: "Ukloni praznik",
      text: "Da li ste sigurni da želite da uklonite praznik „{name}“?",
      notice: "Praznik će biti trajno uklonjen, a {date} više neće biti neradni dan za zaposlene."
    }
  },
  en: {
    title: "Holidays",
    description: "Official public holidays and company days off",
    add: "Add holiday",
    filter_title: "Filter holidays",
    tabs: {
      state: "Public holidays",
      company: "Company holidays"
    },
    kinds: {
      NATIONAL: "Public",
      RELIGIOUS: "Religious",
      COMPANY: "Company"
    },
    columns: {
      name: "Name",
      period: "Date",
      kind: "Type"
    },
    filters: {
      kind: "Holiday type",
      kind_placeholder: "Select a holiday type",
      year: "Year",
      year_placeholder: "Select a year"
    },
    actions_for: "Actions for {name}",
    details_for: "Details for {name}",
    count: "of {total} holidays",
    empty: "No holidays to show.",
    drawer: {
      details_title: "Holiday details",
      name: "Holiday name",
      name_placeholder: "Enter the holiday name",
      kind: "Holiday type",
      date: "Holiday date"
    },
    remove: "Remove holiday",
    delete_dialog: {
      title: "Remove holiday",
      text: "Are you sure you want to remove “{name}”?",
      notice: "The holiday will be permanently removed and {date} will no longer be a day off."
    }
  }
};
