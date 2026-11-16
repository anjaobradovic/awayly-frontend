<template>
  <div class="company-dashboard">
    <SubmitRequestButton @submitted="company_store.selectTeam(company_store.team_id)" />

    <div class="company-dashboard__header">
      <VPageHeader :title="$t('dashboard.title')" :description="$t('dashboard.description')">
        <template #actions>
          <VSelect
            class="company-dashboard__select"
            size="header"
            leading-icon="groups"
            :model-value="company_store.team_id"
            :options="company_store.team_options"
            @update:model-value="company_store.selectTeam"
          />
        </template>
      </VPageHeader>
    </div>

    <VTabs v-model="tab" :tabs="tabs" />

    <div class="company-dashboard__body">
      <p v-if="message" class="company-dashboard__message">{{ message }}</p>

      <template v-else>
        <DashboardSummary
          icon="domain"
          :eyebrow="
            company_store.team_id
              ? $t('dashboard.summary.team_eyebrow')
              : $t('dashboard.summary.company_eyebrow')
          "
          :title="summary_title"
          :people="summary_people"
          :people-label="$t('dashboard.summary.teams')"
          :stats="stats"
        />

        <TeamHeatmap
          :year="company_store.heatmap.year"
          :days="company_store.absences_by_day"
          :leave-type-id="company_store.heatmap.leave_type_id"
          :type-options="company_store.leave_type_options"
          @update:year="company_store.setHeatmapYear"
          @update:leave-type-id="company_store.setHeatmapType"
          @open-day="openDay"
        />

        <div class="company-dashboard__grid">
          <DashboardMonthlyChart
            class="company-dashboard__chart"
            :title="$t('dashboard.chart.absence_title')"
            :graphs="company_store.graphs"
          />

          <TeamAbsentList class="company-dashboard__absent" :items="company_store.absent" />

          <TeamUtilization
            class="company-dashboard__utilization"
            :items="company_store.utilization"
          />
        </div>
      </template>
    </div>

    <DayAbsencesDrawer
      v-model:open="day_open"
      v-model:date="day"
      :days="company_store.absences_by_day"
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
import DashboardMonthlyChart from "./components/DashboardMonthlyChart.vue";
import TeamUtilization from "./components/TeamUtilization.vue";
import TeamAbsentList from "./components/TeamAbsentList.vue";
import { PANEL_TABS } from "./dashboard-config";
import { useCompanyDashboardStore } from "@/stores/company-dashboard";
import { useRequestsStore } from "@/stores/requests";
import { useCompanyStore } from "@/stores/company";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";
import { todayIso } from "@/utils/calendar-date";

const route = useRoute();
const router = useRouter();
const company_store = useCompanyDashboardStore();
const requests_store = useRequestsStore();
const company_profile = useCompanyStore();

const tab = computed({
  get: () => route.path,
  set: (path) => router.push(path)
});

const tabs = computed(() => PANEL_TABS.map((item) => ({ ...item, label: t(item.label) })));

const message = computed(() => {
  if (company_store.error) return getErrorMessage(company_store.error, t("common.states.error"));
  if (!company_store.is_ready) return t("common.states.loading");
  return "";
});

// kompanija ili izabrani tim
const summary_title = computed(() =>
  company_store.team_id
    ? (company_store.team_options.find((team) => team.value === company_store.team_id)?.label ?? "")
    : company_profile.name
);

// avatari su timovi (inicijali naziva)
const summary_people = computed(() =>
  company_store.teams.map((team) => ({ id: team.id, name: team.name }))
);

const stats = computed(() => [
  {
    key: "absent",
    icon: "flight_takeoff",
    label: t("dashboard.summary.absent_today"),
    value: company_store.absent.length
  },
  {
    key: "pending",
    icon: "hourglass_top",
    label: t("dashboard.summary.pending"),
    value: company_store.requests.pending,
    tone: "warning",
    to: { name: "requests" }
  },
  {
    key: "approved",
    icon: "task_alt",
    label: t("dashboard.summary.approved"),
    value: company_store.requests.approved,
    tone: "success"
  },
  {
    key: "accounts",
    icon: "badge",
    label: t("dashboard.summary.active_accounts"),
    value: company_store.accounts.active,
    suffix: company_store.accounts.pending ? `+${company_store.accounts.pending}` : "",
    to: { name: "employees" }
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

  if (day_open.value && year && year !== company_store.heatmap.year)
    company_store.setHeatmapYear(year);
});

onMounted(() => {
  company_store.init();
  requests_store.fetchLeaveTypes();
});

onUnmounted(() => company_store.resetStore());
</script>

<style lang="scss" scoped>
.company-dashboard {
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

  // grafikon široko, odsutni pored, iskorišćenost po timovima ispod
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
  }
}
</style>
