<template>
  <!-- pregled odsustva, nijansa pokazuje koliko je ljudi odsutno -->
  <section class="team-heatmap">
    <header class="team-heatmap__header">
      <div class="team-heatmap__controls">
        <h2 class="team-heatmap__title">{{ $t("dashboard.heatmap.title") }}</h2>

        <VSelect
          class="team-heatmap__type"
          size="header"
          leading-icon="layers"
          :model-value="leaveTypeId"
          :options="typeOptions"
          @update:model-value="emit('update:leaveTypeId', $event)"
        />

        <VSegmentedButton v-model="view" :options="view_options" />

        <VSelect
          :class="['team-heatmap__period', { 'is-quarter': view === 'quarter' }]"
          size="header"
          :model-value="period"
          :options="period_options"
          @update:model-value="selectPeriod"
        />
      </div>

      <div class="team-heatmap__legend" aria-hidden="true">
        {{ $t("dashboard.heatmap.less") }}
        <span class="team-heatmap__swatches">
          <span
            v-for="level in HEATMAP_LEVELS + 1"
            :key="level"
            :class="['team-heatmap__day', `is-level-${level - 1}`]"
          />
        </span>
        {{ $t("dashboard.heatmap.more") }}
      </div>
    </header>

    <div class="team-heatmap__scroll">
      <div
        :class="['team-heatmap__months', `team-heatmap__months--${view}`]"
        @mouseover="showCard"
        @mouseleave="hideCardSoon"
        @click="openDay"
      >
        <div v-for="month in months" :key="month.index" class="team-heatmap__month">
          <span class="team-heatmap__month-title">{{ longMonth(month.index) }}</span>

          <div class="team-heatmap__weeks">
            <div v-for="(week, row) in month.weeks" :key="row" class="team-heatmap__week">
              <span
                v-for="(cell, column) in week"
                :key="column"
                :class="[
                  'team-heatmap__day',
                  cell ? `is-level-${cell.level}` : 'is-empty',
                  { 'is-active': cell?.count }
                ]"
                :data-iso="cell?.count ? cell.iso : undefined"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="card"
        ref="card_ref"
        class="team-heatmap__card"
        role="tooltip"
        :style="{ left: `${card.left}px`, top: `${card.top}px` }"
        @mouseenter="cancelHide"
        @mouseleave="hideCardSoon"
      >
        <div class="team-heatmap__card-head">
          <strong class="team-heatmap__card-date">{{ formatDayTitle(card.iso) }}</strong>
          <span class="team-heatmap__card-count">
            {{ $t("dashboard.absent.count", { count: card.people.length }) }}
          </span>
        </div>

        <ul class="team-heatmap__card-list">
          <li
            v-for="person in card.people.slice(0, HEATMAP_PREVIEW)"
            :key="person.user_id"
            class="team-heatmap__card-item"
          >
            <span class="team-heatmap__card-name">{{ script(person.name) }}</span>
            <LeaveTypeChip :type="person.leave_type" plain />
          </li>
        </ul>

        <button
          v-if="card.people.length > HEATMAP_PREVIEW"
          type="button"
          class="team-heatmap__card-more"
          @click="openCardDay"
        >
          {{ $t("dashboard.view_all") }}
          <VIcon name="arrow_forward" :size="14" />
        </button>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import VIcon from "@/components/VIcon.vue";
import VSelect from "@/components/VSelect.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import LeaveTypeChip from "./LeaveTypeChip.vue";
import { toIso } from "@/utils/calendar-date";
import { t, script } from "@/i18n";
import {
  HEATMAP_LEVELS,
  HEATMAP_PREVIEW,
  HEATMAP_VIEWS,
  formatDayTitle,
  heatmapLevel,
  longMonth
} from "../dashboard-config";

const props = defineProps({
  year: { type: Number, required: true },
  days: { type: Object, default: () => ({}) },
  leaveTypeId: { type: Number, default: null },
  typeOptions: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:leaveTypeId", "update:year", "open-day"]);

const view = ref("year");

const view_options = computed(() =>
  HEATMAP_VIEWS.map((option) => ({ ...option, label: t(option.label) }))
);
const quarter = ref(Math.floor(new Date().getMonth() / 3));

// kvartal ima vrijednost tipa 2026-0
const QUARTERS = ["I", "II", "III", "IV"];
const YEARS = [-1, 0, 1].map((offset) => new Date().getFullYear() + offset);

const period = computed(() =>
  view.value === "year" ? props.year : `${props.year}-${quarter.value}`
);

const period_options = computed(() =>
  view.value === "year"
    ? YEARS.map((year) => ({ value: year, label: String(year) }))
    : YEARS.flatMap((year) =>
        QUARTERS.map((name, index) => ({
          value: `${year}-${index}`,
          label: t("dashboard.heatmap.quarter", { quarter: name, number: index + 1, year })
        }))
      )
);

function selectPeriod(value) {
  if (view.value === "year") {
    emit("update:year", value);
    return;
  }

  const [year, index] = String(value).split("-").map(Number);

  quarter.value = index;
  if (year !== props.year) emit("update:year", year);
}

const GAP = 8;
const EDGE = 8;

const card = ref(null);
const card_ref = ref(null);
let hide_timer = null;

const cancelHide = () => clearTimeout(hide_timer);

function hideCard() {
  cancelHide();
  card.value = null;
}

// da miš stigne do kartice
function hideCardSoon() {
  cancelHide();
  hide_timer = setTimeout(hideCard, 150);
}

async function showCard(event) {
  const cell = event.target.closest("[data-iso]");

  if (!cell) return hideCardSoon();

  cancelHide();

  const iso = cell.dataset.iso;

  if (card.value?.iso === iso) return;

  const rect = cell.getBoundingClientRect();

  card.value = { iso, people: props.days[iso] ?? [], left: -9999, top: -9999 };
  await nextTick();

  const box = card_ref.value?.getBoundingClientRect();

  if (!box || card.value?.iso !== iso) return;

  const center = rect.left + rect.width / 2;
  const above = rect.top - box.height - GAP;

  card.value.left = Math.min(
    Math.max(EDGE, center - box.width / 2),
    window.innerWidth - box.width - EDGE
  );
  card.value.top = above >= EDGE ? above : rect.bottom + GAP;
}

function openDay(event) {
  const iso = event.target.closest("[data-iso]")?.dataset.iso;

  if (!iso) return;

  hideCard();
  emit("open-day", iso);
}

function openCardDay() {
  const iso = card.value.iso;

  hideCard();
  emit("open-day", iso);
}

// kartica bi ostala na starom mjestu
onMounted(() => window.addEventListener("scroll", hideCard, true));
onBeforeUnmount(() => {
  cancelHide();
  window.removeEventListener("scroll", hideCard, true);
});

// mjesec po sedmicama od ponedjeljka, dani van mjeseca su prazni
const months = computed(() => {
  const indexes =
    view.value === "year"
      ? Array.from({ length: 12 }, (_, index) => index)
      : [0, 1, 2].map((offset) => quarter.value * 3 + offset);

  return indexes.map((index) => {
    const first = new Date(props.year, index, 1);
    const days_in_month = new Date(props.year, index + 1, 0).getDate();
    const cells = Array.from({ length: (first.getDay() + 6) % 7 }, () => null);

    for (let date = 1; date <= days_in_month; date += 1) {
      const iso = toIso(new Date(props.year, index, date));
      const count = props.days[iso]?.length ?? 0;

      cells.push({ iso, count, level: heatmapLevel(count) });
    }

    while (cells.length % 7) cells.push(null);

    return {
      index,
      weeks: Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7))
    };
  });
});
</script>

<style scoped lang="scss">
.team-heatmap {
  @include flex(flex-start, stretch, $space-12, column);
  padding: $space-12;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-sm;

  &__header {
    @include flex(space-between, center, $space-16);
    flex-wrap: wrap;
    padding: $space-4 0;
  }

  &__controls {
    @include flex(flex-start, center, $space-12);
    flex-wrap: wrap;
  }

  &__title {
    margin-right: $space-12;
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__type {
    width: 17.5rem;
  }

  &__period {
    width: 8.125rem;

    // tekst kvartala je duži
    &.is-quarter {
      width: 10rem;
    }
  }

  &__controls :deep(.v-select__field) {
    color: $fg-body;
  }

  &__legend {
    @include flex(flex-start, center, $space-10);
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__swatches {
    @include flex(flex-start, center, $space-8);

    .team-heatmap__day {
      flex: none;
      width: 16px;
      border-radius: $radius-sm;
    }
  }

  &__scroll {
    @include thin-scrollbar($primary);
    // mixin uključuje vertikalni skrol, ovdje treba samo horizontalni
    overflow-x: auto;
    overflow-y: hidden;
  }

  &__months {
    display: grid;
    // na užem ekranu dani se suze, pa tek onda skrol
    grid-template-columns: repeat(12, minmax(6.5rem, 1fr));

    &--quarter {
      grid-template-columns: repeat(3, minmax(6.5rem, 1fr));
    }
  }

  &__month {
    @include flex(flex-start, stretch, $space-4, column);
    min-width: 0;
    padding: 0 $space-2;
  }

  &__month-title {
    @include flex(center, center);
    height: 1.5rem;
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
    background: $surface-table-head;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
  }

  &__weeks {
    @include flex(flex-start, stretch, $space-4, column);
  }

  &__week {
    @include flex(flex-start, center, $space-4);
  }

  &__day {
    flex: 1;
    min-width: 0;
    height: 16px;
    border: 1px solid transparent;
    border-radius: $radius-xs;

    // nijanse boje akcenta, providne pa rade i na tamnoj pozadini
    &.is-level-0 {
      background: $cold-50;
      border-color: $border-default;
    }

    &.is-level-1 {
      background: alpha($primary-500, 0.2);
      border-color: alpha($primary-500, 0.25);
    }

    &.is-level-2 {
      background: alpha($primary-500, 0.45);
    }

    &.is-level-3 {
      background: alpha($primary-500, 0.75);
    }

    &.is-level-4 {
      background: $primary-500;
    }

    &.is-active {
      cursor: pointer;
    }
  }

  &__card {
    position: fixed;
    z-index: $z-tooltip;
    @include flex(flex-start, stretch, $space-8, column);
    width: 21.125rem;
    padding: $space-12;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
    box-shadow: $shadow-small;
  }

  &__card-head {
    @include flex(space-between, center, $space-8);
    padding: $space-4 0;
  }

  &__card-date {
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__card-count {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    white-space: nowrap;
  }

  &__card-list {
    @include flex(flex-start, stretch, $space-4, column);
    list-style: none;
  }

  &__card-item {
    @include flex(space-between, center, $space-8);
    padding: $space-4 $space-8;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__card-name {
    @include truncate;
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__card-more {
    @include flex(center, center, $space-2);
    align-self: flex-end;
    padding: 0;
    font-family: inherit;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    background: none;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:hover {
      color: $fg-heading;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }
  }
}
</style>
