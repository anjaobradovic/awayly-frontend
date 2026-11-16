<template>
  <article class="policy-card">
    <header class="policy-card__header">
      <!-- pločica ikone uzima boju kolone (--policy-accent iz PolicyGroup) -->
      <span class="policy-card__icon" aria-hidden="true">
        <VIcon :name="icon" :size="20" />
      </span>
      <h3 class="policy-card__title">{{ title }}</h3>
    </header>

    <div class="policy-card__fields">
      <slot />
    </div>
  </article>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  title: { type: String, required: true },
  // ime Material ikone, npr. beach_access
  icon: { type: String, required: true }
});
</script>

<style scoped lang="scss">
.policy-card {
  @include flex(flex-start, stretch, $space-16, column);
  flex-shrink: 0;
  padding: $space-12;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xs;
  box-shadow:
    0 2px 5px rgba($black, 0.1),
    0 1px 0.5px rgba($black, 0.05);

  &__header {
    @include flex(flex-start, center, $space-10);
  }

  &__icon {
    @include flex(center, center);
    flex-shrink: 0;
    padding: $space-4;
    color: $fg-on-action;
    background: var(--policy-accent);
    border-radius: $radius-sm;
  }

  &__title {
    font-size: $text-14;
    font-weight: $weight-regular;
    line-height: $leading-18;
    color: $fg-heading;
  }

  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
  }
}
</style>
