<template>
  <div class="v-date-nav">
    <button type="button" class="v-date-nav__arrow" :aria-label="prevLabel || $t('ui.date_nav.prev')" @click="emit('prev')">
      <VIcon name="navigate_before" :size="20" />
    </button>
    <button type="button" class="v-date-nav__today" :disabled="isToday" @click="emit('today')">
      Danas
    </button>
    <button type="button" class="v-date-nav__arrow" :aria-label="nextLabel || $t('ui.date_nav.next')" @click="emit('next')">
      <VIcon name="navigate_next" :size="20" />
    </button>
  </div>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  prevLabel: { type: String, default: "" },
  nextLabel: { type: String, default: "" },
  isToday: { type: Boolean, default: false }
});

const emit = defineEmits(["prev", "today", "next"]);
</script>

<style scoped lang="scss">
.v-date-nav {
  display: flex;
  flex-shrink: 0;
  height: $size-header;

  &__arrow,
  &__today {
    @include flex(center, center);
    font-family: inherit;
    background: $surface-default;
    border: 1px solid $border-default;
    cursor: pointer;
    transition: $transition;

    &:focus-visible {
      position: relative;
      outline: 1px solid $border-action-focused;
      outline-offset: -1px;
    }
  }

  &__arrow {
    width: 2rem;
    color: $icon-default;

    &:first-child {
      border-radius: $radius-sm 0 0 $radius-sm;
    }

    &:last-child {
      border-radius: 0 $radius-sm $radius-sm 0;
    }

    &:hover {
      color: $fg-heading;
      background: $surface-default-hover;
    }
  }

  &__today {
    padding: $space-4 $space-12;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
    border-right: none;
    border-left: none;

    &:hover:not(:disabled) {
      background: $surface-default-hover;
    }

    &:disabled {
      color: $cold-350;
      background: $cold-50;
      cursor: default;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__arrow,
    &__today {
      transition: none;
    }
  }
}
</style>
