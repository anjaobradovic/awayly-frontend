<template>
  <label :class="['v-switch', { 'is-on': model, 'is-disabled': disabled }]">
    <span class="v-switch__label">
      <slot>{{ label }}</slot>
    </span>

    <input
      v-model="model"
      type="checkbox"
      role="switch"
      class="v-switch__input"
      :disabled="disabled"
    />

    <span class="v-switch__track" aria-hidden="true">
      <span class="v-switch__thumb" />
    </span>
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, default: "" },
  disabled: { type: Boolean, default: false }
});

const model = defineModel({ type: Boolean, default: false });
</script>

<style scoped lang="scss">
@layer components {
  .v-switch {
    position: relative;
    @include flex(space-between, center, $space-16);
    cursor: pointer;

    &__label {
      min-width: 0;
      font-size: $text-12;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }


    &__input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }
    &__track {
      position: relative;
      flex-shrink: 0;
      width: 2.5rem;
      height: 1.5rem;
      background: $true-500;
      border-radius: $radius-pill;
      transition: $transition;
    }


    &__thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 1.125rem;
      height: 1.125rem;
      background: $surface-default;
      border-radius: 50%;
      transition: $transition;
    }

    &.is-on &__track {
      background: $surface-action;
    }

    &.is-on &__thumb {
      transform: translateX(1rem);
    }

    &__input:focus-visible + &__track {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }

    &.is-disabled {
      cursor: default;
      opacity: 0.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .v-switch__track,
    .v-switch__thumb {
      transition: none;
    }
  }
}
</style>
