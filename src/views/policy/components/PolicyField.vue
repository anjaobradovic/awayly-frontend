<template>
  <!-- jedan red: naziv i kratko objašnjenje levo, vrijednost (ili kontrola) desno -->
  <div
    v-if="isVisible(field, form)"
    :class="[
      'policy-field',
      {
        'is-dependent': field.dependent,
        'is-editing': editing,
        'is-changed': editing && changed,
        'is-invalid': editing && is_invalid
      }
    ]"
  >
    <div class="policy-field__text">
      <span :id="label_id" class="policy-field__label">
        {{ $t(`policy.fields.${field.key}`) }}
        <span v-if="editing && changed" class="policy-field__tag">
          {{ $t("policy.field.changed") }}
        </span>
      </span>
      <span class="policy-field__help">{{ $t(`policy.help.${field.key}`) }}</span>
      <span v-if="editing && changed" class="policy-field__was">
        {{ $t("policy.field.was", { value: formatFieldValue(field, original) }) }}
      </span>
    </div>

    <div class="policy-field__value">
      <!-- prikaz: vrijednost kao čip -->
      <template v-if="!editing">
        <span :class="['policy-field__chip', chip_class]">
          <VIcon v-if="field.type === 'switch'" :name="form[field.key] ? 'check_circle' : 'remove_circle_outline'" :size="14" />
          {{ formatFieldValue(field, form) }}
        </span>
        <span v-if="hint" class="policy-field__hint">{{ hint }}</span>
      </template>

      <!-- izmjena -->
      <template v-else>
        <VSwitch
          v-if="field.type === 'switch'"
          :model-value="Boolean(form[field.key])"
          class="policy-field__switch"
          @update:model-value="set(field.key, $event)"
        >
          <span class="policy-field__sr">{{ $t(`policy.fields.${field.key}`) }}</span>
        </VSwitch>

        <template v-else-if="field.type === 'select'">
          <VSegmentedButton
            :model-value="form[field.key] ?? ''"
            size="small"
            :options="options"
            :aria-labelledby="label_id"
            @update:model-value="set(field.key, $event)"
          />
          <span v-if="hint" class="policy-field__hint">{{ hint }}</span>
        </template>

        <VDateInput
          v-else-if="field.type === 'day_month'"
          v-model="day_month"
          class="policy-field__date"
          icon="today"
          :aria-labelledby="label_id"
        />

        <!-- sufiks ide odmah iza broja, ne uz desnu ivicu -->
        <div v-else class="policy-field__number" @click="focusNumber">
          <VBaseInput
            :model-value="form[field.key] ?? ''"
            :class="{ 'has-value': has_value }"
            :style="{ '--value-width': value_width }"
            type="number"
            appearance="outlined"
            :placeholder="field.placeholder ? $t(field.placeholder) : ''"
            :suffix="unitWord(field.unit, form[field.key])"
            :status="is_invalid ? 'error' : 'default'"
            :aria-labelledby="label_id"
            @update:model-value="set(field.key, $event)"
          />
          <span v-if="is_invalid" class="policy-field__error" role="alert">
            {{ $t("policy.field.invalid_number") }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, useId } from "vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VDateInput from "@/components/VDateInput.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import VSwitch from "@/components/VSwitch.vue";
import VIcon from "@/components/VIcon.vue";
import {
  formatFieldValue,
  isChanged,
  isValidField,
  isVisible,
  unitWord
} from "../policy-config";
import { t } from "@/i18n";

const props = defineProps({
  // opis polja iz policy-config.js
  field: { type: Object, required: true },
  // vrijednosti sa servera, za "Izmenjeno" i "Bilo: ..."
  original: { type: Object, required: true },
  editing: { type: Boolean, default: false }
});

// cijela polisa, polje mijenja samo svoje ključeve
const form = defineModel("form", { type: Object, required: true });

const label_id = `${useId()}-label`;

const set = (key, value) => (form.value = { ...form.value, [key]: value });

const changed = computed(() => isChanged(props.field, form.value, props.original));

const is_invalid = computed(() => !isValidField(props.field, form.value[props.field.key]));

const has_value = computed(() => {
  const value = form.value[props.field.key];

  return value !== "" && value !== null && value !== undefined;
});

// polje je široko tačno koliko broj (ch = širina jedne cifre)
const value_width = computed(
  () => `${Math.max(String(form.value[props.field.key] ?? "").length, 1)}ch`
);

// klik bilo gdje u okviru ili na sufiks stavlja kursor u polje
function focusNumber(event) {
  if (event.target.closest(".v-input__field") && !event.target.closest("input, button")) {
    event.currentTarget.querySelector("input")?.focus();
  }
}

// hint vraća ključ prevoda (ili ništa)
const hint = computed(() => {
  const key = props.field.hint?.(form.value);

  return key ? t(key) : "";
});

// opcije iz konfiga imaju ključ umjesto teksta
const options = computed(() =>
  (props.field.options ?? []).map((option) => ({ ...option, label: t(option.label) }))
);

// uključeno je zeleno, isključeno i "bez ograničenja" sivo
const chip_class = computed(() => {
  const value = form.value[props.field.key];

  if (props.field.type === "switch") return value ? "is-on" : "is-off";
  if (props.field.type === "number" && (value === null || value === "")) return "is-off";

  return "";
});

const pad = (value) => String(value).padStart(2, "0");

// API čuva samo mjesec i dan, kalendar traži i godinu (tekuću)
const day_month = computed({
  get: () => {
    const [month_key, day_key] = props.field.keys ?? [];
    const month = form.value[month_key];
    const day = form.value[day_key];

    if (!month || !day) return "";

    return `${new Date().getFullYear()}-${pad(month)}-${pad(day)}`;
  },
  set: (value) => {
    const [month_key, day_key] = props.field.keys;
    const [, month, day] = value ? value.split("-").map(Number) : [];

    form.value = { ...form.value, [month_key]: month ?? null, [day_key]: day ?? null };
  }
});
</script>

<style scoped lang="scss">
.policy-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  align-items: center;
  gap: $space-8 $space-24;
  position: relative;
  padding: $space-14 $space-16;
  transition: background-color 0.2s ease;

  & + & {
    border-top: 1px solid $border-default;
  }

  // pozadina izmijenjenog reda prati zaobljene uglove okvira
  &:first-child {
    border-top-left-radius: calc(#{$radius-lg} - 1px);
    border-top-right-radius: calc(#{$radius-lg} - 1px);
  }

  &:last-child {
    border-bottom-left-radius: calc(#{$radius-lg} - 1px);
    border-bottom-right-radius: calc(#{$radius-lg} - 1px);
  }

  // zavisno polje je uvučeno ispod svog prekidača
  &.is-dependent {
    padding-left: $space-40;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 50%;
      left: $space-22;
      width: $space-10;
      border-bottom: 2px solid $border-default;
      border-left: 2px solid $border-default;
      border-bottom-left-radius: $radius-sm;
    }
  }

  & + &.is-dependent {
    border-top-style: dashed;
  }

  // izmijenjeno polje: traka u boji naglaska i blaga pozadina
  &.is-changed {
    background: $alpha-primary-5;
    box-shadow: inset 3px 0 0 $primary-500;
  }

  &.is-invalid {
    background: alpha($error-500, 0.05);
    box-shadow: inset 3px 0 0 $fg-error;
  }

  &__text {
    @include flex(flex-start, flex-start, $space-2, column);
    min-width: 0;
  }

  &__label {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__tag {
    padding: 0 $space-6;
    font-size: $text-10;
    font-weight: $weight-bold;
    line-height: $leading-xs;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__help {
    max-width: 34rem;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__was {
    margin-top: $space-2;
    font-size: $text-11;
    line-height: $leading-xs;
    color: $fg-muted;
  }

  &__value {
    @include flex(flex-start, flex-end, $space-4, column);
    min-width: 0;
    text-align: right;
  }

  // vrijednost u prikazu
  &__chip {
    @include flex(flex-start, center, $space-4);
    padding: $space-4 $space-10;
    font-size: $text-13;
    font-weight: $weight-bold;
    line-height: $leading-xs;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: color-mix(in srgb, var(--section-accent) 75%, #{$fg-heading});
    background: color-mix(in srgb, var(--section-accent) 12%, transparent);
    border-radius: $radius-pill;

    &.is-on {
      color: $fg-success;
      background: alpha($success-500, 0.1);
    }

    &.is-off {
      font-weight: $weight-semibold;
      color: $fg-body;
      background: $surface-sunken;
    }
  }

  &__hint {
    max-width: 16rem;
    font-size: $text-11;
    line-height: $leading-xs;
    color: $fg-muted;
  }

  &__switch {
    gap: 0;
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  &__date {
    width: 11rem;
  }

  &__number {
    @include flex(flex-start, flex-end, $space-4, column);
    width: 13rem;
    max-width: 100%;
  }

  &__error {
    font-size: $text-11;
    line-height: $leading-xs;
    color: $fg-error;
    text-align: right;
  }

  :deep(.v-input) {
    width: 100%;
  }

  :deep(.has-value .v-input__field) {
    gap: $space-4;
  }

  :deep(.has-value .v-input__control) {
    flex: 0 0 auto;
    width: calc(var(--value-width) + 2px);
  }

  // x ostaje uz desnu ivicu
  :deep(.has-value .v-input__actions) {
    margin-left: auto;
  }

  // bez strelica, broj dana se samo kuca
  :deep(input[type="number"]) {
    appearance: textfield;
    -moz-appearance: textfield;

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      margin: 0;
      -webkit-appearance: none;
    }
  }

  // usko: vrijednost ide ispod opisa (prekidač ostaje desno)
  @include respond-to("mobile") {
    gap: $space-8 $space-12;
    padding: $space-12;

    &.is-dependent {
      padding-left: $space-32;

      &::before {
        left: $space-16;
        width: $space-8;
      }
    }

    &__chip {
      white-space: normal;
      text-align: left;
    }

    &:not(:has(.policy-field__switch)) {
      grid-template-columns: minmax(0, 1fr);

      .policy-field__value {
        align-items: flex-start;
        text-align: left;
      }

      .policy-field__number,
      .policy-field__date {
        align-self: stretch;
        align-items: stretch;
        width: auto;
      }

      .policy-field__error {
        text-align: left;
      }
    }
  }
}
</style>
