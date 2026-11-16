<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'v-btn',
      `v-btn--${appearance}`,
      `v-btn--${color}`,
      `v-btn--${size}`,
      { 'v-btn--block': block }
    ]"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  appearance: {
    type: String,
    default: "filled",
    validator: (v) => ["filled", "outlined", "gradient", "text", "tonal"].includes(v)
  },

  size: {
    type: String,
    default: "medium",
    validator: (v) => ["large", "header", "medium", "small"].includes(v)
  },

  color: {
    type: String,
    default: "primary",
    validator: (v) =>
      ["primary", "neutral", "success", "error", "information", "warning"].includes(v)
  },
  type: {
    type: String,
    default: "button",
    validator: (v) => ["button", "submit", "reset"].includes(v)
  },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
});

const emit = defineEmits(["click"]);

function handleClick(event) {
  if (props.disabled) return;
  emit("click", event);
}
</script>

<style scoped lang="scss">
@use "sass:list";


@each $name, $c in $variants {
  .v-btn--#{$name} {
    --v-btn-color: #{list.nth($c, 1)};
    --v-btn-hover: #{list.nth($c, 2)};
    --v-btn-pressed: #{list.nth($c, 3)};
  }
}

// osnova, zajedničko za sve

.v-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-8;
  font-family: $font-family;
  font-weight: $weight-medium;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  user-select: none;
  transition: $transition;

  &:focus-visible {
    outline: none;
    border-color: $border-action-focused;
  }

  &:disabled {
    cursor: not-allowed;
  }

  &--large {
    height: $size-large;
    padding: 0 $space-16;
    font-size: $text-16;
  }

  &--header {
    height: $size-header;
    padding: 0 $space-12;
    font-size: $text-14;
  }
  &--medium {
    height: $size-medium;
    padding: 0 $space-14;
    font-size: $text-14;
  }
  &--small {
    height: $size-small;
    padding: 0 $space-10;
    font-size: $text-12;
  }

  &--block {
    display: flex;
    width: 100%;
  }

  // filled
  &--filled {
    background: var(--v-btn-color);
    color: $fg-on-action;

    &:hover:not(:disabled) {
      background: var(--v-btn-hover);
    }
    &:active:not(:disabled) {
      background: var(--v-btn-pressed);
    }

    &:disabled {
      background: $surface-disabled;
      color: rgba($white, 0.5);
    }
  }

  // outlined
  &--outlined {
    background: $surface-default;
    color: $fg-body;
    border-color: $border-default;

    &:hover:not(:disabled),
    &:active:not(:disabled) {
      background: color-mix(in srgb, var(--v-btn-color) 10%, $surface-default);
      border-color: var(--v-btn-color);
      color: $fg-heading;
    }

    &:focus-visible {
      color: $fg-heading;
      border-color: $border-action-focused;
    }

    &:disabled {
      color: $fg-action-disabled;
      border-color: $border-default;
    }
  }

  &--gradient {
    background: linear-gradient(135deg, var(--v-btn-pressed) 0%, var(--v-btn-color) 100%);
    color: $fg-on-action;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--v-btn-color) 0%, var(--v-btn-hover) 100%);
    }
    &:active:not(:disabled) {
      background: var(--v-btn-pressed);
    }

    &:disabled {
      background: $surface-disabled;
      color: rgba($white, 0.5);
    }
  }

  // tonal
  // svijetla pozadina u boji varijante
  &--tonal {
    background: color-mix(in srgb, var(--v-btn-color) 10%, transparent);
    color: var(--v-btn-color);
    font-weight: $weight-semibold;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--v-btn-color) 16%, transparent);
    }
    &:active:not(:disabled) {
      background: color-mix(in srgb, var(--v-btn-color) 22%, transparent);
    }

    &:disabled {
      opacity: 0.5;
    }
  }


  &--text {
    background: transparent;
    color: var(--v-btn-color);
    padding-left: 0;
    padding-right: 0;
    height: auto;

    &:hover:not(:disabled) {
      color: var(--v-btn-hover);
      text-decoration: underline;
    }
    &:focus-visible {
      border-color: transparent;
      text-decoration: underline;
    }

    &:disabled {
      color: $fg-action-disabled;
    }
  }
}
</style>
