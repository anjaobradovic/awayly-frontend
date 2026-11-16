<template>
  <!-- po jedna kartica za svaku grupu tipova odsustva, tipovi su čipovi za filter -->
  <div class="calendar-summary">
    <section
      v-for="group in groups"
      :key="group.key"
      class="calendar-summary__card"
      :style="{ '--summary-accent': resolveColor(group.accent) }"
    >
      <header class="calendar-summary__header">
        <span class="calendar-summary__icon" aria-hidden="true">
          <VIcon :name="GROUP_ICONS[group.key] ?? 'event'" :size="20" />
        </span>

        <h3 class="calendar-summary__title">{{ group.title }}</h3>

        <span class="calendar-summary__total" :title="$t('common.total')">
          {{ total(group) }}
        </span>
      </header>

      <div class="calendar-summary__chips">
        <button
          v-for="type in group.types"
          :key="type.name"
          type="button"
          :class="[
            'calendar-summary__chip',
            { 'is-selected': type.name === selected_source, 'is-empty': !type.count }
          ]"
          :aria-pressed="type.name === selected_source"
          @click="emit('select', type.name)"
        >
          <VIcon :name="type.icon" :size="16" />
          <span class="calendar-summary__label">{{ script(type.label) }}</span>
          <span class="calendar-summary__count">{{ type.count || 0 }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import { script } from "@/i18n";
import { resolveColor } from "@/utils/color";
import { leaveTypeSourceName } from "@/utils/leave-type-name";

const props = defineProps({
  // [{ key, title, accent, types: [{ name, label, icon, count }] }]
  groups: { type: Array, required: true },
  // tip po kom je kalendar filtriran, ili null
  selected: { type: String, default: null }
});

const emit = defineEmits(["select"]);

const GROUP_ICONS = {
  vacation: "beach_access",
  family: "favorite_border",
  paid: "payments",
  other: "more_horiz"
};

const total = (group) => group.types.reduce((sum, type) => sum + (type.count || 0), 0);

// izabrani tip može stići na bilo kom jeziku, poredimo srpske nazive
const selected_source = computed(() => props.selected && leaveTypeSourceName(props.selected));
</script>

<style scoped lang="scss">
.calendar-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $space-12;
  padding: $space-16 $space-16 $space-12;

  &__card {
    @include flex(flex-start, stretch, $space-12, column);
    position: relative;
    padding: $space-14 $space-16 $space-16;
    overflow: hidden;
    background:
      radial-gradient(
        120% 90% at 100% 0%,
        color-mix(in srgb, var(--summary-accent) 12%, transparent) 0%,
        transparent 60%
      ),
      $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;

    // tanka linija u boji grupe na vrhu
    &::before {
      content: "";
      position: absolute;
      inset: 0 0 auto;
      height: 3px;
      background: var(--summary-accent);
    }
  }

  &__header {
    @include flex(flex-start, center, $space-10);
  }

  &__icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    color: var(--summary-accent);
    background: color-mix(in srgb, var(--summary-accent) 16%, transparent);
    border-radius: 50%;
  }

  &__title {
    @include truncate;
    flex: 1;
    min-width: 0;
    font-size: $text-13;
    font-weight: $weight-bold;
    color: $fg-heading;
  }

  &__total {
    font-size: $text-24;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--summary-accent);
  }

  &__chips {
    @include flex(flex-start, center, $space-6);
    flex-wrap: wrap;
  }

  &__chip {
    @include flex(flex-start, center, $space-4);
    max-width: 100%;
    height: 1.875rem;
    padding: 0 $space-4 0 $space-8;
    font-family: inherit;
    font-size: $text-12;
    color: $fg-heading;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-pill;
    cursor: pointer;
    transition: $transition;

    :deep(.v-icon) {
      color: var(--summary-accent);
    }

    &:hover {
      border-color: var(--summary-accent);
      background: color-mix(in srgb, var(--summary-accent) 8%, #{$surface-default});
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 1px;
    }

    // tip bez zahtjeva je prigušen, ali i dalje klikabilan
    &.is-empty {
      color: $fg-body;
      opacity: 0.65;
    }

    // izabran filter: puna boja grupe
    &.is-selected {
      color: $white;
      background: var(--summary-accent);
      border-color: var(--summary-accent);
      opacity: 1;

      :deep(.v-icon) {
        color: $white;
      }
    }
  }

  &__label {
    @include truncate;
    min-width: 0;
  }

  &__count {
    @include flex(center, center);
    flex-shrink: 0;
    min-width: 1.375rem;
    height: 1.375rem;
    padding: 0 $space-6;
    font-size: $text-11;
    font-weight: $weight-bold;
    background: color-mix(in srgb, var(--summary-accent) 16%, transparent);
    border-radius: $radius-pill;
  }

  &__chip.is-selected &__count {
    background: alpha($white, 0.25);
  }

  @include respond-to("laptop-sm") {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include respond-to("tablet-sm") {
    grid-template-columns: minmax(0, 1fr);
    padding: $space-8 $space-8 $space-8;
  }
}
</style>
