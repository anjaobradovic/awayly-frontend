<template>
  <div class="absent-row">
    <span class="absent-row__person">
      <strong class="absent-row__name">{{ script(item.name) }}</strong>
      <span class="absent-row__period">{{ formatLongPeriod(item.start_date, item.end_date) }}</span>
    </span>

    <LeaveTypeChip :type="item.leave_type" />
  </div>
</template>

<script setup>
import LeaveTypeChip from "./LeaveTypeChip.vue";
import { formatLongPeriod } from "../dashboard-config";
import { script } from "@/i18n";

defineProps({
  item: { type: Object, required: true }
});
</script>

<style scoped lang="scss">
.absent-row {
  @include flex(space-between, center, $space-8);
  padding: $space-8 $space-12;
  background: $cold-25;
  border: 1px solid $border-default;
  border-radius: $radius-lg;

  &__person {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    min-width: 0;
  }

  &__name {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__period {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }
}
</style>
