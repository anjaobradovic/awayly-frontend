// poruke grešaka iz API-ja (utils/api-error.js, stores/ad-settings.js)
export default {
  sr: {
    generic: "Došlo je do greške. Pokušajte ponovo.",
    password: {
      wrong_current: "Trenutna lozinka nije ispravna.",
      mismatch: "Nova lozinka i potvrda se ne poklapaju.",
      ad_account: "Lozinka AD naloga se menja u Active Directory-ju, ne ovde."
    },
    leave_request: {
      end_before_start: "Datum završetka mora biti isti ili posle datuma početka.",
      reason_required: "Za ovu vrstu odsustva razlog je obavezan.",
      notice_too_short:
        "Zahtev nije podnet dovoljno unapred — ova vrsta odsustva traži raniju najavu.",
      past_dates: "Za ovu vrstu odsustva nije moguće podneti zahtev za datume u prošlosti.",
      type_missing: "Izabrana vrsta odsustva više ne postoji.",
      overlap: "Već imate zahtev koji se preklapa sa izabranim periodom.",
      not_enough_days: "Nemate dovoljno raspoloživih dana za ovaj zahtev.",
      maternity_details:
        "Za porodiljsko odsustvo unesite očekivani datum porođaja i redni broj deteta.",
      child_number: "Redni broj deteta mora biti pozitivan broj.",
      end_required: "Unesite datum završetka.",
      end_automatic: "Za ovu vrstu odsustva datum završetka se računa automatski.",
      min_employment: "Još niste ispunili minimalni period zaposlenja za ovu vrstu odsustva.",
      wfh_limit: "Ovaj zahtev prelazi mesečni limit za rad od kuće.",
      first_annual_short:
        "Prvi godišnji odmor u kalendarskoj godini mora biti duži — pogledajte polisu odsustva.",
      first_annual_min:
        "Prvi godišnji odmor u kalendarskoj godini mora trajati najmanje {count} radni dan. | Prvi godišnji odmor u kalendarskoj godini mora trajati najmanje {count} radna dana. | Prvi godišnji odmor u kalendarskoj godini mora trajati najmanje {count} radnih dana.",
      due_date_before_start:
        "Očekivani datum porođaja mora biti posle datuma početka porodiljskog odsustva."
    },
    ad: {
      not_saved: "AD podešavanja prvo moraju biti sačuvana.",
      not_tested: "Konekcija mora biti uspešno testirana pre aktivacije AD-a.",
      not_active: "AD prijava nije aktivirana za ovu kompaniju.",
      account_missing: "Vaš nalog mora postojati u AD-u pre aktivacije.",
      no_users: "AD nije vratio nijednog korisnika, sinhronizacija je prekinuta. Proverite Base DN.",
      connection_failed: "Nije moguće povezati se sa AD serverom.",
      bad_credentials: "Pristupni podaci servisnog naloga nisu ispravni."
    }
  },
  en: {
    generic: "Something went wrong. Please try again.",
    password: {
      wrong_current: "Your current password is incorrect.",
      mismatch: "The new password and confirmation don't match.",
      ad_account: "AD account passwords are changed in Active Directory, not here."
    },
    leave_request: {
      end_before_start: "The end date must be on or after the start date.",
      reason_required: "A reason is required for this leave type.",
      notice_too_short: "This request wasn't submitted early enough — this leave type needs more notice.",
      past_dates: "You can't request this leave type for past dates.",
      type_missing: "The selected leave type no longer exists.",
      overlap: "You already have a request that overlaps this period.",
      not_enough_days: "You don't have enough days left for this request.",
      maternity_details: "For maternity leave, enter the expected due date and the child's birth order.",
      child_number: "The child's birth order must be a positive number.",
      end_required: "Enter an end date.",
      end_automatic: "The end date for this leave type is calculated automatically.",
      min_employment: "You haven't reached the minimum employment period for this leave type yet.",
      wfh_limit: "This request exceeds the monthly work-from-home limit.",
      first_annual_short:
        "Your first vacation in a calendar year must be longer — see the leave policy.",
      first_annual_min:
        "Your first vacation in a calendar year must be at least {count} working day. | Your first vacation in a calendar year must be at least {count} working days.",
      due_date_before_start: "The expected due date must be after the start of maternity leave."
    },
    ad: {
      not_saved: "Save the AD settings first.",
      not_tested: "The connection must be tested successfully before activating AD.",
      not_active: "AD sign-in isn't enabled for this company.",
      account_missing: "Your account must exist in AD before activation.",
      no_users: "AD returned no users, so the sync was stopped. Check the Base DN.",
      connection_failed: "Couldn't connect to the AD server.",
      bad_credentials: "The service account credentials are incorrect."
    }
  }
};
