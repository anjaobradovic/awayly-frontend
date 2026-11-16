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
    search_placeholder: "Pretražite praznike",
    year_title: "Praznici u {year}.",
    list_label: "Praznici po mesecima",
    month_count: "{count} praznik | {count} praznika | {count} praznika",
    today_badge: "Danas",
    past_label: "Prošao",
    next: {
      eyebrow: "Sledeći praznik",
      eyebrow_today: "Praznik je danas",
      today: "Danas",
      tomorrow: "Sutra",
      ongoing: "U toku",
      in_days: "za {count} dan | za {count} dana | za {count} dana",
      ends_in: "još {count} dan | još {count} dana | još {count} dana",
      none_title: "Nema predstojećih praznika",
      none_text: "Svi praznici u {year}. godini su već prošli."
    },
    stats: {
      label: "Praznici u godini po vrsti",
      total: "Ukupno",
      NATIONAL: "Državni",
      RELIGIOUS: "Religijski",
      COMPANY: "Kompanijski"
    },
    empty_hint_state: "Za izabranu godinu nema zvaničnih praznika.",
    empty_hint_company: "Dodajte kompanijski neradni dan dugmetom „Dodaj praznik“.",
    empty_filtered: "Nijedan praznik ne odgovara pretrazi.",
    empty_filtered_hint: "Probajte drugi pojam ili očistite filtere.",
    clear_filters: "Očisti filtere",
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
    search_placeholder: "Search holidays",
    year_title: "Holidays in {year}",
    list_label: "Holidays by month",
    month_count: "{count} holiday | {count} holidays",
    today_badge: "Today",
    past_label: "Past",
    next: {
      eyebrow: "Next holiday",
      eyebrow_today: "Holiday today",
      today: "Today",
      tomorrow: "Tomorrow",
      ongoing: "Ongoing",
      in_days: "in {count} day | in {count} days",
      ends_in: "{count} day left | {count} days left",
      none_title: "No upcoming holidays",
      none_text: "All holidays in {year} are already behind us."
    },
    stats: {
      label: "Holidays this year by type",
      total: "Total",
      NATIONAL: "Public",
      RELIGIOUS: "Religious",
      COMPANY: "Company"
    },
    empty_hint_state: "There are no official holidays for the selected year.",
    empty_hint_company: "Add a company day off with the “Add holiday” button.",
    empty_filtered: "No holidays match your search.",
    empty_filtered_hint: "Try a different term or clear the filters.",
    clear_filters: "Clear filters",
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
