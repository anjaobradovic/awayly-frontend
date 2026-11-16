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
        <DashboardSummary
          icon="groups"
          :eyebrow="$t('dashboard.summary.team_eyebrow')"
          :title="team_name"
          :people="people"
          :people-label="$t('dashboard.summary.people')"
          :stats="stats"
        />

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
          <DashboardMonthlyChart
            class="team-dashboard__chart"
            :title="$t('dashboard.chart.absence_title')"
            :graphs="team_store.graphs"
          />

          <TeamAbsentList class="team-dashboard__absent" :items="team_store.visible_absent" />

          <TeamUtilization class="team-dashboard__utilization" :items="team_store.utilization" />
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
import DashboardSummary from "./components/DashboardSummary.vue";
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

const team_name = computed(
  () => team_store.team_options.find((team) => team.value === team_store.team_id)?.label ?? ""
);

const people = computed(() =>
  team_store.members.map((member) => ({ id: member.user_id, name: member.name }))
);

// prosjek iskorišćenog godišnjeg za izabrane ljude
const utilization_percent = computed(() => {
  const totals = team_store.utilization.reduce(
    (sum, item) => ({ used: sum.used + item.used, entitled: sum.entitled + item.entitled }),
    { used: 0, entitled: 0 }
  );

  return totals.entitled ? Math.round((totals.used / totals.entitled) * 100) : 0;
});

const stats = computed(() => [
  {
    key: "members",
    icon: "group",
    label: t("dashboard.summary.members"),
    value: team_store.members.length
  },
  {
    key: "absent",
    icon: "flight_takeoff",
    label: t("dashboard.summary.absent_today"),
    value: team_store.visible_absent.length
  },
  {
    key: "pending",
    icon: "hourglass_top",
    label: t("dashboard.summary.pending"),
    value: team_store.requests.pending,
    tone: "warning",
    to: { name: "requests" }
  },
  {
    key: "utilization",
    icon: "beach_access",
    label: t("dashboard.summary.utilization"),
    value: utilization_percent.value,
    suffix: "%",
    percent: utilization_percent.value
  }
]);

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

  // grafikon široko, odsutni pored, iskorišćenost ispod preko cijele širine
  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-areas:
      "chart chart absent"
      "util util util";
    gap: $space-16;
  }

  &__chart {
    grid-area: chart;
    min-height: 22rem;
  }

  &__absent {
    grid-area: absent;
    max-height: 26rem;
  }

  // široka kartica, lista u dvije kolone
  &__utilization {
    grid-area: util;
    max-height: 26rem;

    :deep(.team-utilization__list) {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: $space-32;
    }
  }

  &__message {
    padding: $space-24 $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  @include respond-to("laptop-sm") {
    &__grid {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "chart" "absent" "util";
    }

    &__utilization :deep(.team-utilization__list) {
      grid-template-columns: minmax(0, 1fr);
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

    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
