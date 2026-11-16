<template>
  <button
    type="button"
    :class="['v-stat-item', { 'is-muted': is_muted }]"
    :style="accent_style"
    :disabled="is_muted"
    @click="emit('click', $event)"
  >
    <span class="v-stat-item__main">
      <span class="v-stat-item__icon material-icons-outlined" aria-hidden="true">{{ icon }} </span>
      <span class="v-stat-item__label">{{ label }}</span>
    </span>
    <span class="v-stat-item__count">{{ display_count }}</span>
  </button>
</template>

<script setup>
import { computed } from "vue";
import { resolveColor } from "@/utils/color";

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  count: { type: Number, default: null },
  accent: { type: String, default: "" }
});

const emit = defineEmits(["click"]);

const is_muted = computed(() => !props.count);
const display_count = computed(() => (is_muted.value ? "–" : props.count));
const accent_style = computed(() =>
  props.accent ? { "--v-stat-accent": resolveColor(props.accent) } : {}
);
</script>

<style scoped lang="scss">
$label-width: 10rem;
@layer components {
  .v-stat-item {
    @include flex(flex-start, center, $space-12);
    padding: 0;
    background: none;
    border: none;
    font-family: $font-family;
    text-align: left;
    cursor: pointer;
    transition: $transition;
    &:hover:not(:disabled) .v-stat-item__label {
      color: $fg-action;
    }
    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: $space-2;
      border-radius: $radius-xs;
    }

    &.is-muted {
      opacity: 0.4;
      cursor: default;
    }
    &__main {
      @include flex(flex-start, center, $space-10);
      width: $label-width;
    }
    &__icon {
      flex-shrink: 0;
      padding: $space-4;
      font-size: $text-20;
      line-height: 1;
      color: $fg-on-action;
      background: var(--v-stat-accent, #{$primary});
      border-radius: $radius-sm;
    }
    &__label {
      @include truncate;
      font-size: $text-14;
      font-weight: $weight-regular;
      line-height: $leading-18;
      color: $fg-heading;
      transition: $transition;
    }
    &__count {
      font-size: $text-20;
      font-weight: $weight-semibold;
      line-height: $leading-24;
      color: $fg-heading;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .v-stat-item,
    .v-stat-item__label {
      transition: none;
    }
  }
}
</style>
