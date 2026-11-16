<template>
  <div class="team-dashboard">
    <SubmitRequestButton @submitted="team_store.selectTeam(team_store.team_id)" />

    <div class="team-dashboard__header">
      <VPageHeader :title="$t('dashboard.title')" :description="$t('dashboard.description')">
        <template #actions>
          <!-- izbor tima i zaposlenog -->
          <VSelect
            class="team-dashboard__select"
            size="header"
            leading-icon="groups"
            :placeholder="$t('dashboard.select_team')"
            :model-value="team_store.team_id"
            :options="team_store.team_options"
            @update:model-value="team_store.selectTeam"
          />

          <VSelect
            class="team-dashboard__select"
            size="header"
            leading-icon="person"
            :model-value="team_store.member_id"
            :options="team_store.member_options"
            @update:model-value="team_store.selectMember"
          />
        </template>
      </VPageHeader>
    </div>

    <VTabs v-model="tab" :tabs="tabs" />

    <div class="team-dashboard__body">
      <p v-if="message" class="team-dashboard__message">{{ message }}</p>

      <template v-else>
        <TeamHeatmap
          :year="team_store.heatmap.year"
          :days="team_store.absences_by_day"
          :leave-type-id="team_store.heatmap.leave_type_id"
          :type-options="team_store.leave_type_options"
          @update:year="team_store.setHeatmapYear"
          @update:leave-type-id="team_store.setHeatmapType"
          @open-day="openDay"
        />

        <div class="team-dashboard__grid">
          <div class="team-dashboard__column">
            <DashboardRequestStats
              class="team-dashboard__stats"
              :pending="team_store.requests.pending"
              :approved="team_store.requests.approved"
              @details="router.push({ name: 'requests' })"
            />

            <TeamAbsentList class="team-dashboard__absent" :items="team_store.visible_absent" />
          </div>

          <DashboardMonthlyChart
            :title="$t('dashboard.chart.absence_title')"
            :graphs="team_store.graphs"
          />

          <TeamUtilization :items="team_store.utilization" />
        </div>
      </template>
    </div>

    <DayAbsencesDrawer
      v-model:open="day_open"
      v-model:date="day"
      :days="team_store.absences_by_day"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import VPageHeader from "@/components/VPageHeader.vue";
import VTabs from "@/components/VTabs.vue";
import VSelect from "@/components/VSelect.vue";
import SubmitRequestButton from "@/views/requests/components/SubmitRequestButton.vue";
import TeamHeatmap from "./components/TeamHeatmap.vue";
import DayAbsencesDrawer from "./components/DayAbsencesDrawer.vue";
import DashboardRequestStats from "./components/DashboardRequestStats.vue";
import TeamAbsentList from "./components/TeamAbsentList.vue";
import DashboardMonthlyChart from "./components/DashboardMonthlyChart.vue";
import TeamUtilization from "./components/TeamUtilization.vue";
import { PANEL_TABS } from "./dashboard-config";
import { useTeamDashboardStore } from "@/stores/team-dashboard";
import { useRequestsStore } from "@/stores/requests";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";
import { todayIso } from "@/utils/calendar-date";

const route = useRoute();
const router = useRouter();
const team_store = useTeamDashboardStore();
const requests_store = useRequestsStore();

const tab = computed({
  get: () => route.path,
  set: (path) => router.push(path)
});

const tabs = computed(() => PANEL_TABS.map((item) => ({ ...item, label: t(item.label) })));

const message = computed(() => {
  if (team_store.error) return getErrorMessage(team_store.error, t("common.states.error"));
  if (!team_store.is_ready) return t("common.states.loading");
  if (!team_store.teams.length) return t("dashboard.no_teams");
  return "";
});

const day_open = ref(false);
const day = ref(todayIso());

function openDay(iso) {
  day.value = iso;
  day_open.value = true;
}

// panel može preći u drugu godinu, tada mapa učita tu godinu
watch(day, (iso) => {
  const year = Number(iso.slice(0, 4));

  if (day_open.value && year && year !== team_store.heatmap.year) team_store.setHeatmapYear(year);
});

onMounted(() => {
  team_store.init();
  // tipovi sa saldom za formu Podnesi zahtjev
  requests_store.fetchLeaveTypes();
});

onUnmounted(() => team_store.resetStore());
</script>

<style lang="scss" scoped>
.team-dashboard {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  background: $surface-background;

  &__header {
    position: relative;
    z-index: 2;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__select {
    width: 17.5rem;
  }

  &__body {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    overflow-y: auto;
    @include thin-scrollbar($primary);
  }

  // liste unutar kartica skroluju
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: minmax(30.125rem, auto);
    gap: $space-16;
  }

  &__column {
    display: grid;
    grid-template-rows: 12.5rem minmax(0, 1fr); // statistika, pa odsutni
    gap: $space-16;
    min-width: 0;
    min-height: 0;
  }

  &__grid > :not(&__column) {
    max-height: 30.125rem;
  }

  &__message {
    padding: $space-24 $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  @include respond-to("laptop-sm") {
    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__column {
      grid-column: 1 / -1;
      grid-template-rows: auto;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @include respond-to("tablet-sm") {
    &__header,
    &__body {
      padding: $space-8;
    }

    &__select {
      flex: 1;
      width: auto;
      min-width: 0;
    }

    &__grid,
    &__column {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
