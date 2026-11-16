// podesavanja za stranicu zaposleni i njene panele
// tekstovi su getteri: t() se zove tek pri prikazu, pa prate promjenu jezika
import { t } from "@/i18n";

// status sa servera u cip
export const STATUS_CHIPS = {
  ACTIVE: {
    get label() {
      return t("common.status.active");
    },
    tone: "active",
    icon: "check_circle"
  },
  DEACTIVATED: {
    get label() {
      return t("common.status.inactive");
    },
    tone: "inactive",
    icon: "remove_circle"
  },
  PENDING_INVITE: {
    get label() {
      return t("common.status.pending");
    },
    tone: "pending",
    icon: "access_time_filled",
    // tooltip na i pored cipa
    hint: {
      get title() {
        return t("employees.status.pending_invite_title");
      },
      get text() {
        return t("employees.status.pending_invite_text");
      }
    }
  },
  PENDING_DATA: {
    get label() {
      return t("common.status.pending");
    },
    tone: "pending",
    icon: "access_time_filled",
    hint: {
      get title() {
        return t("employees.status.pending_data_title");
      },
      get text() {
        return t("employees.status.pending_data_text");
      }
    }
  }
};

// opcija za VSelect sa prevedenim nazivom
const option = (value, key) => ({
  value,
  get label() {
    return t(key);
  }
});

// onboarding_type i religion nemaju endpoint za listu, pa su ovdje
export const ONBOARDING_OPTIONS = [
  option("NEW_EMPLOYEE", "employees.onboarding.new"),
  option("EXISTING_EMPLOYEE", "employees.onboarding.existing")
];

export const RELIGION_OPTIONS = [
  option("ORTHODOX", "employees.religion.orthodox"),
  option("CATHOLIC", "employees.religion.catholic"),
  option("MUSLIM", "employees.religion.muslim"),
  option("JEWISH", "employees.religion.jewish"),
  option("NONE", "employees.religion.none")
];
