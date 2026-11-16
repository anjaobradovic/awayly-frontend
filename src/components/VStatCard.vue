<template>
  <section class="v-stat-card" :style="card_style">
    <h3 class="v-stat-card__title">{{ title }}</h3>
    <div class="v-stat-card__body">
      <slot />
      <div v-if="$slots.action" class="v-stat-card__action">
        <slot name="action" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { resolveColor } from "@/utils/color";
const props = defineProps({
  title: { type: String, required: true },
  accent: { type: String, default: "primary" },
  columns: {
    type: Number,
    default: 2,
    validator: (v) => v >= 1 && v <= 4
  }
});
const card_style = computed(() => ({
  "--v-stat-accent": resolveColor(props.accent),
  "--v-stat-columns": props.columns
}));
</script>

<style scoped lang="scss">
@layer components {
  .v-stat-card {
    @include flex(flex-start, stretch, $space-16, column);
    height: 100%;
    padding: $space-12;
    background-image: linear-gradient(
      90deg,
      color-mix(in srgb, var(--v-stat-accent) 3%, #{$surface-default}) 0%,
      #{$surface-default} 100%
    );
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    &__title {
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-body;
      text-transform: uppercase;
    }
    &__body {
      display: grid;
      grid-template-columns: repeat(var(--v-stat-columns, 2), minmax(0, 1fr));
      align-items: center;
      gap: $space-16 $space-32;
    }
    &__action {
      justify-self: end;
    }
    @include respond-to("tablet-sm") {
      &__body {
        grid-template-columns: minmax(0, 1fr);
      }
      &__action {
        justify-self: start;
      }
    }
  }
}
</style>
