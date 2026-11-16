<template>
  <!-- otcjepni list kalendara: mjesec na traci u boji vrste, ispod veliki dan -->
  <span :class="['holiday-tile', `holiday-tile--${size}`]" aria-hidden="true">
    <span class="holiday-tile__month">{{ monthShort(span.start) }}</span>
    <span :class="['holiday-tile__day', { 'is-range': span.start !== span.end }]">
      {{ dayLabel(span) }}
    </span>
  </span>
</template>

<script setup>
import { dayLabel, monthShort } from "../holiday-dates";

defineProps({
  span: { type: Object, required: true },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["medium", "large"].includes(value)
  }
});
</script>

<style scoped lang="scss">
.holiday-tile {
  @include flex(flex-start, stretch, 0, column);
  flex-shrink: 0;
  width: 3.5rem;
  overflow: hidden;
  text-align: center;
  background: $surface-default;
  border: 1px solid color-mix(in srgb, var(--kind, #{$primary-500}) 35%, #{$border-default});
  border-radius: $radius-md;
  box-shadow: 0 6px 14px -10px var(--kind, #{$primary-500});

  &__month {
    padding: $space-2 0;
    font-size: $text-10;
    font-weight: $weight-bold;
    line-height: $leading-xxs;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--on-kind, #{$white});
    background: var(--kind, #{$primary-500});
  }

  &__day {
    @include flex(center, center);
    flex: 1;
    min-height: 2.25rem;
    font-size: $text-22;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    color: $fg-heading;

    &.is-range {
      font-size: $text-16;
    }
  }

  &--large {
    width: 5.5rem;
    border-radius: $radius-lg;

    .holiday-tile__month {
      padding: $space-4 0;
      font-size: $text-12;
    }

    .holiday-tile__day {
      min-height: 4rem;
      font-size: $text-40;

      &.is-range {
        font-size: $text-26;
      }
    }
  }
}
</style>
