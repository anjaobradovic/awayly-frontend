<template>
  <div :class="['v-notice', `v-notice--${tone}`]" role="status">
    <VIcon v-if="tone === 'info'" name="info" :size="20" filled class="v-notice__info-icon" />
    <VIcon v-else name="error" :size="20" color="warning" filled />
    <p class="v-notice__text">
      <slot />
    </p>
    <!-- obavještenje se može skloniti -->
    <button
      v-if="closable"
      type="button"
      class="v-notice__close"
      :aria-label="$t('ui.notice.close')"
      @click="emit('close')"
    >
      <VIcon name="close" :size="20" />
    </button>
  </div>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  tone: {
    type: String,
    default: "warning",
    validator: (value) => ["warning", "info"].includes(value)
  },
  closable: { type: Boolean, default: false }
});

const emit = defineEmits(["close"]);
</script>

<style scoped lang="scss">
@layer components {
  .v-notice {
    @include flex(flex-start, center, $space-8);
    padding: $space-8;
    border: 1px solid;
    border-radius: $radius-lg;

    &--warning {
      background: $alpha-orange;
      border-color: $alpha-primary-10;
    }

    &--info {
      background: $cold-25;
      border-color: $border-default;
    }

    &__info-icon {
      color: $cold-350;
    }

    &__text {
      flex: 1;
      min-width: 0;
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    &__close {
      @include flex(center, center);
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.125rem; // red ne raste zbog dugmeta
      padding: 0;
      margin-left: $space-8;
      color: $icon-default;
      background: transparent;
      border: none;
      border-radius: $radius-sm;
      cursor: pointer;
      transition: $transition;

      &:hover {
        color: $fg-heading;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }
  }
}
</style>
