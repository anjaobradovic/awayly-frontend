<template>
  <article :class="['holiday-card', `is-${kindClass}`, `is-${timing}`]">
    <!-- klik na karticu otvara detalje, kao nekad klik na red tabele -->
    <button
      type="button"
      class="holiday-card__main"
      :aria-label="$t('holidays.details_for', { name: span.name })"
      @click="emit('details', span.holiday)"
    >
      <HolidayDateTile :span="span" />

      <span class="holiday-card__text">
        <span class="holiday-card__name">{{ script(span.name) }}</span>
        <span class="holiday-card__meta">
          <span>{{ weekdayLabel(span) }}</span>
          <span v-if="span.days > 1" class="holiday-card__dot">{{
            $t("common.days", { count: span.days })
          }}</span>
        </span>
        <span class="holiday-card__tags">
          <span class="holiday-card__kind">{{ holidayKindLabel(span.kind) }}</span>
          <span v-if="timing === 'today'" class="holiday-card__today">
            {{ $t("holidays.today_badge") }}
          </span>
          <span v-else-if="timing === 'past'" class="holiday-card__past">
            {{ $t("holidays.past_label") }}
          </span>
        </span>
      </span>

      <VIcon v-if="span.scope !== 'company'" class="holiday-card__chevron" name="chevron_right" />
    </button>

    <!-- kompanijski imaju meni, državni su read-only -->
    <VDropdown
      v-if="span.scope === 'company'"
      class="holiday-card__menu"
      :label="$t('holidays.actions_for', { name: span.name })"
    >
      <VMenu>
        <VMenuItem :label="$t('common.actions.details')" @click="emit('details', span.holiday)" />
        <VMenuItem :label="$t('common.actions.edit')" @click="emit('edit', span.holiday)" />
        <VMenuItem
          :label="$t('common.actions.delete')"
          danger
          @click="emit('delete', span.holiday)"
        />
      </VMenu>
    </VDropdown>
  </article>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import HolidayDateTile from "./HolidayDateTile.vue";
import { holidayKindLabel } from "@/stores/holidays";
import { spanTiming, weekdayLabel } from "../holiday-dates";
import { script } from "@/i18n";

const props = defineProps({
  span: { type: Object, required: true }
});

const emit = defineEmits(["details", "edit", "delete"]);

const kindClass = computed(() => String(props.span.kind ?? "").toLowerCase());

const timing = computed(() => spanTiming(props.span));
</script>

<style scoped lang="scss">
.holiday-card {
  --kind: #{$cold-550};

  @include flex(flex-start, center, $space-4);
  position: relative;
  min-width: 0;
  padding-right: $space-8;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-lg;
  transition: $transition;

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

  &:hover {
    border-color: color-mix(in srgb, var(--kind) 45%, #{$border-default});
    box-shadow: $shadow-small;
  }

  // prošli praznici su prigušeni, traka gubi boju
  &.is-past {
    background: color-mix(in srgb, #{$surface-default} 55%, transparent);

    :deep(.holiday-tile) {
      --kind: #{$cold-300};
      --on-kind: #{$white};

      box-shadow: none;
    }

    .holiday-card__name {
      color: $fg-body;
    }

    .holiday-card__text {
      opacity: 0.8;
    }
  }

  // današnji praznik: prsten u boji vrste i blagi preliv
  &.is-today {
    background:
      linear-gradient(100deg, color-mix(in srgb, var(--kind) 10%, transparent), transparent 70%),
      $surface-default;
    border-color: var(--kind);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--kind) 18%, transparent);
  }

  &__main {
    @include flex(flex-start, center, $space-12);
    flex: 1;
    min-width: 0;
    padding: $space-10 $space-4 $space-10 $space-10;
    font-family: inherit;
    text-align: left;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: $radius-lg;
    cursor: pointer;

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }
  }

  &__text {
    @include flex(flex-start, flex-start, $space-4, column);
    flex: 1;
    min-width: 0;
  }

  &__name {
    max-width: 100%;
    font-size: $text-14;
    font-weight: $weight-bold;
    line-height: $leading-sm;
    color: $fg-heading;
    overflow-wrap: anywhere;
  }

  &__meta {
    @include flex(flex-start, center, $space-6);
    flex-wrap: wrap;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__dot::before {
    content: "·";
    margin-right: $space-6;
  }

  &__tags {
    @include flex(flex-start, center, $space-6);
    flex-wrap: wrap;
    margin-top: $space-2;
  }

  &__kind,
  &__today,
  &__past {
    @include flex(flex-start, center, $space-4);
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xxs;
    border-radius: $radius-pill;
  }

  &__kind {
    color: color-mix(in srgb, var(--kind) 80%, #{$fg-heading});
    background: color-mix(in srgb, var(--kind) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--kind) 30%, transparent);

    &::before {
      content: "";
      width: 0.375rem;
      height: 0.375rem;
      background: var(--kind);
      border-radius: 50%;
    }
  }

  &__today {
    color: var(--on-kind, #{$white});
    background: var(--kind);
  }

  &__past {
    color: $fg-body;
    background: $cold-25;
    border: 1px solid $border-default;
  }

  &__chevron {
    flex-shrink: 0;
    color: $icon-default;
    transition: $transition;
  }

  &__main:hover &__chevron {
    color: var(--kind);
    transform: translateX(2px);
  }

  &__menu {
    flex-shrink: 0;
  }
}
</style>
