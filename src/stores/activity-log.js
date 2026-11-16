import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";
import { leaveTypeName } from "@/utils/leave-type-name";
import { toApiDate, toApiDateEnd } from "@/utils/api-date";
import { countFilters } from "@/utils/filter-count";
import { intlLocale, script, t, te } from "@/i18n";

// dokumentacija (18.1) ne navodi moguće vrijednosti actor_type / audit_type
// tekstovi su u i18n/messages/activity_log.js, ovdje su samo ključevi i boje
const ACTOR_TYPES = {
  SYSTEM: { label: "system", tone: "action" },
  EMPLOYEE: { label: "employee", tone: "default" },
  USER: { label: "employee", tone: "default" },
  MANAGER: { label: "manager", tone: "default" },
  COMPANYADMIN: { label: "admin", tone: "default" },
  COMPANY_ADMIN: { label: "admin", tone: "default" },
  ADMIN: { label: "admin", tone: "default" }
};

// tipovi koji imaju svoj prevod (activity_log.audit_types.*), ujedno i opcije filtera
const AUDIT_TYPES = [
  "LOGIN",
  "LOGOUT",
  "LOGIN_FAILED",
  "ACCOUNT_ACTIVATED",
  "ACCOUNT_LOCKED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "PASSWORD_RESET_REQUESTED",
  "TOTP_RESET",
  "LEAVE_REQUEST_CREATED",
  "LEAVE_REQUEST_APPROVED",
  "LEAVE_REQUEST_REJECTED",
  "LEAVE_REQUEST_CANCELLED",
  "LEAVE_REQUEST_WITHDRAWN",
  "LEAVE_REQUEST_MODIFIED",
  "LEAVE_REQUEST_INTERRUPTED",
  "LEAVE_REQUEST_ESCALATED",
  "LEAVE_REQUEST_CANCELLATION_REQUESTED",
  "LEAVE_BALANCE_UPDATED",
  "LEAVE_TYPE_CREATED",
  "LEAVE_TYPE_UPDATED",
  "LEAVE_TYPE_DELETED",
  "POLICY_SETUP",
  "POLICY_SCHEDULED",
  "POLICY_CANCELLED",
  "POLICY_ACTIVATED",
  "HOLIDAY_CREATED",
  "HOLIDAY_UPDATED",
  "HOLIDAY_DELETED",
  "DELEGATION_CREATED",
  "DELEGATION_UPDATED",
  "DELEGATION_CANCELLED",
  "DELEGATION_DELETED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DEACTIVATED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "TEAM_CREATED",
  "TEAM_UPDATED",
  "TEAM_DELETED",
  "COMPANY_UPDATED"
];

// za tip koji nije u spisku: imenica + glagol (activity_log.nouns / verbs)
// rod imenice bira oblik glagola na srpskom: [muški, ženski, srednji, množina]
const AUDIT_NOUNS = [
  ["LEAVE_REQUEST", "m"],
  ["LEAVE_TYPE", "m"],
  ["LEAVE_BALANCE", "m"],
  ["APPROVAL_CHAIN", "m"],
  ["AD_SETTINGS", "p"],
  ["POLICY", "f"],
  ["HOLIDAY", "m"],
  ["DELEGATION", "f"],
  ["USER", "m"],
  ["ROLE", "f"],
  ["TEAM", "m"],
  ["COMPANY", "f"],
  ["NOTIFICATION", "n"],
  ["REPORT", "m"]
];

const GENDER_INDEX = { m: 0, f: 1, n: 2, p: 3 };

const composeAuditLabel = (key) => {
  const noun = AUDIT_NOUNS.find(([prefix]) => key === prefix || key.startsWith(`${prefix}_`));
  const verb_key = noun && `activity_log.verbs.${key.slice(noun[0].length + 1)}`;

  if (!verb_key || !te(verb_key)) return null;

  // "kreiran | kreirana | kreirano | kreirana", engleski ima jedan oblik
  const forms = t(verb_key).split(" | ");
  const verb = forms[GENDER_INDEX[noun[1]]] ?? forms[0];

  return t("activity_log.composed", { noun: t(`activity_log.nouns.${noun[0]}`), verb });
};

const humanize = (value) => {
  const text = String(value ?? "")
    .replace(/[_.]+/g, " ")
    .trim()
    .toLowerCase();

  return text.charAt(0).toUpperCase() + text.slice(1);
};

const normalizeKey = (value) => String(value ?? "").toUpperCase();

const actorType = (value) => {
  const type = ACTOR_TYPES[normalizeKey(value)];

  return type
    ? { label: t(`activity_log.actors.${type.label}`), tone: type.tone }
    : { label: humanize(value), tone: "default" };
};

// reaktivno samo ako se zove pri renderu / u getteru
export const auditTypeLabel = (value) => {
  const key = normalizeKey(value);

  if (AUDIT_TYPES.includes(key)) return t(`activity_log.audit_types.${key}`);

  return composeAuditLabel(key) ?? humanize(value);
};

const isDateKey = (key) => /(_date|_at|^date|_from)$/.test(key);

// datum se čita kako je poslat (samo dan), u UTC da zona ne pomjeri dan
const parseDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));

  return match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : null;
};

const dateFormatter = () =>
  new Intl.DateTimeFormat(intlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });

// Intl sam izostavlja ponovljenu godinu/mjesec (3–5. jan 2026.)
const formatRange = (start, end) => {
  const from = parseDate(start);
  const to = parseDate(end);

  if (!from || !to) return [start, end].filter(Boolean).join(" - ");

  return from <= to
    ? dateFormatter().formatRange(from, to)
    : `${dateFormatter().format(from)} - ${dateFormatter().format(to)}`;
};

const formatSingleDate = (value) => {
  const date = parseDate(value);

  return date ? dateFormatter().format(date) : String(value);
};

// kodne vrijednosti iz metadata koje imaju prevod (activity_log.values.*)
const VALUE_KEYS = new Set([
  "LOCAL",
  "AD",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "PENDING_CANCELLATION",
  "MODEL_A",
  "MODEL_B",
  "NATIONAL",
  "RELIGIOUS",
  "COMPANY"
]);

const valueLabel = (value) => {
  const text = String(value);

  if (!/^[A-Z][A-Z0-9_]*$/.test(text)) return text;

  return VALUE_KEYS.has(text) ? t(`activity_log.values.${text}`) : humanize(text);
};

// metadata ključ -> naziv reda u detaljima (activity_log.detail_labels.*)
const DETAIL_LABELS = new Set([
  "leave_type",
  "requester",
  "version",
  "effective_from",
  "reason",
  "date",
  "period",
  "email",
  "name",
  "source"
]);

const detailLabel = (key) => {
  const label_key = /^leave_type(_name)?$/.test(key)
    ? "leave_type"
    : key === "rejection_reason"
      ? "reason"
      : key;

  if (DETAIL_LABELS.has(label_key)) return t(`activity_log.detail_labels.${label_key}`);

  return isDateKey(key) ? t("activity_log.detail_labels.date") : humanize(key);
};

const detailValue = (key, value) => {
  if (/^leave_type(_name)?$/.test(key)) return leaveTypeName(value);
  if (isDateKey(key)) return formatSingleDate(value);

  return valueLabel(value);
};

const SKIPPED_KEYS = new Set(["id", "status"]);

// redovi detalja [{ key, label, value }], redoslijed: tip, osoba, ostalo, period
const toDetails = (metadata, user_names = {}) => {
  if (!metadata || typeof metadata !== "object") return [];

  const entries = Object.entries(metadata).filter(
    ([key, value]) =>
      value !== null &&
      value !== "" &&
      typeof value !== "object" &&
      typeof value !== "boolean" &&
      !SKIPPED_KEYS.has(key) &&
      !key.endsWith("_id")
  );

  const start = entries.find(([key]) => /^(start_date|date_from|start)$/.test(key));
  const end = entries.find(([key]) => /^(end_date|date_to|end)$/.test(key));
  const parts = [];
  const requester = user_names[metadata.requesting_user_id];
  const row = (key, label, value) => ({ key, label, value: String(value) });

  if (requester) {
    parts.push([1, row("requester", t("activity_log.detail_labels.requester"), script(requester))]);
  }

  for (const [key, value] of entries) {
    if (start && end && (key === start[0] || key === end[0])) continue;

    const order = /^leave_type(_name)?$/.test(key) ? 0 : 2;

    parts.push([order, row(key, detailLabel(key), detailValue(key, value))]);
  }

  if (start && end) {
    parts.push([
      3,
      row("period", t("activity_log.detail_labels.period"), formatRange(start[1], end[1]))
    ]);
  }

  return parts.sort((a, b) => a[0] - b[0]).map(([, item]) => item);
};

// vrsta radnje -> boja i ikonica tačke na vremenskoj liniji
// ton: success | accent | error | warning | info | neutral
const VERB_KINDS = {
  CREATED: ["success", "add"],
  ADDED: ["success", "person_add"],
  SETUP: ["success", "tune"],
  APPROVED: ["success", "check"],
  ACTIVATED: ["success", "bolt"],
  UPDATED: ["accent", "edit"],
  MODIFIED: ["accent", "edit"],
  CHANGED: ["accent", "edit"],
  ASSIGNED: ["accent", "assignment_ind"],
  GENERATED: ["accent", "description"],
  SYNCED: ["accent", "sync"],
  DELETED: ["error", "delete"],
  REMOVED: ["error", "remove"],
  DEACTIVATED: ["error", "block"],
  REJECTED: ["error", "close"],
  CANCELLED: ["warning", "event_busy"],
  WITHDRAWN: ["warning", "undo"],
  INTERRUPTED: ["warning", "pause"],
  CANCELLATION_REQUESTED: ["warning", "event_busy"],
  SCHEDULED: ["info", "schedule"],
  ESCALATED: ["info", "trending_up"]
};

// prijave, lozinke i nalozi: plava (bezbjednost), problemi crveni
const SECURITY_KINDS = {
  LOGIN: ["info", "login"],
  LOGOUT: ["info", "logout"],
  LOGIN_FAILED: ["error", "gpp_bad"],
  ACCOUNT_ACTIVATED: ["success", "verified_user"],
  ACCOUNT_LOCKED: ["error", "lock"],
  PASSWORD_CHANGED: ["info", "key"],
  PASSWORD_RESET: ["info", "lock_reset"],
  PASSWORD_RESET_REQUESTED: ["info", "lock_reset"],
  TOTP_RESET: ["info", "phonelink_lock"]
};

// ikonica entiteta u čipu
const NOUN_ICONS = {
  LEAVE_REQUEST: "event_note",
  LEAVE_TYPE: "category",
  LEAVE_BALANCE: "account_balance_wallet",
  APPROVAL_CHAIN: "account_tree",
  AD_SETTINGS: "dns",
  POLICY: "policy",
  HOLIDAY: "celebration",
  DELEGATION: "swap_horiz",
  USER: "person",
  ROLE: "admin_panel_settings",
  TEAM: "groups",
  COMPANY: "business",
  NOTIFICATION: "notifications",
  REPORT: "summarize",
  ACCOUNT: "shield"
};

const auditNoun = (key) =>
  AUDIT_NOUNS.find(([prefix]) => key === prefix || key.startsWith(`${prefix}_`))?.[0] ?? null;

const auditKind = (value) => {
  const key = normalizeKey(value);

  if (SECURITY_KINDS[key]) {
    const [tone, icon] = SECURITY_KINDS[key];
    return { tone, icon, noun: "ACCOUNT" };
  }

  const noun = auditNoun(key);
  const verb = noun ? key.slice(noun.length + 1) : key;
  const [tone, icon] =
    VERB_KINDS[verb] ??
    Object.entries(VERB_KINDS).find(([name]) => verb.endsWith(name))?.[1] ?? [
      "neutral",
      "history"
    ];

  return { tone, icon, noun };
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

// zapis za vremensku liniju; zove se u getteru da bi tekstovi pratili promjenu jezika
const toEntry = (entry, user_names) => {
  const is_system = normalizeKey(entry.actor_type) === "SYSTEM";
  const type = actorType(entry.actor_type);
  const details = toDetails(entry.metadata, user_names);
  const kind = auditKind(entry.audit_type);
  const actor_name = entry.actor_name
    ? script(entry.actor_name)
    : is_system
      ? t("activity_log.actors.system")
      : "—";

  return {
    id: entry.id,
    actor_name,
    actor_initials: is_system ? "" : initials(actor_name),
    actor_type: type.label,
    actor_tone: type.tone,
    is_system,
    audit_type: entry.audit_type,
    audit_label: auditTypeLabel(entry.audit_type),
    tone: kind.tone,
    icon: kind.icon,
    entity: kind.noun
      ? { label: t(`activity_log.nouns.${kind.noun}`), icon: NOUN_ICONS[kind.noun] ?? "label" }
      : null,
    details,
    details_text: details.map((item) => `${item.label} ${item.value}`).join(" "),
    created_at: entry.created_at
  };
};

const createDefaultFilters = () => ({ audit_type: null, date_from: "", date_to: "" });

export const useActivityLogStore = defineStore("activity-log", {
  state: () => ({
    // sirovi zapisi iz 18.1, prevedeni redovi su u getteru rows
    items: [],
    total_count: 0,
    user_names: {},
    is_loading: false,
    // učitavanje sledeće strane ("Učitaj još"), lista ostaje vidljiva
    is_loading_more: false,
    error: null,
    request_token: 0,
    search: "",
    filters: createDefaultFilters(),
    page: 1,
    per_page: 15
  }),

  getters: {
    has_filters: (state) =>
      Object.values(state.filters).some((value) => value !== null && value !== ""),

    filter_count: (state) => countFilters(state.filters),

    audit_type_options: () =>
      AUDIT_TYPES.map((value) => ({ value, label: auditTypeLabel(value) })).sort((a, b) =>
        a.label.localeCompare(b.label, intlLocale())
      ),

    rows: (state) => state.items.map((entry) => toEntry(entry, state.user_names)),

    // API 18.1 nema parametar za tekst, pretraga radi samo nad učitanim zapisima
    visible_items() {
      const query = this.search.trim().toLowerCase();

      if (!query) return this.rows;

      return this.rows.filter((item) =>
        [item.actor_name, item.actor_type, item.audit_label, item.details_text]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    },

    total_pages: (state) => Math.max(1, Math.ceil(state.total_count / state.per_page)),

    has_more: (state) => state.items.length < state.total_count
  },

  actions: {
    // append: sledeća strana se dodaje na već učitane zapise
    async fetchEntries({ append = false } = {}) {
      const token = ++this.request_token;
      const { audit_type, date_from, date_to } = this.filters;
      const { get } = useApi();
      const loading_key = append ? "is_loading_more" : "is_loading";

      if (!append) this.page = 1;

      this[loading_key] = true;
      this.error = null;

      try {
        const { data, error } = await get("auditLog/getAuditLog", {
          auth: true,
          filters: {
            page: { value: this.page },
            page_size: { value: this.per_page },
            audit_type: { value: audit_type },
            // dokumentacija kaže date, a backend traži datetime (kao kod 17.2)
            date_from: { value: toApiDate(date_from) },
            date_to: { value: toApiDateEnd(date_to) }
          }
        });

        if (token !== this.request_token) return;

        if (error) {
          this.error = error;
          if (append) this.page -= 1;
          return error;
        }

        const payload = data?.data?.data;
        const entries = payload?.entries ?? [];

        await this.fetchUserNames(entries);

        if (token !== this.request_token) return;

        if (append) {
          const known = new Set(this.items.map((entry) => entry.id));
          this.items = [...this.items, ...entries.filter((entry) => !known.has(entry.id))];
        } else {
          this.items = entries;
        }

        this.total_count = payload?.total_count ?? 0;
      } finally {
        if (token === this.request_token) {
          this.is_loading = false;
          this.is_loading_more = false;
        }
      }
    },

    async fetchUserNames(entries) {
      const ids = [
        ...new Set(entries.map((entry) => entry.metadata?.requesting_user_id).filter(Boolean))
      ].filter((id) => !(id in this.user_names));

      if (!ids.length) return;

      const { get } = useApi();
      const results = await Promise.all(
        ids.map((id) => get(`user/getSingleUser/${id}`, { auth: true }))
      );

      const names = { ...this.user_names };

      results.forEach(({ data, error }, index) => {
        const user = error ? null : data?.data?.data;
        const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ");

        names[ids[index]] = name || null;
      });

      this.user_names = names;
    },

    loadMore() {
      if (!this.has_more || this.is_loading || this.is_loading_more) return;

      this.page += 1;
      return this.fetchEntries({ append: true });
    },

    setSearch(value) {
      this.search = value;
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
      return this.fetchEntries();
    },

    clearFilters() {
      this.filters = createDefaultFilters();
      return this.fetchEntries();
    },

    resetStore() {
      const request_token = this.request_token + 1;

      this.$reset();
      this.request_token = request_token;
    }
  }
});
