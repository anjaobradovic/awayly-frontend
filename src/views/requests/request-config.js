// zajednička podešavanja za kartice zahtjeva
import { t } from "@/i18n";
import { leaveTypeSourceName } from "@/utils/leave-type-name";

// label i title su getteri, prevode se u trenutku čitanja (u šablonu ili computed)

// status sa servera -> čip
export const STATUS_CHIPS = {
  PENDING: {
    label_key: "common.status.pending",
    tone: "pending",
    icon: "access_time_filled",
    get label() {
      return t(this.label_key);
    }
  },
  APPROVED: {
    label_key: "requests.status.approved",
    tone: "success",
    icon: "check_circle",
    get label() {
      return t(this.label_key);
    }
  },
  REJECTED: {
    label_key: "requests.status.rejected",
    tone: "error",
    icon: "remove_circle",
    get label() {
      return t(this.label_key);
    }
  },
  CANCELLED: {
    label_key: "common.status.cancelled",
    tone: "inactive",
    icon: "remove_circle",
    get label() {
      return t(this.label_key);
    }
  },
  PENDING_CANCELLATION: {
    label_key: "requests.status.pending_cancellation",
    tone: "pending",
    icon: "access_time_filled",
    get label() {
      return t(this.label_key);
    }
  }
};

// change_type sa servera -> tekst čipa dok zahtev čeka odluku
export const CHANGE_LABELS = {
  get MODIFICATION() {
    return t("requests.changes.modification");
  },
  get CANCELLATION() {
    return t("requests.changes.cancellation");
  }
};

// naziv tipa odsustva -> Material ikonica
const LEAVE_TYPE_ICONS = {
  "Godišnji odmor": "beach_access",
  "Rad od kuće": "home_work",
  Bolovanje: "local_hotel",
  "Dan bolovanja": "local_hotel",
  Porodiljsko: "child_friendly",
  "Privatni poslovi": "work_outline",
  "Davanje krvi": "bloodtype",
  "Smrtni slučaj": "local_florist",
  "Neplaćeno odsustvo": "money_off",
  Roditeljsko: "family_restroom",
  Trudničko: "pregnant_woman",
  "Krsna slava": "celebration"
};

// prima naziv na bilo kom jeziku, mapa je ključana srpskim nazivom
export const iconOf = (leave_type) => LEAVE_TYPE_ICONS[leaveTypeSourceName(leave_type)] ?? "event";

// "zahtev" / "zahteva" / "requests" bez broja, množina iz prevoda
export const requestsWord = (n) => t("requests.requests_word", { count: n });

// kolone na stranici zahtjeva, ista podjela kao u polisi
const group = (key, accent) => ({
  key,
  accent,
  get title() {
    return t(`requests.groups.${key}`);
  }
});

export const REQUEST_GROUPS = [
  group("vacation", "absence-vacation"),
  group("family", "absence-family"),
  group("paid", "absence-paid"),
  group("other", "absence-other")
];

// naziv tipa -> kolona, nepoznat tip ide u Ostalo
const LEAVE_TYPE_GROUPS = {
  "Godišnji odmor": "vacation",
  "Rad od kuće": "vacation",
  Bolovanje: "family",
  "Dan bolovanja": "family",
  Porodiljsko: "family",
  "Privatni poslovi": "paid",
  "Davanje krvi": "paid",
  "Smrtni slučaj": "paid",
  "Neplaćeno odsustvo": "other",
  Roditeljsko: "family",
  Trudničko: "family",
  "Krsna slava": "paid"
};

export const groupKeyOf = (leave_type) =>
  LEAVE_TYPE_GROUPS[leaveTypeSourceName(leave_type)] ?? "other";

// svoj zahtjev se može otkazati dok čeka (9.6) ili odobren prije početka (9.7)
export const canCancel = (request) =>
  request.status === "PENDING" ||
  (request.status === "APPROVED" &&
    String(request.start_date).slice(0, 10) > new Date().toISOString().slice(0, 10));
