<template>
  <VDrawer v-model:open="is_open" :title="formatDayTitle(date)">
    <template #title>
      <div class="day-absences__head">
        <div class="day-absences__title">
          <h2 class="day-absences__date">{{ formatDayTitle(date) }}</h2>
          <span class="day-absences__weekday">{{ weekdayOf(date) }}</span>
        </div>

        <VDateNav
          :prev-label="$t('dashboard.absent.prev_day')"
          :next-label="$t('dashboard.absent.next_day')"
          :is-today="date === today"
          @prev="shift(-1)"
          @today="date = today"
          @next="shift(1)"
        />
      </div>
    </template>

    <div class="day-absences">
      <p class="day-absences__count">{{ $t("dashboard.absent.count", { count: people.length }) }}</p>

      <ul v-if="people.length" class="day-absences__list">
        <li v-for="person in people" :key="person.user_id">
          <AbsentRow :item="person" />
        </li>
      </ul>

      <p v-else class="day-absences__empty">{{ $t("dashboard.absent.empty_day") }}</p>
    </div>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.close") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VDateNav from "@/components/VDateNav.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import AbsentRow from "./AbsentRow.vue";
import { formatDayTitle, weekdayOf } from "../dashboard-config";
import { fromIso, toIso, todayIso } from "@/utils/calendar-date";

const props = defineProps({
  days: { type: Object, default: () => ({}) }
});

const is_open = defineModel("open", { type: Boolean, default: false });
const date = defineModel("date", { type: String, required: true });

const today = todayIso();

const people = computed(() => props.days[date.value] ?? []);

function shift(step) {
  const next = fromIso(date.value);

  next.setDate(next.getDate() + step);
  date.value = toIso(next);
}
</script>

<style scoped lang="scss">
.day-absences {
  @include flex(flex-start, stretch, $space-8, column);
  // poništava gornji razmak iz VDrawer
  margin-top: -$space-16;

  &__head {
    @include flex(flex-start, center, $space-36);
    flex-wrap: wrap;
  }

  &__title {
    @include flex(flex-start, flex-end, $space-8);
  }

  &__date {
    font-size: $text-20;
    font-weight: $weight-semibold;
    line-height: $leading-24;
    color: $fg-heading;
  }

  &__weekday {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__count {
    padding: $space-4 0;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__list {
    @include flex(flex-start, stretch, $space-8, column);
    list-style: none;
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
