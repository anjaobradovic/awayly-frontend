<template>
  <span :class="['v-chip', `v-chip--${tone}`]">
    <VIcon v-if="icon" :name="icon" :size="18" filled />
    <slot />
    <button
      v-if="removable"
      type="button"
      class="v-chip__remove"
      :aria-label="removeLabel || $t('common.actions.remove')"
      @click="$emit('remove')"
    >
      <VIcon name="close" :size="14" />
    </button>
  </span>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  icon: { type: String, default: "" },
  tone: {
    type: String,
    default: "default",
    validator: (value) =>
      ["default", "action", "solid", "active", "inactive", "pending", "success", "error"].includes(value)
  },
  removable: { type: Boolean, default: false },
  removeLabel: { type: String, default: "" }
});

defineEmits(["remove"]);
</script>

<style scoped lang="scss">
@layer components {
  .v-chip {
    display: inline-flex;
    align-items: center;
    gap: $space-4;
    padding: $space-4 $space-8;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    white-space: nowrap;
    background: $cold-25;
    border: 1px solid $border-stroke;
    border-radius: $radius-lg;

    &--active,
    &--inactive,
    &--pending,
    &--success,
    &--error {
      padding-left: $space-4;
      border-radius: $radius-pill;
    }

    &--active {
      color: $teal-500;
      background: alpha($teal-500, 0.03);
      border-color: $teal-500;
    }
    &--action {
      color: $fg-action;
      background: $alpha-primary-5;
      border-color: $border-action;
    }
    &--inactive {
      color: $cold-600;
      background: alpha($true-500, 0.03);
      border-color: $true-350;
    }
    // zahtjev odobren ili odbijen
    &--success {
      color: $fg-success;
      background: alpha($success-500, 0.03);
      border-color: $border-success;
    }
    &--error {
      color: $fg-error;
      background: alpha($error-500, 0.03);
      border-color: $border-error;
    }
    &--pending {
      color: $fg-warning;
      background: alpha($warning-500, 0.03);
      border-color: $border-warning;
    }
    &--solid {
      height: 2rem;
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-on-action;
      background: $surface-action;
      border-color: $border-action;
      border-radius: $radius-sm;
    }

    &__remove {
      @include flex(center, center);
      padding: 0;
      color: inherit;
      background: transparent;
      border: none;
      cursor: pointer;

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }
  }
}
</style>
