<template>
  <!-- traka iznad kalendara: datum, navigacija, prikaz i statusi -->
  <div class="calendar-toolbar">
    <div class="calendar-toolbar__inner">
      <div class="calendar-toolbar__start">
        <div class="calendar-toolbar__period">
          <!-- današnji dan, kao list kalendara -->
          <div class="calendar-toolbar__today" :aria-label="$t('calendar.today_is', { date: longLabel(today) })">
            <span class="calendar-toolbar__today-month">{{ today_month }}</span>
            <span class="calendar-toolbar__today-day">{{ today_day }}</span>
          </div>

          <div class="calendar-toolbar__titles">
            <h2 class="calendar-toolbar__title" aria-live="polite">{{ title }}</h2>
            <p class="calendar-toolbar__range">{{ range }}</p>
          </div>
        </div>

        <VDateNav
          :prev-label="$t(view === 'month' ? 'calendar.prev_month' : 'calendar.prev_year')"
          :next-label="$t(view === 'month' ? 'calendar.next_month' : 'calendar.next_year')"
          :is-today="showsToday"
          @prev="emit('shift', -1)"
          @today="emit('today')"
          @next="emit('shift', 1)"
        />

        <VSegmentedButton v-model="view" :options="view_options" />
      </div>

      <VSegmentedButton v-model="status" :options="statusOptions" size="header" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import VDateNav from "@/components/VDateNav.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import { fromIso, longLabel, monthNames, todayIso } from "@/utils/calendar-date";
import { t } from "@/i18n";

defineProps({
  // "Jun 2026" ili "2026", već preveden u store-u
  title: { type: String, required: true },
  // "01 Jun - 30 Jun 2026"
  range: { type: String, required: true },
  showsToday: { type: Boolean, default: false },
  // [{ value, label: "Svi zahtevi (154)" }]
  statusOptions: { type: Array, required: true }
});

const view = defineModel("view", { type: String, required: true });
const status = defineModel("status", { type: String, required: true });

const emit = defineEmits(["shift", "today"]);

const view_options = computed(() => [
  { value: "month", label: t("calendar.views.month") },
  { value: "year", label: t("calendar.views.year") }
]);

const today = todayIso();
const today_month = computed(() =>
  monthNames("short")[fromIso(today).getMonth()].toLocaleUpperCase()
);
const today_day = computed(() => fromIso(today).getDate());
</script>

<style scoped lang="scss">
.calendar-toolbar {
  padding: 0 $space-16;

  &__inner {
    @include flex(space-between, center, $space-16);
    flex-wrap: wrap;
    padding: $space-12;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
  }

  &__start {
    @include flex(flex-start, center, $space-24);
    flex-wrap: wrap;
  }

  &__period {
    @include flex(flex-start, center, $space-12);
  }

  &__today {
    @include flex(flex-start, stretch, 0, column);
    overflow: hidden;
    text-align: center;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
  }

  &__today-month,
  &__today-day {
    padding: $space-4 $space-12;
  }

  &__today-month {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    border-bottom: 1px solid $border-default;
  }

  &__today-day {
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__titles {
    @include flex(flex-start, flex-start, $space-8, column);
  }

  &__title {
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__range {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    white-space: nowrap;
  }

  @include respond-to("tablet-sm") {
    padding: 0 $space-8;

    &__start {
      gap: $space-12;
    }
  }
}
</style>
