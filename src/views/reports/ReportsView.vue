<template>
  <div class="reports">
    <Teleport defer to="#navbar-actions">
      <VBaseButton size="header" @click="is_drawer_open = true">
        <VIcon name="add" :size="16" />
        {{ $t("reports.generate") }}
      </VBaseButton>
    </Teleport>

    <div class="reports__header">
      <VPageHeader :title="$t('reports.title')" :description="$t('reports.description')">
        <template #actions>
          <VBaseInput
            v-model="search"
            class="reports__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('reports.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>
        </template>
      </VPageHeader>
    </div>

    <div class="reports__content">
      <!-- brojevi nad svim izveštajima -->
      <dl class="reports__summary" :aria-label="$t('reports.summary.label')">
        <div v-for="stat in stats" :key="stat.key" class="reports__stat">
          <span class="reports__stat-icon" aria-hidden="true">
            <VIcon :name="stat.icon" :size="20" />
          </span>
          <div class="reports__stat-text">
            <dt>{{ stat.label }}</dt>
            <dd>
              {{ reports_store.is_loading && !reports_store.items.length ? "–" : stat.value }}
            </dd>
          </div>
        </div>
      </dl>

      <div class="reports__toolbar">
        <VSegmentedButton v-model="scope" :options="scope_options" size="small" />

        <VSelect
          v-model="sort"
          class="reports__sort"
          size="header"
          leading-icon="swap_vert"
          :options="sort_options"
          :aria-label="$t('reports.sort.label')"
        />
      </div>

      <p v-if="download_error" class="reports__error" role="alert">{{ download_error }}</p>

      <!-- učitavanje: sive kartice -->
      <div v-if="reports_store.is_loading && !reports_store.items.length" class="reports__grid">
        <div v-for="index in 6" :key="index" class="reports__skeleton" aria-hidden="true">
          <span class="is-thumb" />
          <span class="is-title" />
          <span class="is-line" />
          <span class="is-line is-short" />
          <span class="is-box" />
        </div>
        <span class="reports__sr">{{ $t("common.states.loading") }}</span>
      </div>

      <div v-else-if="reports_store.error" class="reports__state" role="alert">
        <span class="reports__state-icon is-error" aria-hidden="true">
          <VIcon name="error_outline" :size="28" />
        </span>
        <strong>{{ getErrorMessage(reports_store.error, $t("common.states.error")) }}</strong>
      </div>

      <div v-else-if="!reports_store.total_items" class="reports__state">
        <span class="reports__state-icon" aria-hidden="true">
          <VIcon :name="has_reports ? 'search_off' : 'description'" :size="28" />
        </span>
        <strong>{{ has_reports ? $t("reports.no_results") : $t("reports.empty") }}</strong>
        <p>{{ has_reports ? $t("reports.no_results_text") : $t("reports.empty_text") }}</p>
        <VBaseButton v-if="!has_reports" size="small" @click="is_drawer_open = true">
          <VIcon name="add" :size="16" />
          {{ $t("reports.generate") }}
        </VBaseButton>
      </div>

      <template v-else>
        <div class="reports__grid">
          <ReportCard
            v-for="report in reports_store.paginated_items"
            :key="report.id"
            :report="report"
            :recipients="recipientsOf(report.recipients)"
            :downloading="downloading_id === report.id"
            @download="download"
          />
        </div>

        <footer class="reports__footer">
          <p class="reports__count">
            <strong>{{ reports_store.paginated_items.length }}</strong>
            {{ $t("reports.count_of", { count: reports_store.total_items }) }}
          </p>
          <VPagination
            v-if="reports_store.total_pages > 1"
            v-model="page"
            :total-pages="reports_store.total_pages"
          />
        </footer>
      </template>
    </div>

    <ReportDrawer v-model:open="is_drawer_open" @generated="showSuccess" />

    <Transition name="fade">
      <div v-if="is_success_visible" class="reports__toast" role="status">
        <VIcon name="check_circle" :size="20" filled class="reports__toast-icon" />
        <div class="reports__toast-text">
          <strong>{{ $t("reports.toast.title") }}</strong>
          <span>{{ $t("reports.toast.text") }}</span>
        </div>
        <button
          type="button"
          class="reports__toast-close"
          :aria-label="$t('reports.toast.close')"
          @click="is_success_visible = false"
        >
          <VIcon name="close" :size="18" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VPagination from "@/components/VPagination.vue";
import VSelect from "@/components/VSelect.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import ReportCard from "./components/ReportCard.vue";
import ReportDrawer from "./components/ReportDrawer.vue";
import { REPORT_SCOPES, REPORT_SORTS, useReportsStore } from "@/stores/reports";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorMessage } from "@/utils/api-error";
import { script, t } from "@/i18n";

const reports_store = useReportsStore();
const employees_store = useEmployeesStore();

const search = computed({
  get: () => reports_store.search,
  set: (value) => reports_store.setSearch(value)
});

const sort = computed({
  get: () => reports_store.sort,
  set: (value) => reports_store.setSort(value)
});

const scope = computed({
  get: () => reports_store.scope,
  set: (value) => reports_store.setScope(value)
});

const page = computed({
  get: () => reports_store.page,
  set: (value) => (reports_store.page = value)
});

const sort_options = computed(() =>
  Object.keys(REPORT_SORTS).map((value) => ({ value, label: t(`reports.sort.${value}`) }))
);

const scope_options = computed(() =>
  REPORT_SCOPES.map((value) => ({ value, label: t(`reports.scope_filter.${value}`) }))
);

const stats = computed(() => {
  const { total, this_month, company, team } = reports_store.summary;

  return [
    { key: "total", icon: "description", label: t("reports.summary.total"), value: total },
    {
      key: "month",
      icon: "calendar_month",
      label: t("reports.summary.this_month"),
      value: this_month
    },
    { key: "company", icon: "domain", label: t("reports.summary.company"), value: company },
    { key: "team", icon: "groups", label: t("reports.summary.team"), value: team }
  ];
});

const has_reports = computed(() => reports_store.items.length > 0);

// API vraća samo email adrese
const name_by_email = computed(
  () => new Map(employees_store.all_users.map((user) => [user.email, user.name]))
);

// ime iz podataka samo prebacuje pismo, email ostaje kako jeste
const recipientsOf = (emails) =>
  emails.map((email) => {
    const name = name_by_email.value.get(email);

    return { email, name: name ? script(name) : email };
  });

// preuzimanje: dok traje, dugme te kartice je zaključano
const downloading_id = ref(null);
const download_error = ref("");

async function download(report) {
  downloading_id.value = report.id;
  download_error.value = "";

  const error = await reports_store.downloadReport(report);

  downloading_id.value = null;

  if (error !== undefined) {
    download_error.value = getErrorMessage(error, t("common.states.error"));
  }
}

const is_drawer_open = ref(false);

const is_success_visible = ref(false);
let success_timer = null;

function showSuccess() {
  is_success_visible.value = true;
  clearTimeout(success_timer);
  success_timer = setTimeout(() => (is_success_visible.value = false), 5000);
}

onMounted(() => {
  reports_store.fetchReports();
  employees_store.fetchOptions();
});

onUnmounted(() => {
  clearTimeout(success_timer);
  reports_store.resetStore();
});
</script>

<style lang="scss" scoped>
.reports {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  background: $cold-50;

  &__header {
    position: relative;
    z-index: 1;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__search {
    width: 20.125rem;
  }

  &__content {
    @include flex(flex-start, stretch, $space-16, column);
    min-height: 0;
    padding: $space-16;
    overflow-y: auto;
    @include thin-scrollbar;
  }

  // traka sa brojevima
  &__summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-12;
    margin: 0;
  }

  &__stat {
    @include flex(flex-start, center, $space-12);
    min-width: 0;
    padding: $space-12 $space-16;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__stat-icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-md;
  }

  &__stat:first-child &__stat-icon {
    color: $white;
    background: linear-gradient(140deg, $primary-400, $primary-600);
    box-shadow: 0 10px 20px -12px $primary-500;
  }

  &__stat-text {
    min-width: 0;

    dt {
      @include truncate;
      font-size: $text-12;
      font-weight: $weight-semibold;
      color: $fg-body;
    }

    dd {
      margin: $space-2 0 0;
      font-size: $text-24;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.02em;
      color: $fg-heading;
    }
  }

  &__toolbar {
    @include flex(space-between, center, $space-12);
    flex-wrap: wrap;
  }

  &__sort {
    width: 11.5rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 18.5rem), 1fr));
    gap: $space-16;
  }

  &__skeleton {
    @include flex(flex-start, stretch, $space-10, column);
    padding: $space-16;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xl;

    span {
      display: block;
      height: 0.75rem;
      background: $cold-75;
      border-radius: $radius-sm;
      animation: reports-pulse 1.4s ease-in-out infinite;
    }

    .is-thumb {
      width: 2.75rem;
      height: 3.5rem;
      margin-bottom: $space-4;
    }

    .is-title {
      width: 55%;
      height: 1rem;
    }

    .is-short {
      width: 70%;
    }

    .is-box {
      height: 3.25rem;
      margin-top: $space-4;
    }
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  // prazno / greška
  &__state {
    @include flex(center, center, $space-8, column);
    padding: $space-48 $space-24;
    text-align: center;
    background: $surface-default;
    border: 1px dashed $border-default;
    border-radius: $radius-xl;

    strong {
      font-size: $text-16;
      font-weight: $weight-bold;
      color: $fg-heading;
    }

    p {
      max-width: 24rem;
      margin-bottom: $space-8;
      font-size: $text-13;
      color: $fg-body;
    }
  }

  &__state-icon {
    @include flex(center, center);
    width: 3.5rem;
    height: 3.5rem;
    margin-bottom: $space-4;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: 50%;

    &.is-error {
      color: $fg-error;
      background: $surface-error;
    }
  }

  &__footer {
    @include flex(space-between, center, $space-12);
    flex-wrap: wrap;
    padding: $space-4 0;
  }

  &__count {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;

    strong {
      font-weight: $weight-semibold;
      color: $fg-action;
    }
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  // tamna kartica dolje desno sa zelenom linijom lijevo
  &__toast {
    position: fixed;
    right: $space-24;
    bottom: $space-24;
    z-index: $z-dropdown;
    @include flex(flex-start, flex-start, $space-12);
    width: 20rem;
    max-width: calc(100vw - #{$space-32});
    padding: $space-12 $space-16;
    // obrnute boje teme: tamna kartica u svetloj temi, svetla u tamnoj
    color: $surface-default;
    background: $cold-900;
    border-left: 4px solid $success-500;
    border-radius: $radius-sm;
    box-shadow: $shadow-small;
  }

  &__toast-icon {
    color: $success-500;
  }

  &__toast-text {
    @include flex(flex-start, flex-start, $space-4, column);
    flex: 1;
    font-size: $text-12;
    line-height: $leading-xs;

    strong {
      font-size: $text-14;
      font-weight: $weight-semibold;
    }
  }

  &__toast-close {
    display: flex;
    padding: 0;
    color: inherit;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  @include respond-to("tablet") {
    &__summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @include respond-to("mobile") {
    &__search {
      width: 100%;
    }

    &__content {
      padding: $space-12;
    }

    &__summary {
      gap: $space-8;
    }

    &__stat {
      padding: $space-10 $space-12;
      gap: $space-10;
    }

    // usko: bez ikonice, natpis se prelama
    &__stat-icon {
      display: none;
    }

    &__stat-text dt {
      white-space: normal;
      line-height: $leading-xs;
    }

    &__stat-text dd {
      font-size: $text-20;
    }

    &__toolbar > * {
      flex: 1 1 auto;
    }

    &__sort {
      width: auto;
    }

    &__toast {
      right: $space-16;
      bottom: $space-16;
    }
  }
}

@keyframes reports-pulse {
  50% {
    opacity: 0.5;
  }
}
</style>
