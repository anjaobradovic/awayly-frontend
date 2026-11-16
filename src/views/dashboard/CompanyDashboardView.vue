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
          <div class="company-dashboard__column">
            <DashboardRequestStats
              :pending="company_store.requests.pending"
              :approved="company_store.requests.approved"
              @details="router.push({ name: 'requests' })"
            />

            <DashboardRequestStats
              :title="$t('dashboard.stats.accounts_title')"
              :pending-label="$t('dashboard.stats.accounts_pending')"
              :approved-label="$t('dashboard.stats.accounts_active')"
              :pending="company_store.accounts.pending"
              :approved="company_store.accounts.active"
              @details="router.push({ name: 'employees' })"
            />
          </div>

          <DashboardMonthlyChart
            :title="$t('dashboard.chart.absence_title')"
            :graphs="company_store.graphs"
          />

          <div class="company-dashboard__column company-dashboard__column--lists">
            <TeamUtilization :items="company_store.utilization" />
            <TeamAbsentList :items="company_store.absent" />
          </div>
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
import DashboardRequestStats from "./components/DashboardRequestStats.vue";
import DashboardMonthlyChart from "./components/DashboardMonthlyChart.vue";
import TeamUtilization from "./components/TeamUtilization.vue";
import TeamAbsentList from "./components/TeamAbsentList.vue";
import { PANEL_TABS } from "./dashboard-config";
import { useCompanyDashboardStore } from "@/stores/company-dashboard";
import { useRequestsStore } from "@/stores/requests";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";
import { todayIso } from "@/utils/calendar-date";

const route = useRoute();
const router = useRouter();
const company_store = useCompanyDashboardStore();
const requests_store = useRequestsStore();

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

const day_open = ref(false);
const day = ref(todayIso());

function openDay(iso) {
  day.value = iso;
  day_open.value = true;
}

// panel može preći u drugu godinu, tada mapa učita tu godinu
watch(day, (iso) => {
  const year = Number(iso.slice(0, 4));

  if (day_open.value && year && year !== company_store.heatmap.year) company_store.setHeatmapYear(year);
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

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: 30.125rem;
    gap: $space-16;
  }

  &__column {
    display: grid;
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: $space-16;
    min-width: 0;
    min-height: 0;

    &--lists {
      grid-template-rows: 14.75rem minmax(0, 1fr);
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: auto;
    }

    &__grid > * {
      height: 30.125rem;
    }

    &__column--lists {
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
    &__column--lists {
      grid-template-columns: minmax(0, 1fr);
    }

    &__grid > * {
      height: auto;
    }

    &__column {
      grid-template-rows: auto;
    }

    &__column--lists > * {
      height: 22rem;
    }
  }
}
</style>
