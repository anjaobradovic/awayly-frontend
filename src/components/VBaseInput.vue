<template>
  <div
    :class="[
      'v-input',
      `v-input--${appearance}`,
      `v-input--${size}`,
      `v-input--${status}`,
      { 'v-input--disabled': disabled, 'v-input--readonly': readonly }
    ]"
  >
    <!-- LABEL -->
    <label v-if="label" :for="inputId" class="v-input__label">
      {{ label }}
      <span v-if="optional" class="v-input__label-hint">({{ $t("common.optional") }})</span>
      <span v-if="required" class="v-input__label-required">*</span>
    </label>

    <!-- POLJE -->
    <div class="v-input__field">
      <span v-if="$slots.icon" class="v-input__icon">
        <slot name="icon" />
      </span>

      <input
        :id="inputId"
        v-model="model"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        class="v-input__control"
      />

      <span v-if="suffix && model !== '' && model !== null" class="v-input__suffix">
        {{ suffix }}
      </span>

      <!-- AKCIJE DESNO -->
      <div class="v-input__actions">
        <button
          v-if="clearable && model && !disabled && !readonly"
          type="button"
          class="v-input__action v-input__action--clear"
          :aria-label="$t('common.actions.clear')"
          @click="clear"
        >
          <span class="material-icons-outlined">close</span>
        </button>

        <button
          v-if="isPassword"
          type="button"
          class="v-input__action"
          :aria-label="showPassword ? $t('ui.input.hide_password') : $t('ui.input.show_password')"
          :disabled="disabled"
          @click="showPassword = !showPassword"
        >
          <span class="material-icons-outlined">
            {{ showPassword ? "visibility_off" : "visibility" }}
          </span>
        </button>
      </div>
    </div>

    <!-- SUPPORTING TEXT -->
    <p v-if="supportingText" class="v-input__support">
      <span class="material-icons-outlined">{{
        status === "error" ? "error_outline" : "check"
      }}</span>
      {{ supportingText }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, useId } from "vue";

const props = defineProps({
  label: { type: String, default: "" },
  optional: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  supportingText: { type: String, default: "" },
  suffix: { type: String, default: "" },
  type: {
    type: String,
    default: "text",
    validator: (v) => ["text", "email", "password", "number", "tel"].includes(v)
  },
  size: {
    type: String,
    default: "small",
    validator: (v) => ["small", "header", "large"].includes(v)
  },
  status: {
    type: String,
    default: "default",
    validator: (v) => ["default", "success", "error"].includes(v)
  },

  appearance: {
    type: String,
    default: "filled",
    validator: (v) => ["filled", "outlined"].includes(v)
  },
  autocomplete: { type: String, default: "off" },
  clearable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false }
});

// za type="number" vue sam pretvara unos u broj
const model = defineModel({ type: [String, Number], default: "" });

const inputId = useId();

const showPassword = ref(false);

const isPassword = computed(() => props.type === "password");
const inputType = computed(() => (isPassword.value && showPassword.value ? "text" : props.type));

function clear() {
  model.value = "";
}
</script>

<style scoped lang="scss">
.v-input {
  display: flex;
  flex-direction: column;
  gap: $space-6;
  width: 100%;
  font-family: $font-family;

  //Label
  &__label {
    font-size: $text-14;
    font-weight: $weight-semibold;
    color: $fg-heading;
  }
  &__label-hint {
    font-weight: $weight-regular;
    color: $fg-body;
  }
  &__label-required {
    color: $fg-heading;
    margin-left: $space-2;
  }

  // polje, okvir oko inputa i ikonica
  &__field {
    display: flex;
    align-items: center;
    gap: $space-8;
    padding: 0 $space-12;
    background: $surface-default;
    border: 1px solid $border-default;
    border-bottom-color: $cold-550;
    border-radius: $radius-sm $radius-sm 0 0;
    transition: $transition;

    &:hover {
      background: $surface-default-hover;
    }

    // Focus unutar (kad je input fokusiran, boji se ceo okvir)
    &:focus-within {
      border-color: $border-action-focused;
      border-bottom-width: 2px;
      background: $surface-default;
    }
  }

  &__icon {
    display: inline-flex;
    color: $icon-default;
    .material-icons-outlined {
      font-size: 20px;
    }
  }


  &__control {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    color: $fg-heading;

    &::placeholder {
      color: $fg-body;
    }
  }

  &__suffix {
    flex-shrink: 0;
    font-size: $text-14;
    color: $fg-body;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $space-4;
  }
  &__action {
    display: inline-flex;
    align-items: center;
    padding: $space-2;
    border: none;
    background: transparent;
    color: $icon-default;
    cursor: pointer;
    border-radius: $radius-xs;

    .material-icons-outlined {
      font-size: 20px;
    }

    &:hover {
      color: $fg-heading;
    }
    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
    &:disabled {
      cursor: not-allowed;
    }


    & + & {
      border-left: 1px solid $border-default;
      padding-left: $space-8;
      border-radius: 0;
    }
  }

  // x se vidi samo na hover ili fokus, visibility da ikonice ostanu na mjestu
  &__action--clear {
    visibility: hidden;
  }

  // crta izmedju x i sledece ikonice samo kad se x vidi
  &__action--clear + &__action {
    border-left-color: transparent;
  }

  &__field:hover &__action--clear,
  &__field:focus-within &__action--clear {
    visibility: visible;

    + .v-input__action {
      border-left-color: $border-default;
    }
  }


  &__support {
    display: flex;
    align-items: center;
    gap: $space-4;
    margin: 0;
    font-size: $text-12;
    color: $fg-body;

    .material-icons-outlined {
      font-size: 16px;
    }
  }

  &--outlined {
    .v-input__field {
      border-color: $border-default;
      border-radius: $radius-sm;

      &:focus-within {
        border-color: $border-action-focused;
        border-bottom-width: 1px;
      }
    }

    // DISABLED / READONLY
    &--disabled {
      .v-input__label,
      .v-input__support,
      .v-input__icon,
      .v-input__action {
        color: $fg-action-disabled;
      }

      .v-input__field {
        background: $surface-default;
        border-bottom-color: $border-action-disabled;
        &:hover {
          background: $surface-default;
        }
      }
      .v-input__control {
        color: $fg-action-disabled;
        cursor: not-allowed;
      }
    }

    &--readonly {
      .v-input__field {
        background: transparent;
        border-color: transparent;
        border-bottom-color: $border-default;
        padding-left: 0;
      }
    }
  }

 //STATUSI
  &--success {
    .v-input__field {
      border-bottom-color: $border-success;
    }
    .v-input__support {
      color: $fg-success;
    }
  }
  &--error {
    .v-input__field {
      border-bottom-color: $border-error;
    }
    .v-input__support {
      color: $fg-error;
    }
  }


  &--small {
    .v-input__field {
      height: $size-medium;
    }
    .v-input__control {
      font-size: $text-14;
    }
  }

  &--header {
    .v-input__field {
      height: $size-header;
    }
    .v-input__control {
      font-size: $text-14;
    }
  }
  &--large {
    .v-input__field {
      height: $size-large;
    }
    .v-input__control {
      font-size: $text-16;
    }
  }
}
</style>
