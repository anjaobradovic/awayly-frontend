// stranica Zahtevi, forma za podnošenje i detalji zahteva
export default {
  sr: {
    title: "Zahtevi",
    description: "Upravljanje podnetim i odobrenim zahtevima.",
    delegations: "Moje delegacije",
    mine: "Moji zahtevi",
    search_placeholder: "Pretraži zahteve zaposlenih",
    filter_title: "Filter zahteva",
    clear_filters: "Ukloni filtere",
    apply_filters: "Primeni filtere",
    leave_type: "Tip odsustva",
    leave_type_placeholder: "Odaberite tip odsustva",
    date_from: "Datum od",
    date_to: "Datum do",

    // "zahtev" bez broja, za "3 zahteva na čekanju"
    requests_word: "zahtev | zahteva | zahteva",
    count: "{count} zahtev | {count} zahteva | {count} zahteva",

    groups: {
      vacation: "Godišnji i rad od kuće",
      family: "Porodica i zdravlje",
      paid: "Plaćeno odsustvo",
      other: "Ostalo"
    },

    status: {
      approved: "Zahtev odobren",
      rejected: "Zahtev odbijen",
      pending_cancellation: "Zahtev za otkazivanje"
    },
    changes: {
      modification: "Izmena zahteva",
      cancellation: "Otkazivanje"
    },

    group: {
      actions_for: "Akcije za {title}",
      approve_all: "Odobri sve",
      empty: "Nema zahteva"
    },

    card: {
      details_for: "Detalji zahteva: {name}",
      not_assigned: "Niste dodeljeni odobravalac — zahtev vidite jer odobravate sve zahteve",
      submitted_on: "podneto {date}",
      reject: "Odbij",
      approve: "Odobri",
      cancel: "Otkaži"
    },

    submit_button: {
      label: "Podnesi zahtev",
      quick: "Brzo podnošenje zahteva"
    },

    cancel_dialog: {
      title: "Otkaži zahtev za odsustvo",
      approved_text:
        "Da li ste sigurni da želite da otkažete ovaj odobren zahtev? Otkazivanje mora da odobri vaš odobravalac, a dani će biti vraćeni na vaš raspoloživi saldo kada ga odobri.",
      pending_text:
        "Da li ste sigurni da želite da povučete ovaj zahtev? Zahtev će biti trajno uklonjen iz procesa odobravanja, a dani će odmah biti vraćeni na vaš raspoloživi saldo.",
      cancelling: "Otkazivanje...",
      confirm: "Otkaži zahtev"
    },

    details: {
      title: "Zahtev za {type_lower}",
      title_default: "Zahtev za odsustvo",
      employee: "Zaposleni",
      team: "Tim",
      submitted_at: "Datum podnošenja",
      type: "Tip",
      period: "Datum zahteva",
      status: "Status",
      reason: "Razlog",
      rejection_reason: "Razlog odbijanja",
      reject_reason_label: "Razlog odbijanja zahteva",
      balance_title_annual: "Bilans godišnjeg odmora",
      balance_title: "Bilans — {type}",
      negative_annual: "Saldo godišnjeg odmora zaposlenog će biti u minusu.",
      negative: "Saldo ({type}) zaposlenog će biti u minusu.",
      left_annual:
        "Nakon odobrenja zahteva zaposlenom preostaje {days} godišnjeg odmora za {year}. godinu.",
      left: "Nakon odobrenja zahteva zaposlenom preostaje {days} ({type}) za {year}. godinu.",
      rejecting: "Odbijanje...",
      reject: "Odbij zahtev",
      approving: "Odobravanje...",
      approve: "Odobri zahtev",
      cancel: "Otkaži zahtev"
    },

    // pločice sa saldom, u detaljima i u formi
    balance: {
      available: "Raspoloživo",
      requested: "Zahtevan broj",
      remaining: "Preostaje"
    },

    submit: {
      title: "Podnošenje novog zahteva",
      steps: {
        type_title: "Vrsta odsustva",
        type_text: "Odaberite kategoriju i vrstu odsustva",
        period_title: "Period i detalji",
        period_text: "Izaberite datume i razlog odsustva"
      },
      wfh_blocked: "Polisa kompanije ne dozvoljava rad od kuće",
      unlimited: "neograničeno",
      period_card: "Period i razlog odsustva",
      start_date: "Datum početka",
      due_date: "Očekivani datum porođaja",
      child_order: "Redni broj deteta",
      period: "Period zahteva",
      period_picker: "Odabir perioda zahteva",
      reason: "Razlog zahteva",
      reason_placeholder: "Unesite razlog podnošenja zahteva...",
      balance_title: "Bilans: {type}",
      sending: "Slanje...",
      submit: "Podnesi",
      notice_hint:
        "Ova vrsta odsustva se najavljuje {days} unapred — najraniji početak je {date}",
      no_past: "Za ovu vrstu odsustva nije moguće izabrati datume u prošlosti.",
      child_order_error: "Unesite pozitivan ceo broj.",
      duration_policy: "Trajanje po polisi: {days}. Datum završetka se računa automatski.",
      duration_auto: "Datum završetka se računa automatski, prema polisi odsustva kompanije.",
      due_date_error:
        "Očekivani datum porođaja mora biti posle datuma početka porodiljskog odsustva.",
      overlap: "Već imate zahtev ({type}, {period}) koji se preklapa sa izabranim periodom.",
      wfh_limit:
        "Mesečni limit rada od kuće je {limit}. Za {month} već imate {used}, a ovaj zahtev dodaje {requested}.",
      eligibility:
        "Pravo na godišnji odmor stičete {days} od zaposlenja — najraniji početak je {date}",
      first_part:
        "Prvi godišnji odmor u {year}. godini mora trajati najmanje {days} (izabrano: {selected}).",
      general_limit:
        "Po polisi imate {days} za privatne poslove godišnje. U {year}. već imate {used}, a ovaj zahtev dodaje {requested}.",
      per_request:
        "Po polisi kompanije „{type}“ traje najviše {days} po zahtevu (izabrano: {selected}).",
      negative_allowed: "Saldo će biti u minusu {days} — polisa dozvoljava minus do {max}.",
      not_enough:
        "Nemate dovoljno raspoloživih dana — zahtev premašuje saldo za {days} ({year}. godina).",
      left: "Nakon odobrenja zahteva preostaće vam {days} ({type}) za {year}. godinu."
    }
  },
  en: {
    title: "Requests",
    description: "Manage submitted and approved requests.",
    delegations: "My delegations",
    mine: "My requests",
    search_placeholder: "Search employee requests",
    filter_title: "Request filters",
    clear_filters: "Clear filters",
    apply_filters: "Apply filters",
    leave_type: "Leave type",
    leave_type_placeholder: "Select a leave type",
    date_from: "Date from",
    date_to: "Date to",

    requests_word: "request | requests",
    count: "{count} request | {count} requests",

    groups: {
      vacation: "Vacation & remote work",
      family: "Family & health",
      paid: "Paid leave",
      other: "Other"
    },

    status: {
      approved: "Approved",
      rejected: "Rejected",
      pending_cancellation: "Cancellation requested"
    },
    changes: {
      modification: "Change request",
      cancellation: "Cancellation"
    },

    group: {
      actions_for: "Actions for {title}",
      approve_all: "Approve all",
      empty: "No requests"
    },

    card: {
      details_for: "Request details: {name}",
      not_assigned:
        "You're not the assigned approver — you see this request because you approve all requests",
      submitted_on: "submitted {date}",
      reject: "Reject",
      approve: "Approve",
      cancel: "Cancel"
    },

    submit_button: {
      label: "New request",
      quick: "Quick request"
    },

    cancel_dialog: {
      title: "Cancel leave request",
      approved_text:
        "Are you sure you want to cancel this approved request? Your approver needs to confirm the cancellation, and the days will return to your balance once they do.",
      pending_text:
        "Are you sure you want to withdraw this request? It will be removed from the approval process and the days will return to your balance right away.",
      cancelling: "Cancelling...",
      confirm: "Cancel request"
    },

    details: {
      title: "Leave request: {type}",
      title_default: "Leave request",
      employee: "Employee",
      team: "Team",
      submitted_at: "Submitted on",
      type: "Type",
      period: "Dates",
      status: "Status",
      reason: "Reason",
      rejection_reason: "Rejection reason",
      reject_reason_label: "Reason for rejection",
      balance_title_annual: "Annual leave balance",
      balance_title: "Balance — {type}",
      negative_annual: "The employee's annual leave balance will go negative.",
      negative: "The employee's balance ({type}) will go negative.",
      left_annual: "Once approved, the employee will have {days} of annual leave left for {year}.",
      left: "Once approved, the employee will have {days} ({type}) left for {year}.",
      rejecting: "Rejecting...",
      reject: "Reject request",
      approving: "Approving...",
      approve: "Approve request",
      cancel: "Cancel request"
    },

    balance: {
      available: "Available",
      requested: "Requested",
      remaining: "Remaining"
    },

    submit: {
      title: "New leave request",
      steps: {
        type_title: "Leave type",
        type_text: "Choose a category and type of leave",
        period_title: "Dates & details",
        period_text: "Pick the dates and reason for your leave"
      },
      wfh_blocked: "Company policy doesn't allow remote work",
      unlimited: "unlimited",
      period_card: "Dates & reason",
      start_date: "Start date",
      due_date: "Expected due date",
      child_order: "Child number",
      period: "Request period",
      period_picker: "Select request period",
      reason: "Reason",
      reason_placeholder: "Enter the reason for your request...",
      balance_title: "Balance: {type}",
      sending: "Submitting...",
      submit: "Submit",
      notice_hint: "This leave type requires {days} notice — the earliest start is {date}",
      no_past: "Past dates can't be selected for this leave type.",
      child_order_error: "Enter a positive whole number.",
      duration_policy: "Policy duration: {days}. The end date is calculated automatically.",
      duration_auto: "The end date is calculated automatically based on company leave policy.",
      due_date_error: "The expected due date must be after the start of maternity leave.",
      overlap: "You already have a request ({type}, {period}) that overlaps the selected dates.",
      wfh_limit:
        "The monthly remote work limit is {limit}. You already have {used} in {month}, and this request adds {requested}.",
      eligibility: "You become eligible for annual leave {days} after hiring — the earliest start is {date}",
      first_part:
        "Your first annual leave in {year} must be at least {days} (selected: {selected}).",
      general_limit:
        "Policy allows {days} of personal leave per year. You already have {used} in {year}, and this request adds {requested}.",
      per_request:
        "Company policy limits “{type}” to {days} per request (selected: {selected}).",
      negative_allowed: "Your balance will go {days} negative — policy allows up to {max}.",
      not_enough:
        "Not enough days available — this request exceeds your balance by {days} ({year}).",
      left: "Once approved, you'll have {days} ({type}) left for {year}."
    }
  }
};
