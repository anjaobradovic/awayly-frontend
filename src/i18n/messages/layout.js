// glavni layout: obaveštenja, profil, kompanija, AD integracija
export default {
  sr: {
    validation: {
      email: "Unesite ispravan email."
    },
    notifications: {
      title: "Obaveštenja",
      unread_label:
        "Obaveštenja ({count} nepročitano) | Obaveštenja ({count} nepročitana) | Obaveštenja ({count} nepročitanih)",
      mark_all_read: "Označi sve kao pročitano",
      empty: "Nemate obaveštenja.",
      reason: "Razlog: {reason}",
      types: {
        approved: { title: "Zahtev odobren", text: "Odobren je vaš zahtev za" },
        rejected: { title: "Zahtev odbijen", text: "Odbijen je vaš zahtev za" },
        submitted: { title: "Novi zahtev", text: "Podnet je zahtev za" },
        cancelled: { title: "Zahtev otkazan", text: "Otkazan je zahtev za" },
        delegation: {
          title: "Delegirano odobravanje",
          text: "Delegirano vam je odobravanje zahteva.",
          text_named: "{name} vam je delegirao/la odobravanje zahteva."
        },
        policy: {
          title: "Zakazana nova polisa odsustva",
          version: "Verzija {version}",
          effective: "važi od {date}."
        },
        default: { title: "Obaveštenje" }
      }
    },
    profile: {
      title: "Podešavanje naloga",
      role: "Uloga",
      email: "Email adresa",
      manager: "Nadređeni",
      hire_date: "Datum zaposlenja",
      personal: "Lični podaci",
      phone: "Broj telefona",
      religion: "Veroispovest",
      appearance: "Izgled",
      appearance_text: "Izaberite temu interfejsa. Sistemska prati podešavanje uređaja.",
      security: "Bezbednost naloga",
      security_text:
        "Generišite novi tajni ključ i ponovo povežite vašu aplikaciju za autentifikaciju.",
      reset_totp: "Resetuj autentifikator",
      reset_password: "Resetuj lozinku"
    },
    change_password: {
      title: "Resetuj lozinku naloga",
      current: "Trenutna lozinka",
      current_placeholder: "Unesite trenutnu lozinku...",
      new: "Nova lozinka",
      new_placeholder: "Unesite novu lozinku...",
      confirm: "Potvrdi novu lozinku",
      confirm_placeholder: "Ponovite novu lozinku...",
      notice:
        "Bićete odjavljeni sa platforme, potom pri sledećoj prijavi koristite novo postavljenu lozinku.",
      submit: "Promeni lozinku"
    },
    reset_totp: {
      title: "Resetovanje aplikacije za autentifikaciju",
      password: "Lozinka",
      notice:
        "Bićete odjavljeni sa platforme i preusmereni na prijavu i ponovno podešavanje aplikacije za autentifikaciju.",
      busy: "Resetovanje..."
    },
    company_profile: {
      title: "Podešavanje detalja kompanije",
      basics_title: "Osnovni podaci",
      basics_text: "Podaci o kompaniji koji se prikazuju u zaglavlju i na izveštajima.",
      name: "Naziv kompanije",
      address: "Adresa sedišta",
      contact: "Kontakt email",
      identity_title: "Vizuelni identitet",
      identity_text:
        "Izaberite primarnu boju interfejsa koja će važiti za sve zaposlene u kompaniji.",
      accent: "Primarna boja",
      default: "Podrazumevano",
      fill_all: "Popunite sva polja.",
      themes: {
        indigo: "Indigo",
        teal: "Tirkizna",
        sapphire: "Safirno plava",
        amber: "Ćilibar",
        rose: "Ruža"
      }
    },
    ad_settings: {
      title: "Podešavanje aktivnog direktorijuma",
      connection_title: "Podaci za povezivanje",
      connection_text: "Adresa AD servera i servisni nalog preko kog se aplikacija povezuje.",
      example: "npr. {value}",
      bind_password: "Bind lozinka",
      use_ssl: "Koristi sigurnu konekciju (SSL)",
      test_title: "Test konekcije",
      test_text:
        "Povežite {app} sa vašim Active Directory (AD) sistemom radi centralizovanog upravljanja nalozima zaposlenih, automatskog kreiranja profila i jedinstvene prijave (SSO).",
      test_hint: "Pre aktivacije konekcija mora biti prethodno uspešno testirana.",
      test_states: {
        idle: "Testiraj konekciju",
        testing: "Testiranje konekcije...",
        success: "Uspešno povezano",
        error: "Neuspešno povezano"
      },
      last_tested: "Poslednja uspešna konekcija: {date}",
      active_notice:
        "Aktivni direktorijum je aktiviran — prijava i nalozi zaposlenih se preuzimaju iz AD-a.",
      sync_failed: "Sinhronizacija nije uspela: {error}",
      sync_done:
        "Sinhronizacija završena — kreirano: {created}, ažurirano: {updated}, deaktivirano: {deactivated}, ponovo aktivirano: {reactivated}.",
      errors: {
        required: "Popunite Host, Base DN i Bind DN.",
        port: "Port mora biti broj između 1 i 65535.",
        password: "Unesite Bind lozinku."
      }
    },
    ad_activate: {
      title: "Aktiviraj Aktivni direktorijum",
      text: "Da li ste sigurni da želite da aktivirate integraciju? Sistem će odmah započeti preuzimanje i sinhronizaciju naloga zaposlenih.",
      notice:
        "Ova akcija je nepovratna. Kada jednom aktivirate AD, povratak na prethodni (lokalni) način upravljanja nalozima više neće biti moguć.",
      busy: "Sinhronizacija...",
      submit: "Aktiviraj AD"
    }
  },
  en: {
    validation: {
      email: "Enter a valid email."
    },
    notifications: {
      title: "Notifications",
      unread_label: "Notifications ({count} unread) | Notifications ({count} unread)",
      mark_all_read: "Mark all as read",
      empty: "You have no notifications.",
      reason: "Reason: {reason}",
      types: {
        approved: { title: "Request approved", text: "Your request was approved:" },
        rejected: { title: "Request rejected", text: "Your request was rejected:" },
        submitted: { title: "New request", text: "A request was submitted:" },
        cancelled: { title: "Request cancelled", text: "A request was cancelled:" },
        delegation: {
          title: "Approvals delegated",
          text: "Request approvals have been delegated to you.",
          text_named: "{name} delegated request approvals to you."
        },
        policy: {
          title: "New leave policy scheduled",
          version: "Version {version}",
          effective: "effective from {date}."
        },
        default: { title: "Notification" }
      }
    },
    profile: {
      title: "Account settings",
      role: "Role",
      email: "Email address",
      manager: "Manager",
      hire_date: "Hire date",
      personal: "Personal details",
      phone: "Phone number",
      religion: "Religion",
      appearance: "Appearance",
      appearance_text: "Choose the interface theme. System follows your device setting.",
      security: "Account security",
      security_text: "Generate a new secret key and reconnect your authenticator app.",
      reset_totp: "Reset authenticator",
      reset_password: "Reset password"
    },
    change_password: {
      title: "Reset account password",
      current: "Current password",
      current_placeholder: "Enter your current password...",
      new: "New password",
      new_placeholder: "Enter a new password...",
      confirm: "Confirm new password",
      confirm_placeholder: "Repeat the new password...",
      notice: "You'll be signed out. Use your new password the next time you sign in.",
      submit: "Change password"
    },
    reset_totp: {
      title: "Reset authenticator app",
      password: "Password",
      notice:
        "You'll be signed out and taken to sign in, where you'll set up your authenticator app again.",
      busy: "Resetting..."
    },
    company_profile: {
      title: "Company details",
      basics_title: "Basic information",
      basics_text: "Company details shown in the header and on reports.",
      name: "Company name",
      address: "Headquarters address",
      contact: "Contact email",
      identity_title: "Visual identity",
      identity_text: "Choose the primary interface color for everyone in your company.",
      accent: "Primary color",
      default: "Default",
      fill_all: "Fill in all fields.",
      themes: {
        indigo: "Indigo",
        teal: "Teal",
        sapphire: "Sapphire",
        amber: "Amber",
        rose: "Rose"
      }
    },
    ad_settings: {
      title: "Active Directory settings",
      connection_title: "Connection details",
      connection_text: "Your AD server address and the service account the app connects with.",
      example: "e.g. {value}",
      bind_password: "Bind password",
      use_ssl: "Use a secure connection (SSL)",
      test_title: "Connection test",
      test_text:
        "Connect {app} to your Active Directory (AD) to manage employee accounts centrally, create profiles automatically and enable single sign-on (SSO).",
      test_hint: "The connection must be tested successfully before activation.",
      test_states: {
        idle: "Test connection",
        testing: "Testing connection...",
        success: "Connected",
        error: "Connection failed"
      },
      last_tested: "Last successful connection: {date}",
      active_notice: "Active Directory is enabled — sign-in and employee accounts now come from AD.",
      sync_failed: "Sync failed: {error}",
      sync_done:
        "Sync complete — created: {created}, updated: {updated}, deactivated: {deactivated}, reactivated: {reactivated}.",
      errors: {
        required: "Fill in Host, Base DN and Bind DN.",
        port: "Port must be a number between 1 and 65535.",
        password: "Enter the bind password."
      }
    },
    ad_activate: {
      title: "Activate Active Directory",
      text: "Are you sure you want to activate the integration? The system will immediately start importing and syncing employee accounts.",
      notice:
        "This can't be undone. Once AD is active, you won't be able to switch back to local account management.",
      busy: "Syncing...",
      submit: "Activate AD"
    }
  }
};
