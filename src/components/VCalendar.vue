<template>
  <!-- mjesec i godina sa strelicama, pa mreža dana -->
  <div class="v-calendar">
    <div class="v-calendar__nav">
      <div v-for="step in STEPS" :key="step.months" class="v-calendar__step">
        <button
          type="button"
          class="v-calendar__arrow"
          :aria-label="$t(step.previous)"
          @click="shiftView(-step.months)"
        >
          <VIcon name="arrow_back_ios" :size="18" />
        </button>
        <span class="v-calendar__step-label" aria-live="polite">{{ step.label(view) }}</span>
        <button
          type="button"
          class="v-calendar__arrow"
          :aria-label="$t(step.next)"
          @click="shiftView(step.months)"
        >
          <VIcon name="arrow_forward_ios" :size="18" />
        </button>
      </div>
    </div>

    <div
      ref="grid_ref"
      :class="['v-calendar__grid', { 'is-muted-weekdays': mutedWeekdays }]"
      role="grid"
      @keydown="onGridKeydown"
    >
      <span
        v-for="(weekday, index) in WEEKDAYS"
        :key="index"
        class="v-calendar__weekday"
        role="columnheader"
        :aria-label="weekday.label"
      >
        {{ weekday.short }}
      </span>

      <button
        v-for="cell in cells"
        :key="cell.iso"
        type="button"
        role="gridcell"
        :data-iso="cell.iso"
        :class="['v-calendar__day', cell.classes]"
        :disabled="cell.is_disabled"
        :tabindex="cell.iso === focus_iso ? 0 : -1"
        :aria-selected="cell.is_picked"
        :aria-label="longLabel(cell.iso)"
        @click="pick(cell.iso)"
      >
        <span class="v-calendar__dot">{{ cell.day }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import VIcon from "@/components/VIcon.vue";
import {
  MONTHS,
  WEEKDAYS,
  fromIso,
  isOutsideLimits,
  isValidIso,
  longLabel,
  toIso,
  todayIso
} from "@/utils/calendar-date";

const props = defineProps({
  // jedan izabran dan (VDatePicker)
  selected: { type: String, default: "" },
  // period (VDateRangePicker), trake od rangeStart do rangeEnd
  rangeStart: { type: String, default: "" },
  rangeEnd: { type: String, default: "" },
  min: { type: String, default: "" },
  max: { type: String, default: "" },
  // dan od kog kalendar kreće (mesec koji se prikazuje i fokus za tastaturu)
  focusDate: { type: String, default: "" },
  // u kalendaru za period dani u nedjelji su sivi
  mutedWeekdays: { type: Boolean, default: false }
});

const emit = defineEmits(["pick"]);

const STEPS = [
  {
    months: 1,
    label: (view) => MONTHS[view.month],
    previous: "ui.calendar.prev_month",
    next: "ui.calendar.next_month"
  },
  {
    months: 12,
    label: (view) => view.year,
    previous: "ui.calendar.prev_year",
    next: "ui.calendar.next_year"
  }
];

const today = todayIso();

const view = ref({ year: 0, month: 0 });
const focus_iso = ref(today);
const grid_ref = ref(null);

function showMonthOf(iso) {
  const date = fromIso(iso);
  view.value = { year: date.getFullYear(), month: date.getMonth() };
}

watch(
  () => props.focusDate,
  (value) => {
    focus_iso.value = isValidIso(value) ? value : today;
    showMonthOf(focus_iso.value);
  },
  { immediate: true }
);

const has_range = computed(() => isValidIso(props.rangeStart));

const dayClasses = (iso, is_outside) => {
  const start = props.rangeStart;
  const end = isValidIso(props.rangeEnd) ? props.rangeEnd : start;
  const in_range = has_range.value && iso >= start && iso <= end;

  return {
    "is-outside": is_outside,
    "is-today": iso === today,
    "is-selected": iso === props.selected,
    "is-in-range": in_range,
    "is-range-start": in_range && iso === start,
    "is-range-end": in_range && iso === end
  };
};

// pune nedelje (5 ili 6 redova); dani susednih meseci su sivi, ali se mogu izabrati
const cells = computed(() => {
  const { year, month } = view.value;
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days_in_month = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((offset + days_in_month) / 7) * 7;

  return Array.from({ length: total }, (_, index) => {
    const date = new Date(year, month, index - offset + 1);
    const iso = toIso(date);
    const classes = dayClasses(iso, date.getMonth() !== month);

    return {
      iso,
      day: date.getDate(),
      classes,
      is_picked: classes["is-selected"] || classes["is-range-start"] || classes["is-range-end"],
      is_disabled: isOutsideLimits(iso, props.min, props.max)
    };
  });
});

function shiftView(months) {
  const date = new Date(view.value.year, view.value.month + months, 1);
  view.value = { year: date.getFullYear(), month: date.getMonth() };
}

function pick(iso) {
  focus_iso.value = iso;

  // klik na dan iz susednog meseca prebacuje kalendar na taj mesec
  if (fromIso(iso).getMonth() !== view.value.month) showMonthOf(iso);

  emit("pick", iso);
}

// tastatura: strelice pomeraju dan, PageUp/PageDown mesec, Home/End početak/kraj nedelje
const KEY_STEPS = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

async function onGridKeydown(event) {
  const date = fromIso(focus_iso.value);
  const weekday = (date.getDay() + 6) % 7;

  if (event.key in KEY_STEPS) date.setDate(date.getDate() + KEY_STEPS[event.key]);
  else if (event.key === "PageUp") date.setMonth(date.getMonth() - 1);
  else if (event.key === "PageDown") date.setMonth(date.getMonth() + 1);
  else if (event.key === "Home") date.setDate(date.getDate() - weekday);
  else if (event.key === "End") date.setDate(date.getDate() + 6 - weekday);
  else return;

  event.preventDefault();

  focus_iso.value = toIso(date);
  if (date.getMonth() !== view.value.month || date.getFullYear() !== view.value.year) {
    showMonthOf(focus_iso.value);
  }

  await nextTick();
  grid_ref.value?.querySelector(`[data-iso="${focus_iso.value}"]`)?.focus();
}
</script>

<style scoped lang="scss">
@layer components {
  .v-calendar {
    @include flex(flex-start, stretch, $space-12, column);

    &__nav {
      @include flex(space-between, center);
    }

    &__step {
      @include flex(center, center, $space-8);
    }

    &__arrow {
      @include flex(center, center);
      padding: 0;
      color: $fg-heading;
      background: transparent;
      border: none;
      border-radius: $radius-xs;
      cursor: pointer;

      &:hover {
        background: $cold-75;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }

    &__step-label {
      min-width: 2rem;
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
      text-align: center;
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(7, 2.25rem);
      grid-auto-rows: 2.25rem;
      justify-content: space-between;
    }

    &__weekday {
      @include flex(center, center);
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    &__grid.is-muted-weekdays &__weekday {
      color: $fg-body;
    }

    // dugme je pozadina perioda, a dot je krug za broj
    &__day {
      @include flex(center, center);
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      font-family: inherit;
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-heading;
      background: transparent;
      border: 1px solid transparent;
      border-radius: $radius-pill;
      cursor: pointer;
      transition: $transition;

      &:hover {
        background: $cold-25;
      }

      &:focus-visible {
        outline: none;
        background: $cold-75;
        border-color: $border-default;
      }

      &:active {
        background: $surface-default-pressed;
      }

      &.is-outside {
        color: $fg-body;
      }

      &.is-selected {
        background: $alpha-primary-20;
        border-color: $border-action;
      }

      // period: traka sa crvenom ivicom gore i dole, zaobljena na početku i kraju
      &.is-in-range {
        background: $alpha-primary-10;
        border-color: $border-action transparent;
        border-radius: 0;
      }

      &.is-range-start {
        border-left-color: $border-action;
        border-top-left-radius: $radius-pill;
        border-bottom-left-radius: $radius-pill;
      }

      &.is-range-end {
        border-right-color: $border-action;
        border-top-right-radius: $radius-pill;
        border-bottom-right-radius: $radius-pill;
      }

      &:disabled {
        color: $fg-body;
        opacity: 0.4;
        cursor: not-allowed;

        &:hover {
          background: transparent;
        }
      }
    }

    &__dot {
      @include flex(center, center);
      width: 100%;
      height: 100%;
      border-radius: $radius-pill;
    }

    // danas je pun crveni krug, u periodu manji, traka ostaje iza
    &__day.is-today &__dot {
      color: $fg-heading-inverse;
      background: $surface-action;
    }

    // danas je izabran ili u periodu: manji krug, pa se oko njega vidi izbor
    &__day.is-today.is-in-range &__dot,
    &__day.is-today.is-selected &__dot {
      width: 1.75rem;
      height: 1.75rem;
    }
  }
}
</style>
