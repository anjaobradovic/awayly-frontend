<template>
  <label :class="['v-checkbox', { 'is-checked': model, 'is-disabled': disabled }]">
    <span class="v-checkbox__content">
      <slot />
    </span>

    <input v-model="model" type="checkbox" class="v-checkbox__input" :disabled="disabled" />

    <span class="v-checkbox__box" aria-hidden="true">
      <VIcon v-if="model" name="check" :size="14" />
    </span>
  </label>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  disabled: { type: Boolean, default: false }
});

const model = defineModel({ type: Boolean, default: false });
</script>

<style scoped lang="scss">
@layer components {
  .v-checkbox {
    position: relative;
    @include flex(space-between, center, $space-16);
    cursor: pointer;

    &__content {
      min-width: 0;
    }

    &__input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
    }


    &__box {
      @include flex(center, center);
      flex-shrink: 0;
      width: 1.125rem;
      height: 1.125rem;
      margin: $space-6;
      color: $fg-action;
      border: 2px solid $icon-default;
      border-radius: $radius-xs;
      transition: $transition;
    }

    &.is-checked &__box {
      border-color: $border-action;
    }

    &__input:focus-visible + &__box {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }

    &.is-disabled {
      cursor: default;
    }

    &.is-disabled:not(.is-checked) &__box {
      border-color: $border-action-disabled;
    }
  }
}
</style>
