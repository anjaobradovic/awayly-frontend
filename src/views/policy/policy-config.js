// polja stranice polisa su podaci, view samo prolazi kroz nizove
// odeljak (nav + kartica) -> grupa (podnaslov) -> polje (red: opis levo, vrednost desno)
// tipovi polja: number, select, switch, day_month; visible(form) skriva polje
// title, label, help, unit i placeholder su ključevi prevoda (policy.*), prevode se pri crtanju
import { intlLocale, t } from "@/i18n";

export const BALANCE_MODELS = [
  { value: "MODEL_A", label: "policy.models.MODEL_A" },
  { value: "MODEL_B", label: "policy.models.MODEL_B" }
];

const MODEL_HINTS = {
  MODEL_A: "policy.models.hint_MODEL_A",
  MODEL_B: "policy.models.hint_MODEL_B"
};

// broj dana, label i help su policy.fields.<key> / policy.help.<key>
const number = (key, unit = "work_days", extra = {}) => ({ key, type: "number", unit, ...extra });
const toggle = (key) => ({ key, type: "switch" });

// polje koje zavisi od prekidača iznad sebe: uvučeno i vidi se samo dok je prekidač uključen
const dependsOn = (toggle_key, field) => ({
  ...field,
  dependent: true,
  visible: (form) => Boolean(form[toggle_key])
});

// boje i ikonice grupa iste kao na kalendaru i tipovima odsustva (REQUEST_GROUPS)
// API nema polja za bolovanje, trudničko i roditeljsko, pa nema ni redova
export const POLICY_SECTIONS = [
  {
    key: "vacation",
    title: "policy.groups.vacation",
    text: "policy.groups.vacation_text",
    icon: "beach_access",
    accent: "absence-vacation",
    cards: [
      {
        key: "annual_leave",
        title: "policy.cards.annual_leave",
        icon: "beach_access",
        fields: [
          {
            key: "balance_model",
            type: "select",
            options: BALANCE_MODELS,
            hint: (form) => MODEL_HINTS[form.balance_model]
          },
          number("annual_leave_days"),
          number("eligibility_period_days"),
          number("first_part_min_days")
        ]
      },
      {
        key: "negative_balance",
        title: "policy.cards.negative_balance",
        icon: "exposure",
        fields: [
          toggle("negative_balance_allowed"),
          dependsOn("negative_balance_allowed", number("max_negative_balance"))
        ]
      },
      {
        key: "carryover",
        title: "policy.cards.carryover",
        icon: "event_repeat",
        fields: [
          // getDefaultPolicy vraća null = prenos nije ograničen brojem dana
          number("max_carryover_days", "work_days", {
            nullable: true,
            placeholder: "policy.fields.no_limit"
          }),
          {
            key: "carryover_deadline",
            type: "day_month",
            keys: ["carryover_deadline_month", "carryover_deadline_day"]
          }
        ]
      },
      {
        key: "work_from_home",
        title: "policy.cards.work_from_home",
        icon: "maps_home_work",
        fields: [number("work_from_home_monthly_limit", "days_monthly")]
      }
    ]
  },
  {
    key: "family",
    title: "policy.groups.family",
    text: "policy.groups.family_text",
    icon: "favorite_border",
    accent: "absence-family",
    cards: [
      {
        key: "maternity",
        title: "policy.cards.maternity",
        icon: "child_friendly",
        fields: [
          number("maternity_leave_days_first_second"),
          number("maternity_leave_days_third_plus")
        ]
      }
    ]
  },
  {
    key: "paid",
    title: "policy.groups.paid",
    text: "policy.groups.paid_text",
    icon: "payments",
    accent: "absence-paid",
    cards: [
      {
        key: "paid_leave",
        fields: [
          number("paid_leave_general_days"),
          number("paid_leave_blood_donation_days"),
          number("paid_leave_family_death_days")
        ]
      }
    ]
  },
  {
    key: "bonuses",
    title: "policy.groups.bonuses",
    text: "policy.groups.bonuses_text",
    icon: "card_giftcard",
    accent: "primary-500",
    cards: [
      {
        key: "birthday",
        title: "policy.cards.birthday",
        icon: "cake",
        fields: [
          toggle("birthday_bonus_enabled"),
          dependsOn("birthday_bonus_enabled", number("birthday_bonus_days"))
        ]
      },
      {
        key: "seniority",
        title: "policy.cards.seniority",
        icon: "workspace_premium",
        fields: [
          toggle("seniority_bonus_enabled"),
          dependsOn("seniority_bonus_enabled", number("seniority_bonus_days_per_interval")),
          dependsOn("seniority_bonus_enabled", number("seniority_bonus_interval_years", "years"))
        ]
      }
    ]
  },
  {
    key: "requests",
    title: "policy.groups.requests",
    text: "policy.groups.requests_text",
    icon: "tune",
    accent: "absence-other",
    cards: [
      {
        key: "approvals",
        title: "policy.cards.approvals",
        icon: "how_to_reg",
        fields: [
          toggle("auto_escalation_enabled"),
          dependsOn("auto_escalation_enabled", number("escalation_period_days")),
          toggle("fallback_routing_enabled")
        ]
      },
      {
        key: "changes",
        title: "policy.cards.changes",
        icon: "edit_calendar",
        fields: [number("modification_cutoff_days")]
      },
      {
        key: "calendar",
        title: "policy.cards.calendar",
        icon: "calendar_month",
        fields: [toggle("include_weekends_in_calendar")]
      }
    ]
  }
];

// sva polja u jednom nizu, sa ključem odeljka
export const ALL_FIELDS = POLICY_SECTIONS.flatMap((section) =>
  section.cards.flatMap((card) => card.fields.map((field) => ({ ...field, section: section.key })))
);

// polje (ili kartica) bez `visible` se uvek vidi
export const isVisible = (field, form) => !field.visible || field.visible(form);

// ključevi polise iza jednog polja (datum prenosa su dva: mesec i dan)
export const fieldKeys = (field) => field.keys ?? [field.key];

const isEmpty = (value) => value === "" || value === null || value === undefined;

// "22" iz inputa i 22 sa servera su ista vrijednost
const same = (a, b) => (isEmpty(a) && isEmpty(b)) || String(a) === String(b);

export const isChanged = (field, form, original) =>
  fieldKeys(field).some((key) => !same(form[key], original[key]));

// broj mora biti unesen i ne smije biti negativan
export const isValidNumber = (value) =>
  !isEmpty(value) && Number.isFinite(Number(value)) && Number(value) >= 0;

// polje sa `nullable` sme da ostane prazno (šalje se null)
export const isValidField = (field, value) =>
  field.type !== "number" || (field.nullable && isEmpty(value)) || isValidNumber(value);

// skriveno polje se ne šalje kao izmjena, pa se ni ne provjerava
export const invalidFields = (form) =>
  ALL_FIELDS.filter((field) => isVisible(field, form) && !isValidField(field, form[field.key]));

// prazno nullable polje ide kao null, ne "", a brojevi kao brojevi
export const normalizePolicy = (form) => {
  const result = { ...form };

  for (const field of ALL_FIELDS.filter((item) => item.type === "number")) {
    const value = result[field.key];

    if (isEmpty(value)) {
      if (field.nullable) result[field.key] = null;
    } else if (isValidNumber(value)) {
      result[field.key] = Number(value);
    }
  }

  return result;
};

// "22 radna dana" (ili "22 working days"), bez broja ako je count tekst
export const unitWord = (unit, value) =>
  t(`policy.units.${unit}`, { count: Number.isFinite(Number(value)) ? Number(value) : 0 });

// vrijednost polja kao tekst za čip u prikazu i za "Bilo: ..."
export const formatFieldValue = (field, values) => {
  const value = values[field.key];

  if (field.type === "switch") return t(value ? "policy.field.on" : "policy.field.off");

  if (field.type === "select") {
    const option = field.options.find((item) => item.value === value);

    return option ? t(option.label) : "–";
  }

  if (field.type === "day_month") {
    const [month_key, day_key] = field.keys;
    const month = values[month_key];
    const day = values[day_key];

    if (!month || !day) return "–";

    // godina je bitna samo zbog prestupne, 2024 ima 29. februar
    return new Intl.DateTimeFormat(intlLocale(), {
      day: "numeric",
      month: "long",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(2024, month - 1, day)));
  }

  if (isEmpty(value)) return field.placeholder ? t(field.placeholder) : "–";

  const amount = Number(value);

  return `${amount.toLocaleString(intlLocale())} ${unitWord(field.unit, amount)}`;
};
