// stranica Polise odsustva (views/policy)
export default {
  sr: {
    title: "Polise odsustva",
    description: "Pravila i modeli obračuna slobodnih dana.",
    views: {
      label: "Prikaz polise",
      current: "Aktivna",
      scheduled: "Zakazana"
    },
    effective_from: "Stupa na snagu od",
    status: {
      active: "Aktivna",
      pending: "Zakazana"
    },
    overview: {
      eyebrow_current: "Kompanijska polisa",
      eyebrow_scheduled: "Zakazana izmena polise",
      version: "Verzija {version}",
      active_text: "Ova pravila trenutno važe za sve zaposlene u kompaniji.",
      pending_text: "Ova pravila će automatski zameniti trenutnu polisu na dan stupanja na snagu.",
      since: "Na snazi od {date}",
      from: "Od {date}",
      stats: {
        label: "Pregled polise",
        version: "Verzija",
        effective_since: "Na snazi od",
        effective_from: "Stupa na snagu",
        next_change: "Sledeća izmena",
        none: "Nema",
        annual: "Godišnji odmor",
        wfh: "Rad od kuće"
      },
      banner: {
        title: "Zakazana je verzija {version}",
        text: "Stupa na snagu {date} ({relative}) i tada automatski menja trenutnu polisu.",
        viewing_title: "Pregledate zakazanu verziju",
        viewing_text: "Do {date} važe pravila aktivne polise.",
        view: "Pogledaj izmene",
        back: "Nazad na aktivnu"
      }
    },
    nav: {
      label: "Odeljci polise",
      changes: "Izmenjenih polja: {count}",
      errors: "Polja sa greškom: {count}"
    },
    bar: {
      label: "Izmena polise",
      changes: "{count} izmena | {count} izmene | {count} izmena",
      no_changes: "Još nema izmena",
      errors: "{count} polje sa greškom | {count} polja sa greškom | {count} polja sa greškom",
      effective_from: "Stupa na snagu"
    },
    actions: {
      edit: "Izmeni polisu",
      edit_scheduled: "Izmeni zakazanu",
      reset_defaults: "Podrazumevana podešavanja",
      cancel_scheduled: "Otkaži zakazanu",
      schedule: "Zakaži izmene"
    },
    notices: {
      scheduled_change:
        "Zakazane izmene će postati aktivne {date} u 00:00. Do tada važe trenutna pravila.",
      date_required: "Izaberite datum stupanja na snagu da biste zakazali izmene.",
      defaults_replace:
        "Polisa sa podrazumevanim podešavanjima stupiće na snagu {date} i zameniće postojeću zakazanu polisu.",
      defaults_applied: "Učitana su podrazumevana podešavanja. Stupiće na snagu {date}.",
      replace_scheduled: "Čuvanjem ovih izmena, postojeća zakazana polisa biće zamenjena novim parametrima."
    },
    cancel_dialog: {
      title: "Otkazivanje zakazane polise",
      question: "Da li ste sigurni da želite da otkažete zakazanu polisu?",
      notice:
        "Zakazane izmene neće stupiti na snagu {date} i biće trajno uklonjene. Trenutna kompanijska polisa ostaje nepromenjena.",
      confirm: "Otkaži polisu"
    },
    field: {
      invalid_number: "Unesite broj veći ili jednak 0",
      changed: "Izmenjeno",
      was: "Bilo: {value}",
      on: "Uključeno",
      off: "Isključeno"
    },
    // reč iza broja, oblik zavisi od broja
    units: {
      work_days: "radni dan | radna dana | radnih dana",
      days_monthly: "dan mesečno | dana mesečno | dana mesečno",
      years: "godina | godine | godina"
    },
    models: {
      MODEL_A: "Model A",
      MODEL_B: "Model B",
      hint_MODEL_A: "Kompletan saldo se dodeljuje 1. januara",
      hint_MODEL_B: "Saldo se dodeljuje postepeno, svakog meseca"
    },
    groups: {
      vacation: "Godišnji i rad od kuće",
      vacation_text: "Koliko dana zaposleni dobija, kako se troše i prenose.",
      family: "Porodica i zdravlje",
      family_text: "Trajanje porodiljskog odsustva.",
      paid: "Plaćeno odsustvo",
      paid_text: "Plaćeni slobodni dani za posebne prilike.",
      bonuses: "Bonus dani",
      bonuses_text: "Dodatni slobodni dani pored godišnjeg odmora.",
      requests: "Zahtevi i kalendar",
      requests_text: "Kako se zahtevi odobravaju i menjaju i šta se vidi na kalendaru."
    },
    cards: {
      annual_leave: "Godišnji odmor",
      negative_balance: "Minus na saldu",
      carryover: "Prenos u narednu godinu",
      work_from_home: "Rad od kuće",
      maternity: "Porodiljsko",
      birthday: "Rođendan",
      seniority: "Staž",
      approvals: "Odobravanje",
      changes: "Izmene zahteva",
      calendar: "Kalendar"
    },
    fields: {
      work_from_home_monthly_limit: "Rad od kuće mesečno",
      balance_model: "Model godišnjeg",
      annual_leave_days: "Broj dana godišnjeg",
      negative_balance_allowed: "Dozvoljen minus",
      max_negative_balance: "Najveći dozvoljeni minus",
      eligibility_period_days: "Sticanje prava",
      first_part_min_days: "Prvi deo godišnjeg",
      max_carryover_days: "Najviše prenosivih dana",
      no_limit: "Bez ograničenja",
      carryover_deadline: "Preneti dani važe do",
      maternity_leave_days_first_second: "Prvo i drugo dete",
      maternity_leave_days_third_plus: "Treće i svako naredno dete",
      paid_leave_general_days: "Privatni poslovi",
      paid_leave_blood_donation_days: "Davanje krvi",
      paid_leave_family_death_days: "Smrtni slučaj u porodici",
      birthday_bonus_enabled: "Slobodan dan za rođendan",
      birthday_bonus_days: "Broj dana za rođendan",
      seniority_bonus_enabled: "Dodatni dani za staž",
      seniority_bonus_days_per_interval: "Dodatni dani",
      seniority_bonus_interval_years: "Na svakih",
      auto_escalation_enabled: "Automatska eskalacija",
      escalation_period_days: "Eskalacija posle",
      fallback_routing_enabled: "Zamenski odobravalac",
      modification_cutoff_days: "Rok za izmenu",
      include_weekends_in_calendar: "Vikendi na kalendaru"
    },
    help: {
      work_from_home_monthly_limit: "Najviše dana rada od kuće u jednom mesecu.",
      balance_model: "Kako se saldo godišnjeg dodeljuje tokom godine.",
      annual_leave_days: "Osnovni broj dana godišnjeg odmora za punu godinu.",
      negative_balance_allowed: "Zaposleni može da uzme godišnji i kada nema dovoljno dana na saldu.",
      max_negative_balance: "Koliko dana saldo sme da ode u minus.",
      eligibility_period_days: "Koliko dana rada je potrebno pre prvog godišnjeg odmora.",
      first_part_min_days: "Najmanji broj dana u prvom delu godišnjeg odmora.",
      max_carryover_days: "Neiskorišćeni dani koji prelaze u narednu godinu. Prazno znači bez ograničenja.",
      carryover_deadline: "Do kog datuma se preneti dani moraju iskoristiti.",
      maternity_leave_days_first_second: "Trajanje porodiljskog za prvo i drugo dete.",
      maternity_leave_days_third_plus: "Trajanje porodiljskog za treće i svako naredno dete.",
      paid_leave_general_days: "Najviše plaćenih dana za privatne poslove godišnje.",
      paid_leave_blood_donation_days: "Plaćeni slobodni dani po davanju krvi.",
      paid_leave_family_death_days: "Plaćeni slobodni dani u slučaju smrti člana porodice.",
      birthday_bonus_enabled: "Zaposleni dobija slobodan dan za svoj rođendan.",
      birthday_bonus_days: "Koliko slobodnih dana donosi rođendan.",
      seniority_bonus_enabled: "Godišnji odmor raste sa godinama staža.",
      seniority_bonus_days_per_interval: "Koliko dana se dodaje za svaki interval staža.",
      seniority_bonus_interval_years: "Na koliko godina staža se dodaju dani.",
      auto_escalation_enabled: "Zahtev koji niko ne obradi prelazi na sledećeg odobravaoca.",
      escalation_period_days: "Koliko dana zahtev čeka pre eskalacije.",
      fallback_routing_enabled: "Kad je odobravalac odsutan, zahtev ide zameniku.",
      modification_cutoff_days: "Najkasnije koliko dana pre početka zahtev može da se izmeni.",
      include_weekends_in_calendar: "Prikazuje subotu i nedelju u prikazima kalendara."
    }
  },
  en: {
    title: "Leave policies",
    description: "Rules and accrual models for time off.",
    views: {
      label: "Policy view",
      current: "Active",
      scheduled: "Scheduled"
    },
    effective_from: "Effective from",
    status: {
      active: "Active",
      pending: "Scheduled"
    },
    overview: {
      eyebrow_current: "Company policy",
      eyebrow_scheduled: "Scheduled policy change",
      version: "Version {version}",
      active_text: "These rules currently apply to everyone in the company.",
      pending_text: "These rules will automatically replace the current policy on the effective date.",
      since: "In effect since {date}",
      from: "From {date}",
      stats: {
        label: "Policy overview",
        version: "Version",
        effective_since: "In effect since",
        effective_from: "Takes effect",
        next_change: "Next change",
        none: "None",
        annual: "Annual leave",
        wfh: "Work from home"
      },
      banner: {
        title: "Version {version} is scheduled",
        text: "It takes effect on {date} ({relative}) and will replace the current policy automatically.",
        viewing_title: "You're viewing the scheduled version",
        viewing_text: "The active policy applies until {date}.",
        view: "View changes",
        back: "Back to active"
      }
    },
    nav: {
      label: "Policy sections",
      changes: "Changed fields: {count}",
      errors: "Fields with errors: {count}"
    },
    bar: {
      label: "Editing policy",
      changes: "{count} change | {count} changes",
      no_changes: "No changes yet",
      errors: "{count} field with an error | {count} fields with errors",
      effective_from: "Takes effect"
    },
    actions: {
      edit: "Edit policy",
      edit_scheduled: "Edit scheduled",
      reset_defaults: "Default settings",
      cancel_scheduled: "Cancel scheduled",
      schedule: "Schedule changes"
    },
    notices: {
      scheduled_change:
        "Scheduled changes take effect on {date} at 00:00. The current rules apply until then.",
      date_required: "Pick an effective date to schedule your changes.",
      defaults_replace:
        "A policy with the default settings will take effect on {date} and replace the existing scheduled policy.",
      defaults_applied: "Default settings loaded. They'll take effect on {date}.",
      replace_scheduled: "Saving these changes will replace the existing scheduled policy."
    },
    cancel_dialog: {
      title: "Cancel scheduled policy",
      question: "Are you sure you want to cancel the scheduled policy?",
      notice:
        "The scheduled changes will not take effect on {date} and will be permanently removed. The current company policy stays unchanged.",
      confirm: "Cancel policy"
    },
    field: {
      invalid_number: "Enter a number greater than or equal to 0",
      changed: "Changed",
      was: "Was: {value}",
      on: "On",
      off: "Off"
    },
    units: {
      work_days: "working day | working days",
      days_monthly: "day per month | days per month",
      years: "year | years"
    },
    models: {
      MODEL_A: "Model A",
      MODEL_B: "Model B",
      hint_MODEL_A: "The full balance is granted on January 1",
      hint_MODEL_B: "The balance accrues gradually, every month"
    },
    groups: {
      vacation: "Vacation & remote work",
      vacation_text: "How many days people get, how they're used and carried over.",
      family: "Family & health",
      family_text: "Length of maternity leave.",
      paid: "Paid leave",
      paid_text: "Paid days off for special occasions.",
      bonuses: "Bonus days",
      bonuses_text: "Extra days off on top of annual leave.",
      requests: "Requests & calendar",
      requests_text: "How requests are approved and changed, and what the calendar shows."
    },
    cards: {
      annual_leave: "Annual leave",
      negative_balance: "Negative balance",
      carryover: "Carryover to next year",
      work_from_home: "Work from home",
      maternity: "Maternity leave",
      birthday: "Birthday",
      seniority: "Seniority",
      approvals: "Approvals",
      changes: "Request changes",
      calendar: "Calendar"
    },
    fields: {
      work_from_home_monthly_limit: "Work from home per month",
      balance_model: "Annual leave model",
      annual_leave_days: "Annual leave days",
      negative_balance_allowed: "Allow negative balance",
      max_negative_balance: "Maximum negative balance",
      eligibility_period_days: "Eligibility period",
      first_part_min_days: "First part of annual leave",
      max_carryover_days: "Maximum carryover days",
      no_limit: "No limit",
      carryover_deadline: "Carried-over days valid until",
      maternity_leave_days_first_second: "First and second child",
      maternity_leave_days_third_plus: "Third and each subsequent child",
      paid_leave_general_days: "Personal matters",
      paid_leave_blood_donation_days: "Blood donation",
      paid_leave_family_death_days: "Bereavement",
      birthday_bonus_enabled: "Day off on birthday",
      birthday_bonus_days: "Birthday days off",
      seniority_bonus_enabled: "Extra days for seniority",
      seniority_bonus_days_per_interval: "Extra days",
      seniority_bonus_interval_years: "For every",
      auto_escalation_enabled: "Automatic escalation",
      escalation_period_days: "Escalate after",
      fallback_routing_enabled: "Fallback approver",
      modification_cutoff_days: "Change deadline",
      include_weekends_in_calendar: "Weekends on the calendar"
    },
    help: {
      work_from_home_monthly_limit: "Maximum work-from-home days in a single month.",
      balance_model: "How the annual leave balance is granted over the year.",
      annual_leave_days: "Base number of annual leave days for a full year.",
      negative_balance_allowed: "People can take annual leave even without enough days left.",
      max_negative_balance: "How far the balance can go below zero.",
      eligibility_period_days: "Days of work required before the first annual leave.",
      first_part_min_days: "Minimum length of the first part of annual leave.",
      max_carryover_days: "Unused days that move to the next year. Leave empty for no limit.",
      carryover_deadline: "Date by which carried-over days must be used.",
      maternity_leave_days_first_second: "Maternity leave length for the first and second child.",
      maternity_leave_days_third_plus: "Maternity leave length for the third and each subsequent child.",
      paid_leave_general_days: "Maximum paid days for personal matters per year.",
      paid_leave_blood_donation_days: "Paid days off per blood donation.",
      paid_leave_family_death_days: "Paid days off after a death in the family.",
      birthday_bonus_enabled: "People get a day off on their birthday.",
      birthday_bonus_days: "How many days off a birthday brings.",
      seniority_bonus_enabled: "Annual leave grows with years of service.",
      seniority_bonus_days_per_interval: "Days added for each seniority interval.",
      seniority_bonus_interval_years: "How many years of service earn extra days.",
      auto_escalation_enabled: "Requests nobody handles move on to the next approver.",
      escalation_period_days: "How long a request waits before it's escalated.",
      fallback_routing_enabled: "When the approver is away, the request goes to their stand-in.",
      modification_cutoff_days: "How many days before the start a request can still be changed.",
      include_weekends_in_calendar: "Shows Saturday and Sunday in calendar views."
    }
  }
};
