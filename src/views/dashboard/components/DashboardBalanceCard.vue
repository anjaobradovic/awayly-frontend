<template>
  <!-- veliki broj, traka i legenda (godišnji i privatni poslovi) -->
  <DashboardCard class="dashboard-balance" :title="title">
    <div class="dashboard-balance__meter">
      <div class="dashboard-balance__value">
        <strong class="dashboard-balance__number">{{ remaining }}</strong>
        <span class="dashboard-balance__caption">{{ caption }}</span>
      </div>

      <!-- dijelovi trake jedan za drugim, širina je udio u ukupnom broju dana -->
      <div
        class="dashboard-balance__bar"
        role="img"
        :aria-label="caption"
      >
        <span
          v-for="segment in visible_segments"
          :key="segment.color"
          class="dashboard-balance__segment"
          :style="{ width: `${segment.percent}%`, background: resolveColor(segment.color) }"
        />
      </div>
    </div>

    <ul :class="['dashboard-balance__legend', { 'is-centered': centered }]">
      <li v-for="item in legend" :key="item.label" class="dashboard-balance__legend-item">
        <span class="dashboard-balance__swatch" :style="{ background: resolveColor(item.color) }" />
        {{ item.label }}
        <strong v-if="item.value !== undefined" class="dashboard-balance__legend-value">
          {{ item.value }}
        </strong>
      </li>
    </ul>
  </DashboardCard>
</template>

<script setup>
import { computed } from "vue";
import DashboardCard from "./DashboardCard.vue";
import { resolveColor } from "@/utils/color";
import { t } from "@/i18n";

const props = defineProps({
  title: { type: String, required: true },
  remaining: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  // obojeni dijelovi trake, ostatak je siv, color je token iz $colors
  segments: { type: Array, default: () => [] },
  // [{ label, color, value? }]
  legend: { type: Array, default: () => [] },
  // legenda privatnih poslova je na sredini, godišnjeg preko cijele širine
  centered: { type: Boolean, default: false }
});

const caption = computed(() =>
  t("dashboard.balance.caption", { remaining: props.remaining, count: props.total })
);

const visible_segments = computed(() =>
  props.segments
    .filter((segment) => segment.value > 0 && props.total > 0)
    .map((segment) => ({
      ...segment,
      percent: Math.min(100, (segment.value / props.total) * 100)
    }))
);
</script>

<style scoped lang="scss">
.dashboard-balance {
  justify-content: space-between;
  min-height: 12.25rem;

  &__meter {
    @include flex(flex-start, stretch, $space-4, column);
  }

  &__value {
    @include flex(flex-start, flex-end, $space-8);
  }

  &__number {
    font-size: $text-40;
    font-weight: $weight-semibold;
    line-height: $leading-xl;
    color: $fg-heading;
  }

  &__caption {
    padding: $space-4 0;
    font-size: $text-10;
    line-height: normal;
    color: $fg-body;
  }

  &__bar {
    @include flex(flex-start, stretch, $space-4);
    height: 6px;
    overflow: hidden;
    background: $cold-100;
    border-radius: $radius-sm;
  }

  &__segment {
    flex-shrink: 0;
    border-radius: $radius-sm;
  }

  &__legend {
    @include flex(space-between, center, $space-16);
    flex-wrap: wrap;
    padding: $space-12 0;
    list-style: none;

    &.is-centered {
      justify-content: center;
      gap: $space-36;
    }
  }

  &__legend-item {
    @include flex(flex-start, center, $space-4);
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    white-space: nowrap;
  }

  &__swatch {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-right: $space-4;
    border-radius: $radius-xs;
  }

  &__legend-value {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }
}
</style>
