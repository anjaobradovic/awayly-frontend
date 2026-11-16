<template>
  <section class="policy-group" :style="{ '--policy-accent': resolveColor(accent) }">
    <h2 class="policy-group__title">{{ title }}</h2>

    <div class="policy-group__list">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { resolveColor } from "@/utils/color";

defineProps({
  title: { type: String, required: true },
  accent: { type: String, required: true }
});
</script>

<style scoped lang="scss">
.policy-group {
  @include flex(flex-start, stretch, $space-12, column);
  min-height: 0;
  padding: $space-16 $space-12 0;

  &__title {
    flex-shrink: 0;
    padding: $space-12;
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
    background-image: linear-gradient(
      90deg,
      color-mix(in srgb, var(--policy-accent) 3%, transparent) 0%,
      transparent 100%
    );
    background-color: $surface-default;
    border-left: 2px solid var(--policy-accent);
    border-radius: $radius-xs;
    box-shadow:
      0 1px 0.5px rgba($black, 0.05),
      0 2px 5px rgba($black, 0.1);
  }

  &__list {
    @include flex(flex-start, stretch, $space-12, column);
    flex: 1;
    min-height: 0;
    padding-right: $space-8;
    padding-bottom: $space-12;
    @include thin-scrollbar($primary);
  }
}
</style>
