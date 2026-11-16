<template>
  <!-- stubići po mjesecima, prekidač Rad od kuće / Godišnji odmor -->
  <DashboardCard class="dashboard-chart" :title="title ?? $t('dashboard.chart.title')">
    <template #actions>
      <VSegmentedButton v-model="kind" :options="options" size="small" />
    </template>

    <div class="dashboard-chart__body">
      <!-- y osa i linije mreže -->
      <div class="dashboard-chart__axis" aria-hidden="true">
        <span
          v-for="tick in ticks"
          :key="tick"
          class="dashboard-chart__tick"
          :style="{ '--chart-p': tick / top }"
        >
          {{ tick }}
        </span>
      </div>

      <div class="dashboard-chart__plot">
        <span
          v-for="tick in ticks"
          :key="tick"
          class="dashboard-chart__line"
          :style="{ '--chart-p': tick / top }"
          aria-hidden="true"
        />

        <div v-for="(value, index) in values" :key="index" class="dashboard-chart__month">
          <span class="dashboard-chart__track">
            <span
              v-if="value"
              class="dashboard-chart__bar"
              :style="{ height: `${(value / top) * 100}%` }"
              :title="
                $t('dashboard.chart.bar', {
                  month: months[index],
                  days: $t('common.days', { count: value })
                })
              "
            />
          </span>
          <span class="dashboard-chart__label">{{ months[index] }}</span>
        </div>
      </div>
    </div>
  </DashboardCard>
</template>

<script setup>
import { computed, ref } from "vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import DashboardCard from "./DashboardCard.vue";
import { CHART_OPTIONS, shortMonth } from "../dashboard-config";
import { t } from "@/i18n";

const props = defineProps({
  // naslov se razlikuje na ličnom i timskom panelu
  title: { type: String, default: null },
  // { work_from_home: [12 brojeva], annual_leave: [12 brojeva] }
  graphs: { type: Object, required: true }
});

const kind = ref("work_from_home");

const options = computed(() =>
  CHART_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))
);

// skraćeni nazivi mjeseci na izabranom jeziku
const months = computed(() => Array.from({ length: 12 }, (_, index) => shortMonth(index)));

const values = computed(() => props.graphs[kind.value] ?? []);

// 6 podeoka, za veće brojeve korak raste
const step = computed(() => Math.max(2, Math.ceil(Math.max(0, ...values.value) / 5)));
const top = computed(() => step.value * 5);
const ticks = computed(() => Array.from({ length: 6 }, (_, index) => top.value - index * step.value));
</script>

<style scoped lang="scss">
// prostor iznad i ispod stubića za oznake
$chart-top: 8px;
$chart-bottom: 24px;

.dashboard-chart {
  flex: 1;
  padding: $space-12;

  &__body {
    display: grid;
    grid-template-columns: 1.375rem minmax(0, 1fr); // y osa
    flex: 1;
    min-height: 0;
  }

  &__axis,
  &__plot {
    position: relative;
  }

  // ista visina kao površina za stubiće
  &__tick,
  &__line {
    position: absolute;
    bottom: calc((100% - #{$chart-top + $chart-bottom}) * var(--chart-p) + #{$chart-bottom});
  }

  &__tick {
    right: 0;
    left: 0;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    text-align: center;
    transform: translateY(50%);
  }

  &__line {
    right: 0;
    left: 0;
    height: 1px;
    background: $cold-75;
  }

  &__plot {
    display: flex;
  }

  &__month {
    @include flex(flex-end, stretch, $space-8, column);
    flex: 1;
    min-width: 0;
    padding-top: $chart-top;
  }

  // stubić je oko 38% širine mjeseca, i na užem ekranu
  &__track {
    position: relative;
    flex: 1;
    margin: 0 31%;
  }

  &__bar {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    background: $primary-350;
    border-radius: $radius-sm $radius-sm 0 0;
  }

  &__label {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    text-align: center;
  }
}
</style>
