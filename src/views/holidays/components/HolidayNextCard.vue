<template>
  <section class="holiday-next" :aria-label="eyebrow">
    <!-- sljedeći neradni dan -->
    <button
      v-if="span"
      type="button"
      :class="['holiday-next__hero', `is-${kindClass}`, { 'is-today': is_today }]"
      :aria-label="$t('holidays.details_for', { name: span.name })"
      @click="emit('details', span.holiday)"
    >
      <HolidayDateTile :span="span" size="large" />

      <span class="holiday-next__info">
        <span class="holiday-next__eyebrow">
          <VIcon :name="is_today ? 'celebration' : 'event'" :size="14" />
          {{ eyebrow }}
        </span>
        <span class="holiday-next__name">{{ script(span.name) }}</span>
        <span class="holiday-next__date">
          {{ weekdayLabel(span) }}, {{ fullDateLabel(span) }}
        </span>
        <span class="holiday-next__chips">
          <span class="holiday-next__countdown">
            <VIcon name="schedule" :size="14" />
            {{ countdownLabel(span) }}
          </span>
          <span class="holiday-next__kind">{{ holidayKindLabel(span.kind) }}</span>
          <span class="holiday-next__duration">
            {{ $t("common.days", { count: span.days }) }}
          </span>
        </span>
      </span>
    </button>

    <div v-else class="holiday-next__hero is-empty">
      <span class="holiday-next__empty-icon">
        <VIcon name="event_available" :size="28" />
      </span>
      <span class="holiday-next__info">
        <span class="holiday-next__name">{{ $t("holidays.next.none_title") }}</span>
        <span class="holiday-next__date">{{ $t("holidays.next.none_text", { year }) }}</span>
      </span>
    </div>

    <!-- brojke za cijelu godinu, bez obzira na tab i pretragu -->
    <dl class="holiday-next__stats" :aria-label="$t('holidays.stats.label')">
      <div
        v-for="stat in stats"
        :key="stat.key"
        :class="['holiday-next__stat', `is-${stat.key.toLowerCase()}`]"
      >
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import HolidayDateTile from "./HolidayDateTile.vue";
import { holidayKindLabel } from "@/stores/holidays";
import { countdownLabel, fullDateLabel, spanTiming, weekdayLabel } from "../holiday-dates";
import { script, t } from "@/i18n";

const props = defineProps({
  span: { type: Object, default: null },
  counts: { type: Object, required: true },
  year: { type: Number, required: true }
});

const emit = defineEmits(["details"]);

const kindClass = computed(() => String(props.span?.kind ?? "").toLowerCase());

const is_today = computed(() => !!props.span && spanTiming(props.span) === "today");

const eyebrow = computed(() =>
  t(is_today.value ? "holidays.next.eyebrow_today" : "holidays.next.eyebrow")
);

const stats = computed(() =>
  ["total", "NATIONAL", "RELIGIOUS", "COMPANY"].map((key) => ({
    key,
    label: t(`holidays.stats.${key}`),
    value: props.counts[key] ?? 0
  }))
);
</script>

<style scoped lang="scss">
.holiday-next {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: $space-12;

  &__hero {
    --kind: #{$primary-500};

    @include flex(flex-start, center, $space-20);
    position: relative;
    min-width: 0;
    padding: $space-20 $space-24;
    overflow: hidden;
    font-family: inherit;
    text-align: left;
    color: inherit;
    background:
      radial-gradient(
        120% 120% at 100% 0%,
        color-mix(in srgb, var(--kind) 14%, transparent) 0%,
        transparent 60%
      ),
      $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xl;
    box-shadow: $shadow-small;
    cursor: pointer;
    transition: $transition;

    // traka u boji vrste na vrhu
    &::before {
      content: "";
      position: absolute;
      inset: 0 0 auto;
      height: 3px;
      background: var(--kind);
    }

    &.is-national {
      --kind: #{$information-500};
    }

    &.is-religious {
      --kind: #{$absence-paid};
      // jantar je svijetao, bijeli tekst se na njemu ne čita
      --on-kind: #{shade($absence-paid, 72%)};
    }

    &.is-company {
      --kind: #{$primary-500};
    }

    &:not(.is-empty):hover {
      border-color: color-mix(in srgb, var(--kind) 45%, #{$border-default});
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }

    &.is-today {
      border-color: var(--kind);
    }

    &.is-empty {
      --kind: #{$cold-300};

      cursor: default;
    }
  }

  &__info {
    @include flex(flex-start, flex-start, $space-6, column);
    min-width: 0;
  }

  &__eyebrow {
    @include flex(flex-start, center, $space-4);
    font-size: $text-11;
    font-weight: $weight-bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--kind);
  }

  &__name {
    max-width: 100%;
    font-size: $text-24;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: $fg-heading;
    overflow-wrap: anywhere;
  }

  &__date {
    font-size: $text-13;
    line-height: $leading-sm;
    color: $fg-body;
  }

  &__chips {
    @include flex(flex-start, center, $space-6);
    flex-wrap: wrap;
    margin-top: $space-4;
  }

  &__countdown,
  &__kind,
  &__duration {
    @include flex(flex-start, center, $space-4);
    padding: $space-4 $space-10;
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    border-radius: $radius-pill;
  }

  &__countdown {
    font-weight: $weight-bold;
    color: var(--on-kind, #{$white});
    background: var(--kind);
  }

  &__kind {
    color: color-mix(in srgb, var(--kind) 80%, #{$fg-heading});
    background: color-mix(in srgb, var(--kind) 12%, transparent);
  }

  &__duration {
    color: $fg-body;
    background: $cold-25;
    border: 1px solid $border-default;
  }

  &__empty-icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 3.5rem;
    height: 3.5rem;
    color: $primary-500;
    background: $alpha-primary-10;
    border-radius: 50%;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(6.5rem, 1fr));
    gap: $space-8;
  }

  &__stat {
    --kind: #{$primary-500};

    @include flex(center, flex-start, $space-2, column-reverse);
    position: relative;
    padding: $space-10 $space-14 $space-10 $space-18;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;

    // tačka u boji vrste
    &::before {
      content: "";
      position: absolute;
      top: $space-14;
      bottom: $space-14;
      left: $space-8;
      width: 3px;
      background: var(--kind);
      border-radius: $radius-pill;
    }

    &.is-total {
      --kind: #{$cold-550};
    }

    &.is-national {
      --kind: #{$information-500};
    }

    &.is-religious {
      --kind: #{$absence-paid};
    }

    dt {
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
    }

    dd {
      font-size: $text-22;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      color: $fg-heading;
    }
  }

  @include respond-to("tablet") {
    grid-template-columns: minmax(0, 1fr);

    &__stats {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @include respond-to("mobile") {
    &__hero {
      gap: $space-14;
      padding: $space-16;
    }

    &__name {
      font-size: $text-20;
    }

    &__stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    :deep(.holiday-tile--large) {
      width: 4.25rem;

      .holiday-tile__day {
        min-height: 3rem;
        font-size: $text-30;

        &.is-range {
          font-size: $text-20;
        }
      }
    }
  }
}
</style>
