<template>
  <!-- 12 malih mjeseci, svaki uvijek 6 nedjelja; klik otvara mjesečni prikaz -->
  <div class="calendar-year">
    <section v-for="month in months" :key="month.index" class="calendar-year__month">
      <button type="button" class="calendar-year__title" @click="emit('pick', month.first)">
        {{ month_names[month.index] }}
      </button>

      <div class="calendar-year__grid">
        <button
          v-for="(day, index) in month.days"
          :key="day.iso"
          type="button"
          :class="[
            'calendar-year__day',
            {
              'is-outside': day.is_outside,
              'is-sunday': index % 7 === 6,
              'is-today': day.iso === today && !day.is_outside
            }
          ]"
          :title="day.count ? $t('calendar.day_requests', { date: longLabel(day.iso), count: day.count }) : ''"
          :tabindex="day.is_outside ? -1 : 0"
          @click="emit('pick', day.is_outside ? month.first : day.iso)"
        >
          {{ day.number }}
          <span v-if="day.count && !day.is_outside" class="calendar-year__dot" aria-hidden="true" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { longLabel, monthNames, toIso, todayIso } from "@/utils/calendar-date";

const props = defineProps({
  year: { type: Number, required: true },
  // sortirani zahtevi za celu godinu (calendar store, sorted_entries)
  entries: { type: Array, required: true }
});

const emit = defineEmits(["pick"]);

const today = todayIso();

// broj zahtjeva po danu, jedan prolaz kroz sve
const counts = computed(() => {
  const map = {};

  props.entries.forEach((entry) => {
    const date = new Date(`${entry.start_date}T00:00:00`);
    const end = new Date(`${entry.end_date}T00:00:00`);

    for (; date <= end; date.setDate(date.getDate() + 1)) {
      const iso = toIso(date);
      map[iso] = (map[iso] ?? 0) + 1;
    }
  });

  return map;
});

const month_names = computed(() => monthNames());

const months = computed(() =>
  Array.from({ length: 12 }, (_, index) => {
    const first = new Date(props.year, index, 1);
    // ponedeljak pre 1. u mesecu (nedelja počinje ponedeljkom)
    const start = new Date(props.year, index, 1 - ((first.getDay() + 6) % 7));

    return {
      index,
      first: toIso(first),
      // uvijek 6 redova, dani iz susjednih mjeseci su sivi
      days: Array.from({ length: 42 }, (_, offset) => {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
        const iso = toIso(date);

        return {
          iso,
          number: date.getDate(),
          is_outside: date.getMonth() !== index,
          count: counts.value[iso] ?? 0
        };
      })
    };
  })
);
</script>

<style scoped lang="scss">
.calendar-year {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: $space-24 $space-32;
  margin: $space-16;
  padding: $space-16;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xs;

  &__month {
    @include flex(flex-start, stretch, $space-4);
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    height: 1.5rem;
    padding: 0;
    font-family: inherit;
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
    text-align: center;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    cursor: pointer;
    transition: $transition;

    &:hover {
      color: $fg-action;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: $space-2;
  }

  &__day {
    position: relative;
    height: 2rem;
    padding: 0;
    font-family: inherit;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    cursor: pointer;
    transition: $transition;

    &:hover {
      background: $cold-125;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 1px;
    }

    &.is-sunday {
      background: $cold-75;

      &:hover {
        background: $cold-125;
      }
    }

    // dani iz susednih meseci: bez pozadine i okvira
    &.is-outside {
      color: $cold-350;
      background: none;
      border-color: transparent;
    }

    // današnji dan: crveni okvir i providna crvena pozadina
    &.is-today {
      font-weight: $weight-semibold;
      background: $alpha-primary-5;
      border-color: $border-action;

      &:hover {
        background: $alpha-primary-10;
      }
    }
  }

  // tačka u donjem lijevom uglu
  &__dot {
    position: absolute;
    top: 1.3125rem;
    left: calc(0.25rem - 1px);
    width: 6px;
    height: 6px;
    background: $primary-500;
    border-radius: 50%;
    pointer-events: none;
  }

  @include respond-to("laptop-sm") {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  @include respond-to("tablet-sm") {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (prefers-reduced-motion: reduce) {
    &__title,
    &__day {
      transition: none;
    }
  }
}
</style>
