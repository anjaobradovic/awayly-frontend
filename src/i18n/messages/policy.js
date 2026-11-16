// stranica Polise odsustva (views/policy)
export default {
  sr: {
    title: "Polise odsustva",
    description: "Pravila i modeli obračuna slobodnih dana.",
    tabs: {
      current: "Kompanijska polisa",
      scheduled: "Zakazana kompanijska polisa"
    },
    no_scheduled:
      "Nema zakazanih izmena polise. Izmenite pravila na kartici „Kompanijska polisa“ i sačuvajte ih — biće zakazane ovde.",
    effective_from: "Stupa na snagu od",
    status: {
      active: "Aktivna polisa",
      pending: "Na čekanju",
      active_text: "Ova pravila su trenutno primenjena na sve zaposlene (od {date})",
      pending_text: "Ova pravila će automatski zameniti trenutnu polisu dana {date}"
    },
    settings_title: "Dodatna podešavanja polise",
    actions: {
      reset_defaults: "Vrati na podrazumevana podešavanja",
      cancel_scheduled: "Otkaži zakazanu polisu",
      schedule: "Zakaži izmene"
    },
    notices: {
      scheduled_change:
        "Zakazane izmene će postati aktivne {date} u 00:00. Do tada važe trenutna pravila.",
      date_required: "Izmene možete sačuvati tek nakon što unesete datum stupanja polise na snagu.",
      defaults_replace:
        "Polisa sa podrazumevanim podešavanjima će zameniti trenutnu zakazanu kompanijsku polisu i stupiće na snagu {date}",
      replace_scheduled:
        "Čuvanjem ovih izmena, postojeća zakazana polisa biće zamenjena novim parametrima."
    },
    cancel_dialog: {
      title: "Otkazivanje zakazane polise",
      question: "Da li ste sigurni da želite da otkažete zakazanu polisu?",
      notice:
        "Zakazane izmene neće stupiti na snagu {date} i biće trajno uklonjene. Trenutna kompanijska polisa ostaje nepromenjena.",
      confirm: "Otkaži polisu"
    },
    field: {
      not_supported: "Nije podržano",
      invalid_number: "Unesite broj veći ili jednak 0"
    },
    suffix: {
      work_days: "radnih dana",
      days_monthly: "dana mesečno",
      years: "godina"
    },
    models: {
      MODEL_A: "Model A",
      MODEL_B: "Model B",
      hint_MODEL_A: "Kompletan saldo se dodeljuje 1. januara",
      hint_MODEL_B: "Saldo se dodeljuje postepeno, svakog meseca"
    },
    groups: {
      vacation: "Godišnji i rad od kuće",
      family: "Porodica i zdravlje",
      paid: "Plaćeno odsustvo"
    },
    cards: {
      work_from_home: "Rad od kuće",
      annual_leave: "Godišnji odmor",
      maternity: "Porodiljsko",
      private: "Privatni poslovi",
      blood_donation: "Davanje krvi",
      family_death: "Smrtni slučaj"
    },
    fields: {
      work_from_home_monthly_limit: "Maksimalni broj dana rada od kuće",
      balance_model: "Model godišnjeg",
      annual_leave_days: "Balans godišnjeg",
      negative_balance_allowed: "Dozvoljeni minus",
      max_negative_balance: "Maksimalni dozvoljeni minus",
      eligibility_period_days: "Sticanje prava na godišnji odmor",
      first_part_min_days: "Minimalni broj dana za prvi deo godišnjeg",
      max_carryover_days: "Maksimalni broj prenosivih dana",
      no_limit: "Bez ograničenja",
      maternity_leave_days_first_second: "Broj dana za prvo i drugo dete",
      maternity_leave_days_third_plus: "Broj dana za treće i svako naredno dete",
      paid_leave_general_days: "Maksimalan broj dana",
      paid_leave_blood_donation_days: "Broj dana za davanje krvi",
      paid_leave_family_death_days: "Broj dana za smrtni slučaj",
      birthday_bonus_days: "Broj dana za rođendan",
      seniority_bonus_days_per_interval: "Broj dana",
      seniority_bonus_interval_years: "Interval",
      escalation_period_days: "Broj dana",
      modification_cutoff_days: "Maksimalan broj dana za izmenu pre početka",
      carryover_date: "Datum važenja prošlogodišnjeg odmora",
      include_weekends_in_calendar: "Prikaži vikende na kalendaru"
    },
    sections: {
      birthday_bonus_enabled: "Slobodan dan za rođendan",
      seniority_bonus_enabled: "Dodatni dani na osnovu staža",
      auto_escalation_enabled: "Eskalacija odobravanja",
      fallback_routing_enabled: "Alternativa odobravanja"
    }
  },
  en: {
    title: "Leave policies",
    description: "Rules and accrual models for time off.",
    tabs: {
      current: "Company policy",
      scheduled: "Scheduled company policy"
    },
    no_scheduled:
      "No policy changes are scheduled. Edit the rules on the “Company policy” tab and save them — they'll be scheduled here.",
    effective_from: "Effective from",
    status: {
      active: "Active policy",
      pending: "Pending",
      active_text: "These rules currently apply to all employees (since {date})",
      pending_text: "These rules will automatically replace the current policy on {date}"
    },
    settings_title: "Additional policy settings",
    actions: {
      reset_defaults: "Restore default settings",
      cancel_scheduled: "Cancel scheduled policy",
      schedule: "Schedule changes"
    },
    notices: {
      scheduled_change:
        "Scheduled changes take effect on {date} at 00:00. The current rules apply until then.",
      date_required: "Enter the policy's effective date before saving your changes.",
      defaults_replace:
        "A policy with the default settings will replace the current scheduled company policy and take effect on {date}",
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
      not_supported: "Not supported",
      invalid_number: "Enter a number greater than or equal to 0"
    },
    suffix: {
      work_days: "working days",
      days_monthly: "days per month",
      years: "years"
    },
    models: {
      MODEL_A: "Model A",
      MODEL_B: "Model B",
      hint_MODEL_A: "The full balance is granted on January 1",
      hint_MODEL_B: "The balance accrues gradually, every month"
    },
    groups: {
      vacation: "Vacation & remote work",
      family: "Family & health",
      paid: "Paid leave"
    },
    cards: {
      work_from_home: "Work from home",
      annual_leave: "Annual leave",
      maternity: "Maternity leave",
      private: "Personal matters",
      blood_donation: "Blood donation",
      family_death: "Bereavement"
    },
    fields: {
      work_from_home_monthly_limit: "Maximum work-from-home days",
      balance_model: "Annual leave model",
      annual_leave_days: "Annual leave balance",
      negative_balance_allowed: "Allow negative balance",
      max_negative_balance: "Maximum negative balance",
      eligibility_period_days: "Annual leave eligibility",
      first_part_min_days: "Minimum days for the first part of annual leave",
      max_carryover_days: "Maximum carryover days",
      no_limit: "No limit",
      maternity_leave_days_first_second: "Days for the first and second child",
      maternity_leave_days_third_plus: "Days for the third and each subsequent child",
      paid_leave_general_days: "Maximum number of days",
      paid_leave_blood_donation_days: "Days for blood donation",
      paid_leave_family_death_days: "Days for bereavement",
      birthday_bonus_days: "Birthday days off",
      seniority_bonus_days_per_interval: "Number of days",
      seniority_bonus_interval_years: "Interval",
      escalation_period_days: "Number of days",
      modification_cutoff_days: "Maximum days before start to make changes",
      carryover_date: "Carried-over leave valid until",
      include_weekends_in_calendar: "Show weekends on the calendar"
    },
    sections: {
      birthday_bonus_enabled: "Day off on your birthday",
      seniority_bonus_enabled: "Extra days based on seniority",
      auto_escalation_enabled: "Approval escalation",
      fallback_routing_enabled: "Approval fallback"
    }
  }
};
