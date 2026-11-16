<template>
  <!-- jedno polje iz policy-config.js, tip bira koja komponenta se crta -->
  <div v-if="isVisible(field, form)" class="policy-field" @click="focusNumber">
    <VSelect
      v-if="field.type === 'select'"
      v-model="model"
      :label="$t(field.label)"
      :options="options"
    />

    <VCheckbox v-else-if="field.type === 'checkbox'" v-model="model" class="policy-field__checkbox">
      {{ $t(field.label) }}
    </VCheckbox>

    <!-- sufiks ide odmah iza broja, ne uz desnu ivicu -->
    <VBaseInput
      v-else
      v-model="model"
      :class="{ 'has-value': has_value }"
      :style="{ '--value-width': value_width }"
      type="number"
      appearance="outlined"
      :label="$t(field.label)"
      :required="field.required"
      :disabled="field.disabled"
      :placeholder="placeholder"
      :suffix="field.suffix ? $t(field.suffix) : ''"
      :status="is_invalid ? 'error' : 'default'"
      :supporting-text="is_invalid ? $t('policy.field.invalid_number') : ''"
    />

    <p v-if="hint" class="policy-field__hint">
      <VIcon name="info" :size="16" />
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VSelect from "@/components/VSelect.vue";
import VCheckbox from "@/components/VCheckbox.vue";
import VIcon from "@/components/VIcon.vue";
import { isValidField, isVisible } from "../policy-config";
import { t } from "@/i18n";

const props = defineProps({
  // opis polja iz policy-config.js
  field: { type: Object, required: true },
  // cijela polisa, samo za čitanje (visible / hint zavise od drugih polja)
  form: { type: Object, required: true }
});

// vrijednost baš ovog polja, roditelj piše v-model="form[field.key]"
const model = defineModel({ type: [String, Number, Boolean], default: null });

const has_value = computed(() => model.value !== "" && model.value !== null);

// polje je široko tačno koliko broj (ch = širina jedne cifre)
const value_width = computed(() => `${Math.max(String(model.value ?? "").length, 1)}ch`);

// klik bilo gdje u okviru ili na sufiks stavlja kursor u polje
function focusNumber(event) {
  if (event.target.closest(".v-input__field") && !event.target.closest("input, button")) {
    event.currentTarget.querySelector("input")?.focus();
  }
}

// hint vraća ključ prevoda (ili ništa)
const hint = computed(() => {
  const key = props.field.hint?.(props.form);

  return key ? t(key) : "";
});

// opcije iz konfiga imaju ključ umjesto teksta
const options = computed(() =>
  (props.field.options ?? []).map((option) => ({ ...option, label: t(option.label) }))
);

const placeholder = computed(() => {
  if (props.field.disabled) return t("policy.field.not_supported");

  return props.field.placeholder ? t(props.field.placeholder) : "";
});

const is_invalid = computed(
  () =>
    props.field.type === "number" &&
    !props.field.disabled &&
    !isValidField(props.field, model.value)
);
</script>

<style scoped lang="scss">
.policy-field {
  @include flex(flex-start, stretch, $space-4, column);

  // naslov polja manji nego u VBaseInput
  :deep(.v-input) {
    gap: $space-4;
  }

  :deep(.v-input__label) {
    font-size: $text-12;
    line-height: $leading-xs;
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

  // Dozvoljeni minus, red sa linijom ispod
  &__checkbox {
    padding: $space-8 0;
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
    border-bottom: 1px solid $border-default;
  }

  &__hint {
    @include flex(flex-start, center, $space-4);
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;
  }
}
</style>
