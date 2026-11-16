<template>
  <button
    type="button"
    :class="[
      'calendar-entry',
      `calendar-entry--${tone}`,
      { 'is-cut-start': cutStart, 'is-cut-end': cutEnd }
    ]"
    :style="{ '--calendar-entry-accent': resolveColor(accent) }"
    :title="tooltip"
    @click="emit('open', entry)"
  >

    <VIcon v-if="icon" :name="icon" :size="16" />
    <span class="calendar-entry__name">{{ entry.employee }}</span>
    <span v-if="entry.team" class="calendar-entry__team">| {{ entry.team }}</span>
  </button>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import { resolveColor } from "@/utils/color";
import { REQUEST_GROUPS, groupKeyOf } from "@/views/requests/request-config";
import { longLabel } from "@/utils/calendar-date";
import { script } from "@/i18n";

const props = defineProps({
  // zahtjev iz calendar store-a ili praznik ({ kind: "holiday", employee: naziv })
  entry: { type: Object, required: true },
  cutStart: { type: Boolean, default: false },
  cutEnd: { type: Boolean, default: false }
});

const emit = defineEmits(["open"]);

const is_holiday = computed(() => props.entry.kind === "holiday");

// odobren
const tone = computed(() => {
  if (is_holiday.value) return "holiday";
  return props.entry.status === "APPROVED" ? "approved" : "pending";
});

const icon = computed(() => ({ approved: "check", pending: "watch_later" })[tone.value] ?? "");

const accent = computed(() => {
  if (is_holiday.value) return "absence-vacation";

  const key = groupKeyOf(props.entry.leave_type);
  return REQUEST_GROUPS.find((group) => group.key === key)?.accent ?? "absence-other";
});

const tooltip = computed(() => {
  if (is_holiday.value) return script(props.entry.employee);

  const { employee, leave_type, start_date, end_date } = props.entry;
  const period =
    start_date === end_date ? longLabel(start_date) : `${longLabel(start_date)} – ${longLabel(end_date)}`;

  return script(`${employee} · ${leave_type} · ${period}`);
});
</script>

<style scoped lang="scss">
.calendar-entry {
  @include flex(flex-start, center, $space-4);
  width: 100%;
  min-width: 0;
  height: 1.5rem;
  padding: $space-4 $space-8;
  font-family: inherit;
  font-size: $text-12;
  line-height: $leading-xs;
  color: var(--calendar-entry-accent);
  text-align: left;
  background: $cold-50;
  border: none;
  border-radius: $radius-xs;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background: $cold-100;
  }

  &:focus-visible {
    outline: 1px solid $border-action-focused;
    outline-offset: 1px;
  }


  &__name {
    @include truncate;
    flex-shrink: 1;
    font-weight: $weight-semibold;
  }

  &__team {
    @include truncate;
    flex-shrink: 100;
    min-width: 0;
  }

  &--approved {
    border-left: 4px solid var(--calendar-entry-accent);
  }


  &--pending {
    border: 1px dashed $cold-225;
    border-radius: $radius-sm;
  }

  &--holiday {
    background: color-mix(in srgb, var(--calendar-entry-accent) 10%, transparent);
    border: 1px solid var(--calendar-entry-accent);
    border-radius: $radius-sm;
    cursor: default;

    &:hover {
      background: color-mix(in srgb, var(--calendar-entry-accent) 10%, transparent);
    }
  }


  &.is-cut-start {
    border-left-style: none;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  &.is-cut-end {
    border-right-style: none;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}
</style>
