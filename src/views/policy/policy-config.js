// polja stranice polisa su podaci, view samo prolazi kroz nizove
// tipovi polja: number, select, checkbox; visible(form) skriva polje
// label, title, suffix, hint i placeholder su ključevi prevoda (policy.*), prevode se pri crtanju

export const BALANCE_MODELS = [
  { value: "MODEL_A", label: "policy.models.MODEL_A" },
  { value: "MODEL_B", label: "policy.models.MODEL_B" }
];

const MODEL_HINTS = {
  MODEL_A: "policy.models.hint_MODEL_A",
  MODEL_B: "policy.models.hint_MODEL_B"
};

// tri kolone sa karticama, četvrta je SETTINGS_SECTIONS
// API nema polja za bolovanje, trudničko i roditeljsko, pa nema ni kartica
export const POLICY_GROUPS = [
  {
    key: "vacation",
    title: "policy.groups.vacation",
    accent: "absence-vacation",
    cards: [
      {
        key: "work_from_home",
        title: "policy.cards.work_from_home",
        icon: "maps_home_work",
        fields: [
          {
            key: "work_from_home_monthly_limit",
            type: "number",
            label: "policy.fields.work_from_home_monthly_limit",
            suffix: "policy.suffix.days_monthly"
          }
        ]
      },
      {
        key: "annual_leave",
        title: "policy.cards.annual_leave",
        icon: "beach_access",
        fields: [
          {
            key: "balance_model",
            type: "select",
            label: "policy.fields.balance_model",
            options: BALANCE_MODELS,
            hint: (form) => MODEL_HINTS[form.balance_model]
          },
          {
            key: "annual_leave_days",
            type: "number",
            label: "policy.fields.annual_leave_days",
            suffix: "policy.suffix.work_days"
          },
          {
            key: "negative_balance_allowed",
            type: "checkbox",
            label: "policy.fields.negative_balance_allowed"
          },
          {
            key: "max_negative_balance",
            type: "number",
            label: "policy.fields.max_negative_balance",
            suffix: "policy.suffix.work_days",
            visible: (form) => form.negative_balance_allowed
          },
          {
            key: "eligibility_period_days",
            type: "number",
            label: "policy.fields.eligibility_period_days",
            suffix: "policy.suffix.work_days"
          },
          {
            key: "first_part_min_days",
            type: "number",
            label: "policy.fields.first_part_min_days",
            suffix: "policy.suffix.work_days"
          },
          {
            key: "max_carryover_days",
            type: "number",
            label: "policy.fields.max_carryover_days",
            suffix: "policy.suffix.work_days",
            // getDefaultPolicy vraća null = prenos nije ograničen brojem dana
            nullable: true,
            placeholder: "policy.fields.no_limit"
          }
        ]
      }
    ]
  },
  {
    key: "family",
    title: "policy.groups.family",
    accent: "absence-family",
    cards: [
      {
        key: "maternity",
        title: "policy.cards.maternity",
        icon: "child_friendly",
        fields: [
          {
            key: "maternity_leave_days_first_second",
            type: "number",
            label: "policy.fields.maternity_leave_days_first_second",
            suffix: "policy.suffix.work_days"
          },
          {
            key: "maternity_leave_days_third_plus",
            type: "number",
            label: "policy.fields.maternity_leave_days_third_plus",
            suffix: "policy.suffix.work_days"
          }
        ]
      }
    ]
  },
  {
    key: "paid",
    title: "policy.groups.paid",
    accent: "absence-paid",
    cards: [
      {
        key: "private",
        title: "policy.cards.private",
        icon: "work_outline",
        fields: [
          {
            key: "paid_leave_general_days",
            type: "number",
            label: "policy.fields.paid_leave_general_days",
            suffix: "policy.suffix.work_days"
          }
        ]
      },
      {
        key: "blood_donation",
        title: "policy.cards.blood_donation",
        icon: "bloodtype",
        fields: [
          {
            key: "paid_leave_blood_donation_days",
            type: "number",
            label: "policy.fields.paid_leave_blood_donation_days",
            suffix: "policy.suffix.work_days"
          }
        ]
      },
      {
        key: "family_death",
        title: "policy.cards.family_death",
        icon: "local_florist",
        fields: [
          {
            key: "paid_leave_family_death_days",
            type: "number",
            label: "policy.fields.paid_leave_family_death_days",
            suffix: "policy.suffix.work_days"
          }
        ]
      }
    ]
  }
];

// svaka sekcija ima toggle, polja se vide samo dok je uključen
export const SETTINGS_SECTIONS = [
  {
    toggle: "birthday_bonus_enabled",
    label: "policy.sections.birthday_bonus_enabled",
    fields: [
      {
        key: "birthday_bonus_days",
        type: "number",
        label: "policy.fields.birthday_bonus_days",
        suffix: "policy.suffix.work_days",
        required: true
      }
    ]
  },
  {
    toggle: "seniority_bonus_enabled",
    label: "policy.sections.seniority_bonus_enabled",
    fields: [
      {
        key: "seniority_bonus_days_per_interval",
        type: "number",
        label: "policy.fields.seniority_bonus_days_per_interval",
        suffix: "policy.suffix.work_days"
      },
      {
        key: "seniority_bonus_interval_years",
        type: "number",
        label: "policy.fields.seniority_bonus_interval_years",
        suffix: "policy.suffix.years"
      }
    ]
  },
  {
    toggle: "auto_escalation_enabled",
    label: "policy.sections.auto_escalation_enabled",
    fields: [
      {
        key: "escalation_period_days",
        type: "number",
        label: "policy.fields.escalation_period_days",
        suffix: "policy.suffix.work_days"
      }
    ]
  },
  {
    toggle: "fallback_routing_enabled",
    label: "policy.sections.fallback_routing_enabled",
    fields: []
  },
  {
    fields: [
      {
        key: "modification_cutoff_days",
        type: "number",
        label: "policy.fields.modification_cutoff_days",
        suffix: "policy.suffix.work_days",
        required: true
      }
    ]
  }
];

// polje (ili kartica) bez `visible` se uvek vidi
export const isVisible = (field, form) => !field.visible || field.visible(form);

// sva brojna polja koja se trenutno vide (i na stranici i u panelu)
export const visibleNumberFields = (form) => {
  const page_fields = POLICY_GROUPS.flatMap((group) => group.cards)
    .filter((card) => isVisible(card, form))
    .flatMap((card) => card.fields);
  const settings_fields = SETTINGS_SECTIONS.filter(
    (section) => !section.toggle || form[section.toggle]
  ).flatMap((section) => section.fields);

  return [...page_fields, ...settings_fields].filter(
    // isključeno polje se ne šalje, pa se ni ne provjerava
    (field) => field.type === "number" && !field.disabled && isVisible(field, form)
  );
};

// broj mora biti unesen i ne smije biti negativan
export const isValidNumber = (value) => value !== "" && value !== null && Number(value) >= 0;

const isEmpty = (value) => value === "" || value === null || value === undefined;

// polje sa `nullable` sme da ostane prazno (šalje se null)
export const isValidField = (field, value) =>
  (field.nullable && isEmpty(value)) || isValidNumber(value);

// prazno nullable polje ide kao null, ne ""
export const normalizeNullable = (form) => {
  const result = { ...form };

  for (const field of POLICY_GROUPS.flatMap((group) => group.cards).flatMap(
    (card) => card.fields
  )) {
    if (field.nullable && isEmpty(result[field.key])) result[field.key] = null;
  }

  return result;
};
