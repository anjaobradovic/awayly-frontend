// lični, timski i kompanijski panel

// sistemski tipovi odsustva (srpski naziv iz leaveTypeName -> engleski), custom tipovi ostaju kako jesu
const LEAVE_TYPES_EN = {
  "Godišnji odmor": "Annual leave",
  "Rad od kuće": "Work from home",
  Bolovanje: "Sick leave",
  "Dan bolovanja": "Sick day",
  Trudničko: "Pregnancy sick leave",
  Porodiljsko: "Maternity leave",
  Roditeljsko: "Parental leave",
  "Privatni poslovi": "Personal leave",
  "Davanje krvi": "Blood donation",
  "Smrtni slučaj": "Bereavement leave",
  "Krsna slava": "Patron saint day",
  "Neplaćeno odsustvo": "Unpaid leave"
};

export default {
  sr: {
    title: "Panel",
    description: "Centralni uvid u saldo dana i status zahteva.",
    tabs: {
      personal: "Lični panel",
      team: "Timski panel",
      company: "Kompanijski panel"
    },
    no_teams: "Nemate pristup nijednom timu.",
    select_team: "Izaberite tim",
    all_members: "Svi zaposleni",
    all_teams: "Svi timovi",
    all_leave_types: "Sve vrste odsustva",
    leave_types: Object.fromEntries(Object.keys(LEAVE_TYPES_EN).map((name) => [name, name])),
    view_details: "Vidi detalje",
    view_all: "Vidi sve",
    welcome: {
      morning: "Dobro jutro,",
      afternoon: "Dobar dan,",
      evening: "Dobro veče,",
      summary:
        "Sve je spremno za planiranje tvog vremena. Trenutno imaš {free_days} na raspolaganju i {pending} na čekanju.",
      free_days: "{count} slobodan dan | {count} slobodna dana | {count} slobodnih dana",
      requests: "{count} zahtev | {count} zahteva | {count} zahteva",
      kpi_free: "Slobodnih dana",
      kpi_pending: "Na čekanju",
      kpi_approved: "Odobreno",
      open_calendar: "Kalendar",
      open_requests: "Moji zahtevi"
    },
    carryover_notice:
      "Preneseni dani starog godišnjeg odmora ({days}) važe do {date}. Nakon toga više neće biti dostupni.",
    balance: {
      annual_title: "Preostali slobodni dani godišnjeg odmora",
      general_title: "Preostali dani opštih privatnih poslova",
      new_days: "Preostali dani novog godišnjeg",
      carryover_days: "Preneseni dani starog godišnjeg",
      remaining_days: "Preostali dani",
      used_days: "Iskorišćeni dani",
      caption: "Preostalo {remaining} od {count} dana"
    },
    stats: {
      requests_title: "Statistika zahteva",
      pending: "Zahtevi na čekanju",
      approved: "Odobreni zahtevi",
      accounts_title: "Statistika naloga zaposlenih",
      accounts_pending: "Na čekanju",
      accounts_active: "Aktivni nalozi"
    },
    chart: {
      title: "Statistika po mesecima",
      absence_title: "Statistika odsustva po mesecima",
      work_from_home: "Rad od kuće",
      annual_leave: "Godišnji odmor",
      bar: "{month}: {days}"
    },
    upcoming: {
      title: "Nadolazeća odobrena odsustva",
      request_date: "Datum zahteva",
      empty: "Nemate nadolazećih odobrenih odsustava."
    },
    absent: {
      title: "Trenutno odsutni",
      count: "{count} odsutan | {count} odsutna | {count} odsutnih",
      empty: "Danas niko nije odsutan.",
      empty_day: "Ovog dana niko nije odsutan.",
      prev_day: "Prethodni dan",
      next_day: "Sledeći dan"
    },
    heatmap: {
      title: "Pregled odsustva",
      year_view: "Godišnji prikaz",
      quarter_view: "Kvartalni prikaz",
      quarter: "{quarter} kvartal {year}",
      less: "manje",
      more: "više"
    },
    utilization: {
      title: "Iskorišćenost godišnjeg odmora",
      used: "Iskorišćeno",
      total: "Ukupno",
      empty: "Nema podataka o godišnjem odmoru.",
      aria: "{name}: iskorišćeno {value}",
      of_days: "{used} od {count} dana",
      percent_used: "{percent}% iskorišćeno",
      used_remaining: "{used} iskorišćeno · {remaining} preostalo"
    }
  },
  en: {
    title: "Dashboard",
    description: "Your leave balance and request status at a glance.",
    tabs: {
      personal: "Personal",
      team: "Team",
      company: "Company"
    },
    no_teams: "You don't have access to any team.",
    select_team: "Select a team",
    all_members: "All employees",
    all_teams: "All teams",
    all_leave_types: "All leave types",
    leave_types: LEAVE_TYPES_EN,
    view_details: "View details",
    view_all: "View all",
    welcome: {
      morning: "Good morning,",
      afternoon: "Good afternoon,",
      evening: "Good evening,",
      summary:
        "Everything's ready for planning your time. You have {free_days} available and {pending} pending.",
      free_days: "{count} day off | {count} days off",
      requests: "{count} request | {count} requests",
      kpi_free: "Days off left",
      kpi_pending: "Pending",
      kpi_approved: "Approved",
      open_calendar: "Calendar",
      open_requests: "My requests"
    },
    carryover_notice:
      "Carried-over days from last year's leave ({days}) are valid until {date}. After that they will no longer be available.",
    balance: {
      annual_title: "Remaining annual leave days",
      general_title: "Remaining personal leave days",
      new_days: "Remaining days this year",
      carryover_days: "Carried over from last year",
      remaining_days: "Remaining days",
      used_days: "Used days",
      caption: "{remaining} of {count} day left | {remaining} of {count} days left"
    },
    stats: {
      requests_title: "Request statistics",
      pending: "Pending requests",
      approved: "Approved requests",
      accounts_title: "Employee accounts",
      accounts_pending: "Pending invites",
      accounts_active: "Active accounts"
    },
    chart: {
      title: "Monthly statistics",
      absence_title: "Monthly absence statistics",
      work_from_home: "Work from home",
      annual_leave: "Annual leave",
      bar: "{month}: {days}"
    },
    upcoming: {
      title: "Upcoming approved leave",
      request_date: "Request dates",
      empty: "You have no upcoming approved leave."
    },
    absent: {
      title: "Currently absent",
      count: "{count} absent | {count} absent",
      empty: "Nobody is absent today.",
      empty_day: "Nobody is absent on this day.",
      prev_day: "Previous day",
      next_day: "Next day"
    },
    heatmap: {
      title: "Absence overview",
      year_view: "Year view",
      quarter_view: "Quarter view",
      quarter: "Q{number} {year}",
      less: "less",
      more: "more"
    },
    utilization: {
      title: "Annual leave usage",
      used: "Used",
      total: "Total",
      empty: "No annual leave data.",
      aria: "{name}: {value} used",
      of_days: "{used} of {count} days",
      percent_used: "{percent}% used",
      used_remaining: "{used} used · {remaining} left"
    }
  }
};
