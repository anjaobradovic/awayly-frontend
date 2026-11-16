// zaposleni: stranica, paneli i uvoz
export default {
  sr: {
    title: "Zaposleni",
    description: "Profil svih zaposlenih",
    search_placeholder: "Pretraži zaposlene...",
    empty: "Nema zaposlenih za prikaz.",
    count_of: "od {count} zaposlenog | od {count} zaposlenih | od {count} zaposlenih",
    row_actions: "Akcije za {name}",
    balance_label: "Preostali slobodni dani",
    actions: {
      download_template: "Preuzmi šablon",
      add: "Dodaj zaposlenog",
      more: "Ostali načini dodavanja",
      import: "Uvezi zaposlene",
      import_template: "Uvezi putem šablona",
      edit: "Izmeni zaposlenog"
    },
    filter: {
      title: "Filter zaposlenih"
    },
    columns: {
      name: "Zaposleni",
      role: "Uloga",
      status: "Status",
      email: "Email",
      date_of_birth: "Datum rođenja",
      hire_date: "Datum zaposlenja",
      balance: "Preostali slobodni dani"
    },
    status: {
      pending_invite_title: "Nalog zaposlenog nije aktivan",
      pending_invite_text: "Zaposleni još uvek nije uspešno aktivirao nalog.",
      pending_data_title: "Podaci zaposlenog nisu potpuni",
      pending_data_text: "Zaposleni još uvek nije uneo sve svoje podatke."
    },
    onboarding: {
      new: "Novi zaposleni",
      existing: "Postojeći zaposleni"
    },
    religion: {
      orthodox: "Pravoslavna",
      catholic: "Katolička",
      muslim: "Islamska",
      jewish: "Jevrejska",
      none: "Bez religije"
    },
    fields: {
      first_name: "Ime",
      first_name_placeholder: "Unesite ime zaposlenog",
      last_name: "Prezime",
      last_name_placeholder: "Unesite prezime zaposlenog",
      email: "Email",
      email_address: "Email adresa",
      email_placeholder: "Unesite email adresu zaposlenog",
      email_invalid: "Unesite ispravnu email adresu.",
      phone: "Broj telefona",
      phone_placeholder: "Unesite broj telefona zaposlenog",
      hire_date: "Datum zaposlenja",
      date_of_birth: "Datum rođenja",
      onboarding_type: "Tip uvođenja",
      onboarding_placeholder: "Odaberite tip zaposlenja",
      manager: "Nadređeni",
      manager_placeholder: "Odaberite nadređenog",
      team: "Tim",
      team_placeholder: "Odaberite tim kojem zaposleni pripada",
      team_placeholder_short: "Odaberite tim",
      role: "Uloga",
      role_placeholder: "Odaberite ulogu",
      religion: "Religija",
      religion_placeholder: "Odaberite religiju zaposlenog",
      confession: "Veroispovest",
      used_days: "Iskorišćeni dani",
      used_days_placeholder: "Unesite broj iskorišćenih dana",
      remaining_days: "Preostali dani",
      remaining_days_placeholder: "Unesite broj preostalih dana",
      general_remaining: "Preostali dani opštih privatnih poslova",
      general_used: "Iskorišćeni dani opštih privatnih poslova"
    },
    add: {
      title: "Dodaj novog zaposlenog",
      submit: "Dodaj zaposlenog"
    },
    details: {
      title: "Detalji o zaposlenom",
      stats: "Statistika",
      no_stats: "Nema podataka o odsustvima za tekuću godinu.",
      unlimited: "neograničeno"
    },
    edit: {
      totp_notice:
        "Resetovanjem TOTP-a korisnik će biti automatski odjavljen sa sistema i moraće ponovo da podesi aplikaciju za autentifikaciju prilikom sledeće prijave.",
      totp_reset: "Resetuj TOTP korisnika",
      totp_confirm: "Resetovati TOTP za „{name}“? Biće odjavljen sa svih uređaja.",
      totp_done: "TOTP je resetovan. Zaposleni će ga ponovo podesiti pri sledećoj prijavi.",
      delete: "Obriši korisnika"
    },
    delete: {
      title: "Obriši nalog zaposlenog",
      notice:
        "Nalog će biti uklonjen i postati neaktivan. Ne postoji mogućnost ponovne aktivacije naloga.",
      confirm: "Da, obriši"
    },
    import: {
      title: "Uvezi zaposlene",
      intro:
        "Nalepite redove u CSV formatu ili izaberite CSV fajl. Kolone: ime, prezime, email, datum zaposlenja i tim (opciono). Vrednosti mogu biti odvojene zarezom ili tačkom-zarezom.",
      paste_label: "Podaci o zaposlenima",
      paste_placeholder:
        "ime,prezime,email,datum_zaposlenja,tim\nMarko,Marković,marko@firma.rs,2024-03-01,Product Design",
      choose_csv: "Izaberi CSV fajl",
      preview: "Pregled",
      preview_empty: "Nalepite podatke ili izaberite fajl da biste videli pregled.",
      ready: "{count} red spreman za uvoz | {count} reda spremna za uvoz | {count} redova spremno za uvoz",
      invalid: "{count} red sa greškom | {count} reda sa greškom | {count} redova sa greškom",
      row: "Red",
      submit: "Uvezi",
      submit_count: "Uvezi ({count})",
      header_detected: "Prvi red je prepoznat kao zaglavlje.",
      columns: {
        first_name: "Ime",
        last_name: "Prezime",
        email: "Email",
        hire_date: "Datum zaposlenja",
        team: "Tim",
        status: "Status"
      },
      errors: {
        missing_name: "Nedostaje ime ili prezime",
        invalid_email: "Neispravan email",
        duplicate_email: "Email se ponavlja",
        email_exists: "Email već postoji",
        invalid_date: "Neispravan datum zaposlenja",
        future_date: "Datum zaposlenja je u budućnosti",
        unknown_team: "Nepoznat tim",
        file_read: "Fajl nije moguće pročitati.",
        file_type: "Izaberite CSV ili XLSX fajl.",
        xlsx_demo: "Demo verzija ne čita XLSX fajlove. Sačuvajte šablon kao CSV i pokušajte ponovo."
      },
      ok: "U redu",
      result_imported:
        "Uvezen je {count} zaposleni. | Uvezena su {count} zaposlena. | Uvezeno je {count} zaposlenih.",
      result_skipped: "Preskočeno: {count}",
      result_hint: "Uvezeni zaposleni su dobili pozivnicu na email i vide se u listi.",
      template: {
        title: "Uvezi putem šablona",
        step_download: "Preuzmite šablon",
        step_download_text:
          "Šablon sadrži kolone koje sistem očekuje. Popunite po jedan red za svakog zaposlenog.",
        step_upload: "Otpremite popunjen šablon",
        step_upload_text: "Podržani formati su CSV i XLSX.",
        download_csv: "Preuzmi CSV šablon",
        choose_file: "Izaberite fajl",
        drop_hint: "ili ga prevucite ovde",
        selected_file: "Izabrani fajl",
        remove_file: "Ukloni fajl",
        upload: "Otpremi"
      }
    },
    template_file: "awayly-sablon-zaposleni"
  },
  en: {
    title: "Employees",
    description: "Profiles of all employees",
    search_placeholder: "Search employees...",
    empty: "No employees to show.",
    count_of: "of {count} employee | of {count} employees",
    row_actions: "Actions for {name}",
    balance_label: "Days off remaining",
    actions: {
      download_template: "Download template",
      add: "Add employee",
      more: "More ways to add",
      import: "Import employees",
      import_template: "Import from template",
      edit: "Edit employee"
    },
    filter: {
      title: "Filter employees"
    },
    columns: {
      name: "Employee",
      role: "Role",
      status: "Status",
      email: "Email",
      date_of_birth: "Date of birth",
      hire_date: "Hire date",
      balance: "Days off remaining"
    },
    status: {
      pending_invite_title: "Account not active",
      pending_invite_text: "The employee hasn't activated their account yet.",
      pending_data_title: "Profile incomplete",
      pending_data_text: "The employee hasn't filled in all of their details yet."
    },
    onboarding: {
      new: "New employee",
      existing: "Existing employee"
    },
    religion: {
      orthodox: "Orthodox",
      catholic: "Catholic",
      muslim: "Muslim",
      jewish: "Jewish",
      none: "None"
    },
    fields: {
      first_name: "First name",
      first_name_placeholder: "Enter first name",
      last_name: "Last name",
      last_name_placeholder: "Enter last name",
      email: "Email",
      email_address: "Email address",
      email_placeholder: "Enter email address",
      email_invalid: "Enter a valid email address.",
      phone: "Phone number",
      phone_placeholder: "Enter phone number",
      hire_date: "Hire date",
      date_of_birth: "Date of birth",
      onboarding_type: "Onboarding type",
      onboarding_placeholder: "Select onboarding type",
      manager: "Manager",
      manager_placeholder: "Select a manager",
      team: "Team",
      team_placeholder: "Select the employee's team",
      team_placeholder_short: "Select a team",
      role: "Role",
      role_placeholder: "Select a role",
      religion: "Religion",
      religion_placeholder: "Select religion",
      confession: "Religion",
      used_days: "Days used",
      used_days_placeholder: "Enter days used",
      remaining_days: "Days remaining",
      remaining_days_placeholder: "Enter days remaining",
      general_remaining: "Personal leave days remaining",
      general_used: "Personal leave days used"
    },
    add: {
      title: "Add new employee",
      submit: "Add employee"
    },
    details: {
      title: "Employee details",
      stats: "Statistics",
      no_stats: "No leave data for the current year.",
      unlimited: "unlimited"
    },
    edit: {
      totp_notice:
        "Resetting TOTP signs the user out and they'll need to set up their authenticator app again on next sign-in.",
      totp_reset: "Reset user's TOTP",
      totp_confirm: "Reset TOTP for “{name}”? They'll be signed out on all devices.",
      totp_done: "TOTP reset. The employee will set it up again on next sign-in.",
      delete: "Delete user"
    },
    delete: {
      title: "Delete employee account",
      notice: "The account will be removed and deactivated. It can't be reactivated later.",
      confirm: "Yes, delete"
    },
    import: {
      title: "Import employees",
      intro:
        "Paste rows in CSV format or choose a CSV file. Columns: first name, last name, email, hire date and team (optional). Values can be separated by commas or semicolons.",
      paste_label: "Employee data",
      paste_placeholder:
        "first_name,last_name,email,hire_date,team\nJane,Doe,jane@company.com,2024-03-01,Product Design",
      choose_csv: "Choose CSV file",
      preview: "Preview",
      preview_empty: "Paste data or choose a file to see a preview.",
      ready: "{count} row ready to import | {count} rows ready to import",
      invalid: "{count} row with errors | {count} rows with errors",
      row: "Row",
      submit: "Import",
      submit_count: "Import ({count})",
      header_detected: "The first row was detected as a header.",
      columns: {
        first_name: "First name",
        last_name: "Last name",
        email: "Email",
        hire_date: "Hire date",
        team: "Team",
        status: "Status"
      },
      errors: {
        missing_name: "Missing first or last name",
        invalid_email: "Invalid email",
        duplicate_email: "Duplicate email",
        email_exists: "Email already exists",
        invalid_date: "Invalid hire date",
        future_date: "Hire date is in the future",
        unknown_team: "Unknown team",
        file_read: "The file couldn't be read.",
        file_type: "Choose a CSV or XLSX file.",
        xlsx_demo: "The demo can't read XLSX files. Save the template as CSV and try again."
      },
      ok: "OK",
      result_imported: "Imported {count} employee. | Imported {count} employees.",
      result_skipped: "Skipped: {count}",
      result_hint: "Imported employees received an email invite and now appear in the list.",
      template: {
        title: "Import from template",
        step_download: "Download the template",
        step_download_text:
          "The template has the columns the system expects. Fill in one row per employee.",
        step_upload: "Upload the completed template",
        step_upload_text: "Supported formats are CSV and XLSX.",
        download_csv: "Download CSV template",
        choose_file: "Choose a file",
        drop_hint: "or drag it here",
        selected_file: "Selected file",
        remove_file: "Remove file",
        upload: "Upload"
      }
    },
    template_file: "awayly-employees-template"
  }
};
