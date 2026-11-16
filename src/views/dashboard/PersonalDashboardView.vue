<template>
  <div class="dashboard">
    <!-- Podnesi zahtev u navbaru, kao na Zahtevima i Kalendaru -->
    <SubmitRequestButton @submitted="dashboard_store.fetchPersonal()" />

    <div class="dashboard__header">
      <VPageHeader :title="$t('dashboard.title')" :description="$t('dashboard.description')" />
    </div>

    <VTabs v-model="tab" :tabs="tabs" />

    <div class="dashboard__body">
      <VNotice
        v-if="carryover_notice"
        class="dashboard__notice"
        closable
        @close="is_notice_closed = true"
      >
        {{ carryover_notice }}
      </VNotice>

      <p v-if="message" class="dashboard__message">{{ message }}</p>

      <div v-else class="dashboard__grid">
        <div class="dashboard__column">
          <DashboardWelcome
            :name="first_name"
            :company="company_store.name"
            :team="dashboard_store.team_name"
            :free-days="dashboard_store.annual.remaining"
            :pending="dashboard_store.requests.pending"
          />

          <!-- novi dani = preostalo - preneseni, 15.2 ih vraća zajedno -->
          <DashboardBalanceCard
            :title="$t('dashboard.balance.annual_title')"
            :remaining="dashboard_store.annual.remaining"
            :total="dashboard_store.annual.entitled"
            :segments="[
              { value: new_days, color: 'primary-400' },
              { value: dashboard_store.carryover.days, color: 'primary-350' }
            ]"
            :legend="[
              {
                label: $t('dashboard.balance.new_days'),
                color: 'primary-400',
                value: new_days
              },
              {
                label: $t('dashboard.balance.carryover_days'),
                color: 'primary-350',
                value: dashboard_store.carryover.days
              },
              {
                label: $t('dashboard.balance.used_days'),
                color: 'cold-300',
                value: dashboard_store.annual.used
              }
            ]"
          />

          <DashboardBalanceCard
            :title="$t('dashboard.balance.general_title')"
            :remaining="dashboard_store.general.remaining"
            :total="dashboard_store.general.entitled"
            :segments="[{ value: dashboard_store.general.remaining, color: 'primary-400' }]"
            :legend="[
              { label: $t('dashboard.balance.remaining_days'), color: 'primary-400' },
              { label: $t('dashboard.balance.used_days'), color: 'cold-300' }
            ]"
            centered
          />
        </div>

        <div class="dashboard__column">
          <DashboardRequestStats
            class="dashboard__stats"
            :pending="dashboard_store.requests.pending"
            :approved="dashboard_store.requests.approved"
            @details="openMyRequests"
          />

          <DashboardMonthlyChart class="dashboard__chart" :graphs="dashboard_store.graphs" />
        </div>

        <DashboardUpcoming
          class="dashboard__upcoming"
          :items="dashboard_store.upcoming"
          @all="openMyRequests"
          @details="(id) => details_ref?.show(id)"
        />
      </div>
    </div>

    <RequestDetailsDrawer ref="details_ref" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import VPageHeader from "@/components/VPageHeader.vue";
import VTabs from "@/components/VTabs.vue";
import VNotice from "@/components/VNotice.vue";
import SubmitRequestButton from "@/views/requests/components/SubmitRequestButton.vue";
import RequestDetailsDrawer from "@/views/requests/components/RequestDetailsDrawer.vue";
import DashboardWelcome from "./components/DashboardWelcome.vue";
import DashboardBalanceCard from "./components/DashboardBalanceCard.vue";
import DashboardRequestStats from "./components/DashboardRequestStats.vue";
import DashboardMonthlyChart from "./components/DashboardMonthlyChart.vue";
import DashboardUpcoming from "./components/DashboardUpcoming.vue";
import { PANEL_TABS, formatDate } from "./dashboard-config";
import { useDashboardStore } from "@/stores/dashboard";
import { useRequestsStore } from "@/stores/requests";
import { useAuthStore } from "@/stores/auth";
import { useCompanyStore } from "@/stores/company";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const route = useRoute();
const router = useRouter();
const dashboard_store = useDashboardStore();
const requests_store = useRequestsStore();
const auth_store = useAuthStore();
const company_store = useCompanyStore();

const tab = computed({
  get: () => route.path,
  set: (path) => router.push(path)
});

const tabs = computed(() => PANEL_TABS.map((item) => ({ ...item, label: t(item.label) })));

const first_name = computed(
  () => auth_store.profile?.first_name || auth_store.user?.first_name || ""
);

const new_days = computed(() =>
  Math.max(0, dashboard_store.annual.remaining - dashboard_store.carryover.days)
);

// obavještenje dok preneseni dani važe, zatvoreno ostaje do sljedeće posjete
const is_notice_closed = ref(false);

const carryover_notice = computed(() => {
  const { days, expires_on } = dashboard_store.carryover;

  if (is_notice_closed.value || !days || !expires_on) return "";

  return t("dashboard.carryover_notice", {
    days: t("common.days", { count: days }),
    date: formatDate(expires_on)
  });
});

const message = computed(() => {
  if (dashboard_store.error) return getErrorMessage(dashboard_store.error, t("common.states.error"));
  if (dashboard_store.is_loading && !dashboard_store.annual.entitled) return t("common.states.loading");
  return "";
});

const details_ref = ref(null);

// Vidi detalje i Vidi sve otvaraju Moje zahtjeve
function openMyRequests() {
  requests_store.mode = "mine";
  router.push({ name: "requests" });
}

onMounted(() => {
  dashboard_store.fetchPersonal();
  // tipovi sa saldom za formu Podnesi zahtev
  requests_store.fetchLeaveTypes();
});

onUnmounted(() => dashboard_store.resetStore());
</script>

<style lang="scss" scoped>
.dashboard {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  background: $surface-background;

  &__header {
    position: relative;
    z-index: 1;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__body {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    overflow-y: auto;
    @include thin-scrollbar($primary);
  }

  &__notice {
    flex-shrink: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $space-16;
    align-items: stretch;
  }

  &__column {
    @include flex(flex-start, stretch, $space-16, column);
    min-width: 0;
  }

  // statistika iste visine kao pozdrav lijevo
  &__stats {
    min-height: 14.5rem;
  }

  &__chart {
    min-height: 25.5rem;
  }

  &__message {
    padding: $space-24 $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  // manji ekran: pozdrav i salda lijevo, statistika desno, odsustva ispod
  @include respond-to("laptop-sm") {
    &__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__upcoming {
      grid-column: 1 / -1;
    }
  }

  @include respond-to("tablet-sm") {
    &__header {
      padding: $space-8;
    }

    &__body {
      padding: $space-8;
    }

    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
