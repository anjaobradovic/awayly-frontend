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

      <p v-if="download_error" class="reports__error" role="alert">{{ download_error }}</p>
    </div>

    <VTable
      v-model:sort="sort"
      class="reports__table"
      :columns="columns"
      :rows="reports_store.paginated_items"
      :empty-text="empty_text"
    >
      <template #cell-name="{ value }">
        <strong class="reports__name">{{ script(value) }}</strong>
      </template>

      <template #cell-description="{ value }">
        <span class="reports__truncate" :title="script(value)">{{ script(value) }}</span>
      </template>

      <template #cell-date_from="{ value }">
        {{ formatDate(value, { dateOnly: true }) }}
      </template>

      <template #cell-date_to="{ value }">
        {{ formatDate(value, { dateOnly: true }) }}
      </template>

      <template #cell-recipients="{ value }">
        <span class="reports__recipients">
          <span class="reports__truncate" :title="recipientNames(value).join(', ')">
            {{ recipientNames(value).slice(0, VISIBLE_RECIPIENTS).join(", ") }}
          </span>

          <!-- hover ili fokus na +N pokazuje ostale primaoce -->
          <VTooltip
            v-if="value.length > VISIBLE_RECIPIENTS"
            :title="$t('reports.other_recipients')"
            :text="recipientNames(value).slice(VISIBLE_RECIPIENTS).join(', ')"
          >
            <span class="reports__more">+{{ value.length - VISIBLE_RECIPIENTS }}</span>
          </VTooltip>
        </span>
      </template>

      <template #cell-created_at="{ value }">
        {{ formatDate(value).replace(" ", " - ") }}
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          class="reports__download"
          :aria-label="$t('reports.download_aria', { name: row.name })"
          :disabled="downloading_id === row.id"
          @click="download(row)"
        >
          <VIcon name="download" :size="18" filled />
        </button>
      </template>

      <template #footer>
        <p class="reports__count">
          <strong>{{ reports_store.paginated_items.length }}</strong>
          {{ $t("reports.count_of", { count: reports_store.total_items }) }}
        </p>
        <VPagination v-model="page" :total-pages="reports_store.total_pages" />
      </template>
    </VTable>

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
import VTable from "@/components/VTable.vue";
import VPagination from "@/components/VPagination.vue";
import VTooltip from "@/components/VTooltip.vue";
import ReportDrawer from "./components/ReportDrawer.vue";
import { useReportsStore } from "@/stores/reports";
import { useEmployeesStore } from "@/stores/employees";
import { useDate } from "@/composables/useDate";
import { getErrorMessage } from "@/utils/api-error";
import { script, t } from "@/i18n";

const columns = computed(() => [
  { key: "name", label: t("reports.columns.name"), width: "13.75rem", sortable: true },
  { key: "description", label: t("reports.columns.description"), width: "18rem", sortable: true },
  { key: "team", label: t("reports.columns.team"), width: "16rem", sortable: true },
  { key: "date_from", label: t("reports.columns.date_from"), width: "10rem", sortable: true },
  { key: "date_to", label: t("reports.columns.date_to"), width: "10rem", sortable: true },
  {
    key: "recipients",
    label: t("reports.columns.recipients"),
    width: "17.5rem",
    grow: true,
    sortable: true
  },
  {
    key: "generated_by",
    label: t("reports.columns.generated_by"),
    width: "10rem",
    sortable: true
  },
  {
    key: "created_at",
    label: t("reports.columns.created_at"),
    width: "11.25rem",
    // ne skuplja se ispod širine teksta i strelica
    minWidth: "11.75rem",
    nowrap: true,
    sortable: true
  }
]);

const VISIBLE_RECIPIENTS = 4;

const reports_store = useReportsStore();
const employees_store = useEmployeesStore();
const { formatDate } = useDate();

const search = computed({
  get: () => reports_store.search,
  set: (value) => reports_store.setSearch(value)
});

const sort = computed({
  get: () => reports_store.sort,
  set: (value) => reports_store.setSort(value)
});

const page = computed({
  get: () => reports_store.page,
  set: (value) => (reports_store.page = value)
});

const empty_text = computed(() => {
  if (reports_store.is_loading) return t("common.states.loading");
  if (reports_store.error) return getErrorMessage(reports_store.error, t("common.states.error"));

  return t("reports.empty");
});

// API vraća samo email adrese
const name_by_email = computed(
  () => new Map(employees_store.all_users.map((user) => [user.email, user.name]))
);

// ime iz podataka samo prebacuje pismo, email ostaje kako jeste
const recipientNames = (emails) =>
  emails.map((email) => {
    const name = name_by_email.value.get(email);

    return name ? script(name) : email;
  });

// preuzimanje: dok traje, dugme tog reda je zaključano
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
  // siva pozadina strane, tabela je bijela kutija
  background: $cold-50;

  &__header {
    position: relative;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__search {
    width: 20.125rem;
  }

  &__table {
    min-height: 0;
    margin: $space-16;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    // senka oko tabele
    box-shadow: $shadow-small;
  }

  &__name {
    font-size: $text-14;
    font-weight: $weight-semibold;
    color: $fg-heading;
  }

  &__truncate {
    @include truncate;
    min-width: 0;
  }

  &__recipients {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
  }

  &__more {
    @include flex(center, center);
    flex-shrink: 0;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 $space-4;
    font-weight: $weight-semibold;
    background: $cold-50;
    border-radius: $radius-sm;
    cursor: default;
    transition: $transition;

    &:hover {
      background: $cold-75;
    }
  }

  &__download {
    @include flex(center, center);
    padding: $space-4;
    color: $icon-default;
    background: transparent;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:hover:not(:disabled) {
      color: $fg-heading;
      background: $surface-default-hover;
    }

    &:disabled {
      cursor: progress;
      opacity: 0.5;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
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
    margin-top: $space-8;
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
}
</style>
