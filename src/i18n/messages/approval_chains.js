// lanci odobravanja (Podešavanja -> Lanci odobravanja)
export default {
  sr: {
    title: "Lanci odobravanja",
    description: "Ko i kojim redom odobrava zahteve za odsustvo.",
    add: "Dodaj lanac",
    custom_switch: "Prilagođeni lanci",
    disabled: {
      text: "Prilagođeni lanci su isključeni. Svaki zahtev za odsustvo odobrava vođa tima podnosioca — to je podrazumevani lanac.",
      enable: "Uključi prilagođene lance",
      default_title: "Podrazumevani lanac",
      default_scope: "Važi za sve zaposlene",
      saved: "Sačuvani lanci se ne primenjuju dok su prilagođeni lanci isključeni."
    },
    list: {
      empty: "Još nema lanaca odobravanja. Dodajte prvi lanac.",
      count: "{count} lanac | {count} lanca | {count} lanaca",
      active_count: "{count} aktivan | {count} aktivna | {count} aktivnih"
    },
    card: {
      active: "Aktivan",
      applies_to: "Važi za",
      all_employees: "Sve zaposlene",
      team_lead_short: "Podnosioca zahteva",
      steps: "Koraci odobravanja",
      updated: "Izmenjeno {date}",
      actions: "Akcije za {name}"
    },
    approver: {
      TEAM_LEAD: "Vođa tima",
      ROLE: "Uloga",
      USER: "Osoba",
      team_lead_hint: "Vođa tima podnosioca zahteva",
      unknown: "Nepoznat odobravalac"
    },
    drawer: {
      add_title: "Novi lanac odobravanja",
      edit_title: "Izmena lanca odobravanja",
      basics: "Osnovni podaci",
      name: "Naziv lanca",
      name_placeholder: "npr. Duža odsustva — razvoj",
      active: "Lanac je aktivan",
      scope: "Na koga se primenjuje",
      scope_all: "Svi zaposleni",
      scope_teams: "Izabrani timovi",
      team_in_chain: "već u lancu „{name}“",
      steps: "Koraci odobravanja",
      steps_hint: "Zahtev ide redom kroz korake; sledeći korak počinje kad prethodni odobri.",
      step: "Korak {number}",
      approver_type: "Tip odobravaoca",
      role: "Uloga",
      role_placeholder: "Izaberite ulogu",
      person: "Osoba",
      person_placeholder: "Izaberite osobu",
      add_step: "Dodaj korak",
      max_steps: "Najviše {count} koraka.",
      move_up: "Pomeri korak {number} gore",
      move_down: "Pomeri korak {number} dole",
      remove_step: "Ukloni korak {number}",
      delete: "Obriši lanac",
      save_add: "Dodaj lanac"
    },
    errors: {
      name_required: "Unesite naziv lanca.",
      name_taken: "Lanac sa ovim nazivom već postoji.",
      teams_required: "Izaberite bar jedan tim.",
      steps_required: "Dodajte bar jedan korak.",
      approver_required: "Izaberite odobravaoca.",
      duplicate_step: "Ovaj odobravalac je već u lancu.",
      invalid_approver: "Jedan od odobravalaca više ne postoji.",
      disabled: "Prilagođeni lanci su isključeni u podešavanjima kompanije."
    },
    delete: {
      title: "Obriši lanac",
      text: "Da li želite da obrišete lanac „{name}“?",
      notice: "Zahtevi koji su već u toku završavaju se po starom lancu. Novi zahtevi idu po podrazumevanom lancu (vođa tima)."
    },
    toast: {
      toggle_failed: "Promena nije sačuvana."
    }
  },
  en: {
    title: "Approval chains",
    description: "Who approves leave requests, and in what order.",
    add: "Add chain",
    custom_switch: "Custom chains",
    disabled: {
      text: "Custom chains are turned off. Every leave request is approved by the requester's team lead — the default chain.",
      enable: "Turn on custom chains",
      default_title: "Default chain",
      default_scope: "Applies to all employees",
      saved: "Saved chains aren't used while custom chains are turned off."
    },
    list: {
      empty: "No approval chains yet. Add the first one.",
      count: "{count} chain | {count} chains",
      active_count: "{count} active | {count} active"
    },
    card: {
      active: "Active",
      applies_to: "Applies to",
      all_employees: "All employees",
      team_lead_short: "Of the requester",
      steps: "Approval steps",
      updated: "Updated {date}",
      actions: "Actions for {name}"
    },
    approver: {
      TEAM_LEAD: "Team lead",
      ROLE: "Role",
      USER: "Person",
      team_lead_hint: "The requester's team lead",
      unknown: "Unknown approver"
    },
    drawer: {
      add_title: "New approval chain",
      edit_title: "Edit approval chain",
      basics: "Basics",
      name: "Chain name",
      name_placeholder: "e.g. Long leave — engineering",
      active: "Chain is active",
      scope: "Applies to",
      scope_all: "All employees",
      scope_teams: "Selected teams",
      team_in_chain: "already in “{name}”",
      steps: "Approval steps",
      steps_hint: "Requests go through the steps in order; each step starts once the previous one approves.",
      step: "Step {number}",
      approver_type: "Approver type",
      role: "Role",
      role_placeholder: "Select a role",
      person: "Person",
      person_placeholder: "Select a person",
      add_step: "Add step",
      max_steps: "Up to {count} steps.",
      move_up: "Move step {number} up",
      move_down: "Move step {number} down",
      remove_step: "Remove step {number}",
      delete: "Delete chain",
      save_add: "Add chain"
    },
    errors: {
      name_required: "Enter a chain name.",
      name_taken: "A chain with this name already exists.",
      teams_required: "Select at least one team.",
      steps_required: "Add at least one step.",
      approver_required: "Select an approver.",
      duplicate_step: "This approver is already in the chain.",
      invalid_approver: "One of the approvers no longer exists.",
      disabled: "Custom chains are turned off in the company settings."
    },
    delete: {
      title: "Delete chain",
      text: "Delete the chain “{name}”?",
      notice: "Requests already in progress finish under the old chain. New requests use the default chain (team lead)."
    },
    toast: {
      toggle_failed: "The change wasn't saved."
    }
  }
};
