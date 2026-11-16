<template>
  <!-- bijela kartica sa naslovom i dugmetom desno -->
  <section class="dashboard-card">
    <header class="dashboard-card__header">
      <h2 class="dashboard-card__title">{{ title }}</h2>
      <slot name="actions" />
    </header>

    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
});
</script>

<style scoped lang="scss">
.dashboard-card {
  @include flex(flex-start, stretch, $space-16, column);
  min-width: 0;
  padding: $space-12 $space-16;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-sm;

  &__header {
    @include flex(space-between, center, $space-12);
    padding: $space-4 0;
  }

  &__title {
    min-width: 0;
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }
}
</style>
