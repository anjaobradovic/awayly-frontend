<template>
  <div class="v-progress-bar">
    <div
      class="v-progress-bar__track"
      role="progressbar"
      :aria-valuenow="value"
      aria-valuemin="0"
      :aria-valuemax="max"
      :aria-label="label || undefined"
    >
      <div class="v-progress-bar__fill" :style="{ width: `${percent}%` }" />
    </div>

    <!-- prvi broj podebljan, npr. 8/20 -->
    <p class="v-progress-bar__text">
      <strong>{{ value }}</strong>
      <span>/{{ max }}</span>
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, required: true },
  label: { type: String, default: "" }
});


const percent = computed(() => {
  if (props.max <= 0) return 0;

  return Math.min(100, Math.max(0, (props.value / props.max) * 100));
});
</script>

<style scoped lang="scss">
@layer components {
  .v-progress-bar {
    @include flex(flex-start, center, $space-8);
    width: 100%;

    &__track {
      flex: 1;
      min-width: 0;
      height: 6px;
      overflow: hidden;
      background: $alpha-primary-10;
      border-radius: $radius-sm;
    }
    &__fill {
      height: 100%;
      background: $surface-action;
      border-radius: $radius-sm;
      transition: width 0.3s ease-in-out;
    }

    &__text {
      display: flex;
      flex-shrink: 0;
      justify-content: flex-end;
      min-width: 2.125rem;
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-heading;
      white-space: nowrap;

      strong {
        font-weight: $weight-semibold;
      }
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .v-progress-bar__fill {
      transition: none;
    }
  }
}
</style>
