<template>
  <!-- jedna delegacija: ko kome delegira, period i status -->
  <article :class="['delegation-card', `is-${delegation.state}`]">
    <header class="delegation-card__top">
      <span class="delegation-card__status">
        {{ $t(`delegations.status.${delegation.state}`) }}
      </span>
      <span class="delegation-card__timing">{{ timing }}</span>

      <!-- meni je iznad dugmeta preko cijele kartice -->
      <VDropdown
        class="delegation-card__menu"
        :label="$t('delegations.actions_for', { name: delegation.delegated_by })"
      >
        <VMenu>
          <VMenuItem
            :label="$t(delegation.is_active ? 'common.actions.edit' : 'common.actions.details')"
            @click="emit('edit', delegation)"
          />
          <!-- API zna samo za otkazivanje, pa se nudi samo za aktivne -->
          <VMenuItem
            v-if="delegation.is_active"
            :label="$t('delegations.deactivate')"
            danger
            @click="emit('deactivate', delegation)"
          />
        </VMenu>
      </VDropdown>
    </header>

    <div class="delegation-card__people">
      <DelegationPerson
        :name="delegation.delegated_by"
        :role="$t('delegations.card.from')"
        :is-me="delegation.delegator_id === currentUserId"
      />
      <span class="delegation-card__arrow" :title="$t('delegations.card.arrow')">
        <VIcon name="arrow_forward" :size="16" />
      </span>
      <DelegationPerson
        :name="delegation.delegated_to"
        :role="$t('delegations.card.to')"
        :is-me="delegation.delegate_id === currentUserId"
      />
    </div>

    <footer class="delegation-card__period">
      <span class="delegation-card__dates">
        <VIcon name="date_range" :size="16" />
        {{ periodLabel(delegation.start_date, delegation.end_date) }}
      </span>
      <span class="delegation-card__days">
        {{ $t("common.days", { count: delegation.total_days }) }}
      </span>
    </footer>

    <!-- aktivne: koliko je perioda prošlo -->
    <span
      v-if="delegation.state === 'active'"
      class="delegation-card__meter"
      role="progressbar"
      :aria-valuenow="delegation.elapsed_days"
      aria-valuemin="0"
      :aria-valuemax="delegation.total_days"
      :aria-label="$t('delegations.hero.progress_label')"
    >
      <span :style="{ width: `${percent}%` }" />
    </span>

    <!-- klik na karticu otvara panel, kao nekad klik na red tabele -->
    <button
      type="button"
      class="delegation-card__open"
      :aria-label="
        $t('delegations.card.open', { from: delegation.delegated_by, to: delegation.delegated_to })
      "
      @click="emit('edit', delegation)"
    />
  </article>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import DelegationPerson from "./DelegationPerson.vue";
import { dateLabel, periodLabel } from "../delegation-dates";
import { t } from "@/i18n";

const props = defineProps({
  delegation: { type: Object, required: true },
  currentUserId: { type: Number, default: null }
});

const emit = defineEmits(["edit", "deactivate"]);

const percent = computed(() => (props.delegation.elapsed_days / props.delegation.total_days) * 100);

// kratak opis vremena uz status
const timing = computed(() => {
  const item = props.delegation;

  switch (item.state) {
    case "active":
      return item.days_left > 0
        ? t("delegations.card.days_left", { count: item.days_left })
        : t("delegations.card.ends_today");
    case "scheduled":
      return t("delegations.card.starts_in", { count: item.days_until });
    case "expired":
      return t("delegations.card.ended_ago", { count: item.days_since_end });
    default:
      return item.updated_at
        ? t("delegations.card.deactivated_on", { date: dateLabel(item.updated_at) })
        : "";
  }
});
</script>

<style scoped lang="scss">
.delegation-card {
  --state: #{$success-500};
  --state-fg: #{$fg-success};

  position: relative;
  display: grid;
  gap: $space-14;
  min-width: 0;
  height: 100%;
  padding: $space-14 $space-16 $space-16;
  overflow: hidden;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-lg;
  transition: $transition;

  &.is-scheduled {
    --state: #{$information-500};
    --state-fg: #{$fg-information};
  }

  &.is-expired,
  &.is-deactivated {
    --state: #{$cold-300};
    --state-fg: #{$fg-body};
  }

  // aktivne imaju traku u boji statusa lijevo
  &.is-active::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: var(--state);
  }

  &:hover {
    border-color: color-mix(in srgb, var(--state) 45%, #{$border-default});
    box-shadow: $shadow-small;
  }

  &:has(.delegation-card__open:focus-visible) {
    outline: 1px solid $border-action-focused;
    outline-offset: 2px;
  }

  // završene su prigušene
  &.is-expired,
  &.is-deactivated {
    background: color-mix(in srgb, #{$surface-default} 60%, transparent);

    .delegation-card__people,
    .delegation-card__period {
      opacity: 0.78;
    }
  }

  &__top {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
  }

  &__status {
    @include flex(flex-start, center, $space-6);
    flex-shrink: 0;
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-bold;
    line-height: $leading-xxs;
    color: var(--state-fg);
    background: color-mix(in srgb, var(--state) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--state) 30%, transparent);
    border-radius: $radius-pill;

    &::before {
      content: "";
      width: 0.375rem;
      height: 0.375rem;
      background: var(--state);
      border-radius: 50%;
    }
  }

  &.is-deactivated &__status::before {
    background: transparent;
    border: 1.5px solid var(--state);
  }

  &__timing {
    @include truncate;
    flex: 1;
    min-width: 0;
    font-size: $text-12;
    color: $fg-body;
  }

  &__menu {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
    margin: (-$space-4) (-$space-6) (-$space-4) 0;
  }

  &__people {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: $space-8;
  }

  &__arrow {
    @include flex(center, center);
    width: 1.75rem;
    height: 1.75rem;
    color: var(--state-fg);
    background: color-mix(in srgb, var(--state) 10%, transparent);
    border-radius: 50%;
  }

  &.is-expired &__arrow,
  &.is-deactivated &__arrow {
    color: $icon-default;
    background: $cold-25;
  }

  &__period {
    @include flex(space-between, center, $space-8);
    flex-wrap: wrap;
    padding-top: $space-12;
    border-top: 1px solid $border-default;
  }

  &__dates {
    @include flex(flex-start, center, $space-6);
    font-size: $text-13;
    font-weight: $weight-semibold;
    color: $fg-heading;

    .v-icon,
    :deep(.v-icon) {
      color: $icon-default;
    }
  }

  &__days {
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xxs;
    color: $fg-body;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-pill;
  }

  &__meter {
    display: block;
    height: 4px;
    margin-top: (-$space-4);
    overflow: hidden;
    background: color-mix(in srgb, var(--state) 14%, transparent);
    border-radius: $radius-pill;

    span {
      display: block;
      height: 100%;
      background: var(--state);
      border-radius: inherit;
    }
  }

  // nevidljivo dugme preko cijele kartice
  &__open {
    position: absolute;
    inset: 0;
    z-index: 1;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: inherit;
    cursor: pointer;

    &:focus-visible {
      outline: none;
    }
  }

  // usko: osobe jedna ispod druge, strelica nadolje
  @include respond-to("mobile") {
    &__people {
      grid-template-columns: minmax(0, 1fr);
      gap: $space-6;
    }

    &__arrow {
      width: 1.5rem;
      height: 1.5rem;
      margin-left: $space-6;
      transform: rotate(90deg);
    }
  }
}
</style>
