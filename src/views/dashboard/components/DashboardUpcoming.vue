<template>
  <!-- najviše 4 nadolazeća odobrena odsustva, Vidi sve vodi na Moje zahteve -->
  <DashboardCard class="dashboard-upcoming" :title="$t('dashboard.upcoming.title')">
    <template #actions>
      <button type="button" class="dashboard-upcoming__all" @click="emit('all')">
        {{ $t("dashboard.view_all") }}
        <VIcon name="arrow_forward" :size="14" />
      </button>
    </template>

    <ul v-if="items.length" class="dashboard-upcoming__list">
      <li v-for="item in items" :key="item.id" class="dashboard-upcoming__item">
        <LeaveTypeChip :type="item.leave_type" />

        <div class="dashboard-upcoming__dates">
          <span class="dashboard-upcoming__label">{{ $t("dashboard.upcoming.request_date") }}</span>
          <span class="dashboard-upcoming__period">
            <VIcon name="calendar_month" :size="16" />
            <span>{{ periodOf(item).from }}</span>
            <template v-if="periodOf(item).to">
              <span class="dashboard-upcoming__dash">-</span>
              <span>{{ periodOf(item).to }}</span>
            </template>
          </span>
        </div>

        <button type="button" class="dashboard-upcoming__details" @click="emit('details', item.id)">
          {{ $t("dashboard.view_details") }}
          <VIcon name="arrow_forward" :size="14" />
        </button>
      </li>
    </ul>

    <p v-else class="dashboard-upcoming__empty">{{ $t("dashboard.upcoming.empty") }}</p>
  </DashboardCard>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";
import DashboardCard from "./DashboardCard.vue";
import LeaveTypeChip from "./LeaveTypeChip.vue";
import { formatPeriod } from "../dashboard-config";

defineProps({
  // upcoming iz dashboard store-a
  items: { type: Array, default: () => [] }
});

const emit = defineEmits(["all", "details"]);

const periodOf = (item) => formatPeriod(item.start_date, item.end_date);
</script>

<style scoped lang="scss">
.dashboard-upcoming {
  padding-bottom: $space-16;

  &__all,
  &__details {
    @include flex(center, center, $space-2);
    flex-shrink: 0;
    padding: 0;
    font-family: inherit;
    font-size: $text-14;
    line-height: $leading-18;
    background: none;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }
  }

  &__all {
    color: $fg-action;

    &:hover {
      color: $fg-action-hover;
    }
  }

  &__details {
    align-self: flex-start;
    color: $fg-body;

    &:hover {
      color: $fg-heading;
    }
  }

  // kartice zadrže svoju visinu i kad ih je manje od 4
  &__list {
    display: grid;
    grid-template-rows: repeat(4, minmax(0, 1fr));
    flex: 1;
    gap: $space-12;
    list-style: none;
  }

  &__item {
    @include flex(center, flex-start, $space-16, column);
    min-width: 0;
    padding: $space-8 $space-12;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__dates {
    @include flex(flex-start, stretch, $space-8, column);
    width: 100%;
  }

  &__label {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__period {
    @include flex(flex-start, center, $space-4);
    flex-wrap: wrap;
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__dash {
    font-size: $text-12;
    font-weight: $weight-regular;
  }

  &__empty {
    padding: $space-24 0;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    text-align: center;
  }
}
</style>
