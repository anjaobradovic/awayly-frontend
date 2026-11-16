<template>
  <div class="activity-log">
    <div class="activity-log__header">
      <VPageHeader :title="$t('activity_log.title')" :description="$t('activity_log.description')">
        <template #actions>
          <VBaseInput
            v-model="search"
            class="activity-log__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('activity_log.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>

          <VFilterPopup
            v-model:open="is_filter_open"
            :title="$t('activity_log.filters.title')"
            :clear-label="$t('activity_log.filters.clear')"
            :apply-label="$t('activity_log.filters.apply')"
            :can-clear="activity_store.has_filters"
            :count="activity_store.filter_count"
            @apply="applyFilters"
            @clear="clearFilters"
          >
            <template #trigger="{ toggle, open }">
              <VBaseButton
                class="activity-log__filters"
                appearance="outlined"
                size="header"
                :aria-expanded="open"
                aria-haspopup="dialog"
                @click="toggle"
              >
                {{ $t("common.actions.filter") }}
                <VIcon name="tune" :size="16" />
              </VBaseButton>
            </template>

            <VSelect
              v-model="draft_filters.audit_type"
              :label="$t('activity_log.filters.audit_type')"
              appearance="underlined"
              :placeholder="$t('activity_log.filters.audit_type_placeholder')"
              :options="activity_store.audit_type_options"
            />
            <VDateInput
              v-model="draft_filters.date_from"
              :label="$t('activity_log.filters.date_from')"
              :max="draft_filters.date_to"
            />
            <VDateInput
              v-model="draft_filters.date_to"
              :label="$t('activity_log.filters.date_to')"
              :min="draft_filters.date_from"
            />
          </VFilterPopup>
        </template>
      </VPageHeader>
    </div>

    <VTable
      class="activity-log__table"
      :columns="columns"
      :rows="activity_store.visible_items"
      :empty-text="empty_text"
    >
      <template #cell-actor_name="{ value }">
        <strong class="activity-log__actor" :title="value">{{ value }}</strong>
      </template>

      <template #cell-actor_type="{ row }">
        <VChip :tone="row.actor_tone">{{ row.actor_type }}</VChip>
      </template>

      <template #cell-audit_type="{ row }">
        <strong class="activity-log__action">{{ row.audit_label }}</strong>
      </template>

      <template #cell-details="{ row }">
        <span v-if="row.details.length" class="activity-log__details" :title="row.details_text">
          <span v-for="(part, index) in row.details" :key="index">{{ part }}</span>
        </span>
        <span v-else>—</span>
      </template>

      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #footer>
        <p class="activity-log__count">
          <strong>{{ activity_store.visible_items.length }}</strong>
          {{ $t("activity_log.count_of", { count: activity_store.total_count }) }}
        </p>
        <VPagination v-model="page" :total-pages="activity_store.total_pages" />
      </template>
    </VTable>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VTable from "@/components/VTable.vue";
import VChip from "@/components/VChip.vue";
import VPagination from "@/components/VPagination.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import { useActivityLogStore } from "@/stores/activity-log";
import { useDate } from "@/composables/useDate";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const columns = computed(() => [
  {
    key: "actor_name",
    label: t("activity_log.columns.actor_name"),
    width: "300px",
    minWidth: "7rem"
  },
  {
    key: "actor_type",
    label: t("activity_log.columns.actor_type"),
    width: "180px",
    minWidth: "7rem"
  },
  {
    key: "audit_type",
    label: t("activity_log.columns.audit_type"),
    width: "260px",
    minWidth: "6.5rem"
  },
  { key: "details", label: t("activity_log.columns.details"), minWidth: "8rem" },
  {
    key: "created_at",
    label: t("activity_log.columns.created_at"),
    width: "190px",
    minWidth: "6.5rem"
  }
]);

const activity_store = useActivityLogStore();
const { formatDate } = useDate();

const is_filter_open = ref(false);
const draft_filters = ref({ ...activity_store.filters });

// svako otvaranje kreće od trenutno primenjenih filtera (Odustani ih ne menja)
watch(is_filter_open, (open) => {
  if (open) draft_filters.value = { ...activity_store.filters };
});

function applyFilters() {
  activity_store.setFilters(draft_filters.value);
  is_filter_open.value = false;
}

function clearFilters() {
  activity_store.clearFilters();
  is_filter_open.value = false;
}

const search = computed({
  get: () => activity_store.search,
  set: (value) => activity_store.setSearch(value)
});

// svaka strana je novi poziv 18.1
const page = computed({
  get: () => activity_store.page,
  set: (value) => activity_store.setPage(value)
});

const empty_text = computed(() => {
  if (activity_store.is_loading) return t("common.states.loading");
  if (activity_store.error) return getErrorMessage(activity_store.error, t("common.states.error"));

  return t("activity_log.empty");
});

onMounted(() => activity_store.fetchEntries());

onUnmounted(() => activity_store.resetStore());
</script>

<style lang="scss" scoped>
.activity-log {
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

  &__filters.v-btn {
    color: $fg-action;
  }

  &__table {
    min-height: 0;
    margin: $space-16;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    // sjenka oko tabele
    box-shadow: $shadow-small;
  }

  &__actor {
    @include truncate;
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__action {
    font-weight: $weight-semibold;
  }

  // dijelovi detalja sa razmakom, na užem ekranu prelaze u novi red
  &__details {
    display: flex;
    flex-wrap: wrap;
    gap: $space-4 $space-10;
    min-width: 0;
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

  @include respond-to("laptop-sm") {
    &__table :deep(.v-table__cell) {
      padding-right: $space-8;
      padding-left: $space-8;
    }
  }

  @include respond-to("tablet-sm") {
    &__header {
      padding: $space-8;
    }

    &__search {
      flex: 1;
      width: auto;
      min-width: 0;
    }

    &__table {
      margin: $space-8;
    }

    &__table :deep(.v-table__footer) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @include respond-to("mobile") {
    &__table :deep(.v-table__content) {
      min-width: 0 !important;
    }

    &__table :deep(.v-table__head) {
      display: none;
    }

    &__table :deep(.v-table__row) {
      flex-wrap: wrap;
      row-gap: $space-8;
    }

    &__table :deep(.v-table__row .v-table__cell) {
      flex: 1 1 50% !important;
      min-width: 0 !important;
    }

    &__table :deep(.v-table__row .v-table__cell:nth-child(4)) {
      flex-basis: 100% !important;
    }
  }
}
</style>
