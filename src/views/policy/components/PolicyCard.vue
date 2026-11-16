<template>
  <!-- grupa povezanih redova unutar odeljka, sa malim podnaslovom -->
  <div class="policy-card">
    <h3 v-if="title" class="policy-card__title">
      <VIcon v-if="icon" :name="icon" :size="16" />
      {{ title }}
    </h3>

    <div class="policy-card__rows">
      <slot />
    </div>
  </div>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  // bez naslova grupa je samo okvir oko redova
  title: { type: String, default: "" },
  // ime Material ikone, npr. beach_access
  icon: { type: String, default: "" }
});
</script>

<style scoped lang="scss">
.policy-card {
  @include flex(flex-start, stretch, $space-8, column);
  min-width: 0;

  &__title {
    @include flex(flex-start, center, $space-6);
    padding: 0 $space-4;
    font-size: $text-11;
    font-weight: $weight-bold;
    line-height: $leading-xs;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $fg-muted;

    :deep(.v-icon),
    i {
      color: var(--section-accent);
    }
  }

  // redovi su u okviru sa linijama između (bez overflow, da kalendar ne bude odsečen)
  &__rows {
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }
}
</style>
