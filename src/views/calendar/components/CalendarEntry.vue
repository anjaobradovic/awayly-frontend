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
// traka je obojena bojom grupe (godišnji, porodica, plaćeno, ostalo) da se vidi i u tamnoj temi
.calendar-entry {
  --calendar-entry-tint: color-mix(in srgb, var(--calendar-entry-accent) 30%, #{$surface-default});

  @include flex(flex-start, center, $space-4);
  width: 100%;
  min-width: 0;
  height: 1.5rem;
  padding: $space-4 $space-8;
  font-family: inherit;
  font-size: $text-12;
  line-height: $leading-xs;
  color: $fg-heading;
  text-align: left;
  background: var(--calendar-entry-tint);
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: $transition;

  :deep(.v-icon),
  :deep(.material-icons-outlined) {
    color: var(--calendar-entry-accent);
  }

  &:hover {
    background: color-mix(in srgb, var(--calendar-entry-accent) 42%, #{$surface-default});
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
    color: $fg-body;
  }

  &--approved {
    border-left: 3px solid var(--calendar-entry-accent);
  }

  // na čekanju: svjetlija podloga i isprekidan okvir u boji grupe
  &--pending {
    background: color-mix(in srgb, var(--calendar-entry-accent) 14%, #{$surface-default});
    border: 1px dashed var(--calendar-entry-accent);
  }

  &--holiday {
    background: color-mix(in srgb, var(--calendar-entry-accent) 14%, transparent);
    border: 1px solid var(--calendar-entry-accent);
    cursor: default;

    &:hover {
      background: color-mix(in srgb, var(--calendar-entry-accent) 14%, transparent);
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
