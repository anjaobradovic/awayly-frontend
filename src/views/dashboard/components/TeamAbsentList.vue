<template>
  <DashboardCard class="team-absent" :title="$t('dashboard.absent.title')">
    <template #actions>
      <span class="team-absent__meta">
        {{ formatLongDate(today) }}
        <span aria-hidden="true">·</span>
        {{ $t("dashboard.absent.count", { count: items.length }) }}
      </span>
    </template>

    <ul v-if="items.length" class="team-absent__list">
      <li v-for="item in items" :key="`${item.user_id}-${item.start_date}`" class="team-absent__item">
        <AbsentRow :item="item" />
      </li>
    </ul>

    <p v-else class="team-absent__empty">{{ $t("dashboard.absent.empty") }}</p>
  </DashboardCard>
</template>

<script setup>
import DashboardCard from "./DashboardCard.vue";
import AbsentRow from "./AbsentRow.vue";
import { formatLongDate } from "../dashboard-config";
import { todayIso } from "@/utils/calendar-date";

defineProps({
  // [{ user_id, name, leave_type, start_date, end_date }]
  items: { type: Array, default: () => [] }
});

const today = todayIso();
</script>

<style scoped lang="scss">
.team-absent {
  gap: $space-8;
  min-height: 0;
  padding-bottom: 0;

  &__meta {
    @include flex(flex-start, center, $space-8);
    flex-shrink: 0;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    white-space: nowrap;
  }

  &__list {
    @include flex(flex-start, stretch, $space-8, column);
    flex: 1;
    min-height: 0;
    padding: 0 $space-4 $space-12 0;
    overflow-y: auto;
    list-style: none;
    @include thin-scrollbar($cold-225);
  }

  &__item {
    flex-shrink: 0;
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
