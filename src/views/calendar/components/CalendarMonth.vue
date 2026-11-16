<template>
  <!-- mreža kalendara: zaglavlje sa danima i red po nedjelji -->
  <div class="calendar-month" role="grid" :aria-label="title">
    <div class="calendar-month__head" role="row">
      <span
        v-for="weekday in weekdays"
        :key="weekday.label"
        class="calendar-month__weekday"
        role="columnheader"
      >
        {{ weekday.label }}
      </span>
    </div>

    <div
      v-for="week in laid_out_weeks"
      :key="week.start"
      class="calendar-month__week"
      role="row"
    >
      <!-- pozadina i ivice dana, iza traka -->
      <div
        v-for="(iso, index) in week.days"
        :key="`cell-${iso}`"
        :class="['calendar-month__cell', cellClasses(iso, index)]"
        :style="{ gridColumn: index + 1 }"
        role="gridcell"
        :aria-label="longLabel(iso)"
      />

      <span
        v-for="(iso, index) in week.days"
        :key="`day-${iso}`"
        :class="['calendar-month__day', cellClasses(iso, index)]"
        :style="{ gridColumn: index + 1 }"
      >
        <span class="calendar-month__number">{{ dayLabel(iso) }}</span>
      </span>

      <CalendarEntry
        v-for="bar in week.bars"
        :key="`${bar.entry.id}-${week.start}`"
        class="calendar-month__bar"
        :class="{ 'has-gap-start': !bar.cut_start, 'has-gap-end': !bar.cut_end }"
        :style="{ gridColumn: `${bar.column} / span ${bar.span}`, gridRow: bar.lane + 2 }"
        :entry="bar.entry"
        :cut-start="bar.cut_start"
        :cut-end="bar.cut_end"
        @open="emit('open', $event)"
      />

      <!-- spisak skrivenih zahtjeva tog dana -->
      <template v-for="(iso, index) in week.days" :key="`more-${iso}`">
        <VDropdown
          v-if="week.hidden[iso].length"
          class="calendar-month__more"
          :style="{ gridColumn: index + 1 }"
          :label="$t('calendar.more_label', { date: longLabel(iso) })"
        >
          <template #trigger>
            {{ $t("calendar.more", { count: week.hidden[iso].length }) }}
          </template>

          <VMenu>
            <VMenuItem
              v-for="entry in week.hidden[iso]"
              :key="entry.id"
              :label="`${entry.employee} · ${entry.leave_type}`"
              @click="emit('open', entry)"
            />
          </VMenu>
        </VDropdown>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import CalendarEntry from "./CalendarEntry.vue";
import { fromIso, longLabel, monthNames, todayIso, weekdayNames } from "@/utils/calendar-date";
import { buildWeeks, layoutWeek } from "@/utils/calendar-layout";

// tri reda traka, ostalo ide u još N zahteva
const MAX_LANES = 3;

const props = defineProps({
  title: { type: String, default: "" },
  // prikazani mesec (calendar store, period) i pune nedelje oko njega (grid_period)
  period: { type: Object, required: true },
  gridPeriod: { type: Object, required: true },
  // već sortirano, ko ranije počinje ide gore
  entries: { type: Array, required: true },
  holidays: { type: Array, default: () => [] }
});

const emit = defineEmits(["open"]);

const today = todayIso();

const weekdays = computed(() => weekdayNames());

// praznik je jednodnevna traka; istog dana ide iznad zahteva
const holiday_entries = computed(() =>
  props.holidays.map((holiday) => ({
    id: `holiday-${holiday.date}-${holiday.name}`,
    kind: "holiday",
    employee: holiday.name,
    team: "",
    start_date: holiday.date,
    end_date: holiday.date
  }))
);

const all_entries = computed(() =>
  [...holiday_entries.value, ...props.entries].sort(
    (a, b) => a.start_date.localeCompare(b.start_date) || (b.kind === "holiday") - (a.kind === "holiday")
  )
);

const laid_out_weeks = computed(() =>
  buildWeeks(props.gridPeriod.from, props.gridPeriod.to).map((week) => ({
    ...week,
    ...layoutWeek(all_entries.value, week, MAX_LANES)
  }))
);

const cellClasses = (iso, index) => ({
  "is-outside": iso < props.period.from || iso > props.period.to,
  "is-today": iso === today,
  "is-sunday": index === 6
});

// prvi dan mjeseca piše i mjesec (1 Jun), ostali samo broj
const dayLabel = (iso) => {
  const date = fromIso(iso);
  return date.getDate() === 1 ? `1 ${monthNames("short")[date.getMonth()]}` : date.getDate();
};
</script>

<style scoped lang="scss">
.calendar-month {
  margin: $space-16;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xs;

  &__head,
  &__week {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  &__weekday {
    @include truncate;
    height: 2rem;
    padding: $space-8;
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
    background: $surface-table-head;
  }

  // broj dana, 3 reda traka i još N
  &__week {
    grid-template-rows: 1.5rem repeat(3, 1.5rem) 1.5rem;
    row-gap: $space-4;
    padding: $space-8 0;
    position: relative;
  }

  &__cell {
    grid-row: 1 / -1;
    // ćelija pokriva i padding nedelje
    margin: -$space-8 0;
    border-right: 1px solid $border-default;
    border-bottom: 1px solid $border-default;

    &:nth-child(7) {
      border-right: none;
    }

    &.is-sunday {
      background: $cold-25;
    }
  }

  &__day {
    grid-row: 1;
    z-index: 1;
    padding: $space-4 $space-8;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;

    &.is-outside {
      color: $fg-body;
      opacity: 0.6;
    }
  }

  &__number {
    display: inline-block;
  }

  // današnji dan u crvenom krugu
  &__day.is-today &__number {
    min-width: 1.25rem;
    margin: -$space-2 0;
    padding: $space-2 $space-4;
    font-weight: $weight-semibold;
    color: $fg-on-action;
    text-align: center;
    background: $surface-action;
    border-radius: $radius-pill;
  }

  &__bar {
    z-index: 1;
    width: auto;

    &.has-gap-start {
      margin-left: $space-8;
    }

    &.has-gap-end {
      margin-right: $space-8;
    }
  }

  &__more {
    grid-row: -2;
    z-index: 1;
    padding: 0 $space-8;

    :deep(.v-dropdown__trigger) {
      height: 1.5rem;
      padding: $space-4 0;
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
      background: none;

      &:hover {
        color: $fg-action;
      }
    }
  }
}
</style>
