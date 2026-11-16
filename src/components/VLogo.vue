<template>
  <span :class="['v-logo', { 'v-logo--inverse': inverse }]" :style="{ '--v-logo-size': `${size}px` }">
    <!-- znak: sunce koje zalazi iza horizonta, boja prati akcenat -->
    <svg class="v-logo__mark" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <path d="M11 24a9 9 0 0 1 18 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" />
      <path d="M8 29h24" stroke="#fff" stroke-width="3" stroke-linecap="round" />
      <path d="M20 9.5v3M11 13.5l2 2M29 13.5l-2 2" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7" />
    </svg>

    <span v-if="!markOnly" class="v-logo__name">{{ APP_NAME }}</span>
  </span>
</template>

<script setup>
import { APP_NAME } from "@/config";

defineProps({
  size: { type: Number, default: 36 },
  markOnly: { type: Boolean, default: false },
  // svijetao tekst, za tamnu pozadinu
  inverse: { type: Boolean, default: false }
});
</script>

<style scoped lang="scss">
@layer components {
  .v-logo {
    @include flex(flex-start, center, calc(var(--v-logo-size) * 0.3));
    color: $primary-500;

    &__mark {
      flex-shrink: 0;
      width: var(--v-logo-size);
      height: var(--v-logo-size);
    }

    &__name {
      font-size: calc(var(--v-logo-size) * 0.72);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1;
      color: $fg-heading;
    }

    &--inverse &__name {
      color: $white;
    }
  }
}
</style>
