<template>
  <!-- Ako postoji `to`, renderuje RouterLink, inače običan button -->
  <component
    :is="to ? RouterLink : 'button'"
    :to="to || undefined"
    :type="to ? undefined : 'button'"
    role="menuitem"
    :class="['v-menu-item', { 'is-active': active, 'is-danger': danger }]"
    @click="emit('click', $event)"
  >
    {{ label }}
  </component>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  label: { type: String, required: true },
  to: { type: [String, Object], default: null },
  active: { type: Boolean, default: false },
  danger: { type: Boolean, default: false }
});
const emit = defineEmits(["click"]);
</script>

<style scoped lang="scss">
@layer components {
  .v-menu-item {
    display: block;
    width: 100%;
    padding: $space-12;
    font-size: $text-12;
    font-weight: $weight-regular;
    line-height: $leading-xs;
    color: $fg-heading;
    text-align: left;
    white-space: nowrap;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: $transition;

    &:hover {
      background: $surface-default-hover;
    }
    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: -1px;
    }
    &.is-danger {
      color: $fg-action;
    }

    &.is-active {
      font-weight: $weight-semibold;
      color: $fg-action;
      background: $alpha-primary-5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .v-menu-item {
      transition: none;
    }
  }
}
</style>
