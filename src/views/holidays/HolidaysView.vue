<template>
  <div class="holidays">
    <!-- državni praznici su read-only (API 3.1), pa dugme postoji samo na kompanijskom tabu -->
    <Teleport v-if="scope === 'company'" defer to="#navbar-actions">
      <VBaseButton size="header" @click="openDrawer(null, 'add')">
        <VIcon name="add" :size="16" />
        {{ $t("holidays.add") }}
      </VBaseButton>
    </Teleport>

    <div class="holidays__header">
      <VPageHeader :title="$t('holidays.title')" :description="$t('holidays.description')">
        <template #actions>
          <VFilterPopup
            v-model:open="is_filter_open"
            :title="$t('holidays.filter_title')"
            :can-clear="holidays_store.has_filters"
            :count="holidays_store.filter_count"
            @apply="applyFilters"
            @clear="clearFilters"
          >
            <template #trigger="{ toggle, open }">
              <VBaseButton
                class="holidays__filters"
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
              v-if="scope === 'state'"
              v-model="draft_filters.type"
              :label="$t('holidays.filters.kind')"
              :placeholder="$t('holidays.filters.kind_placeholder')"
              :options="holidays_store.type_options"
            />
            <VSelect
              v-model="draft_filters.year"
              :label="$t('holidays.filters.year')"
              :placeholder="$t('holidays.filters.year_placeholder')"
              icon="today"
              icon-color="fg-action"
              :options="holidays_store.year_options"
            />
          </VFilterPopup>
        </template>
      </VPageHeader>
    </div>
    <VTabs v-model="scope" :tabs="tabs" />

    <VTable
      v-model:sort="sort"
      class="holidays__table"
      :columns="columns"
      :rows="holidays_store.paginated_items"
      :empty-text="empty_text"
      clickable
      @row-click="openDrawer($event, 'details')"
    >
      <template #cell-name="{ value }">
        {{ script(value) }}
      </template>

      <template #cell-kind="{ value }">
        {{ holidayKindLabel(value) }}
      </template>

      <template #cell-date="{ value }">
        {{ formatDate(value, { dateOnly: true }) }}
      </template>

      <!-- kompanijski imaju meni, državni samo Detalji praznika -->
      <template #actions="{ row }">
        <VDropdown
          v-if="row.scope === 'company'"
          :label="$t('holidays.actions_for', { name: row.name })"
        >
          <VMenu>
            <VMenuItem :label="$t('common.actions.edit')" @click="openDrawer(row, 'edit')" />
            <VMenuItem :label="$t('common.actions.delete')" danger @click="openDelete(row)" />
          </VMenu>
        </VDropdown>
        <button
          v-else
          type="button"
          class="holidays__details"
          :aria-label="$t('holidays.details_for', { name: row.name })"
          @click="openDrawer(row, 'details')"
        >
          <VIcon name="more_vert" :size="18" />
        </button>
      </template>

      <template #footer>
        <p class="holidays__count">
          <strong>{{ holidays_store.paginated_items.length }}</strong>
          {{ $t("holidays.count", { total: holidays_store.total_items }) }}
        </p>
        <VPagination v-model="page" :total-pages="holidays_store.total_pages" />
      </template>
    </VTable>

    <HolidayDrawer
      v-model:open="is_drawer_open"
      :holiday="selected_holiday"
      :mode="drawer_mode"
      @delete="openDelete"
    />

    <HolidayDeleteDialog
      v-model:open="is_delete_open"
      :holiday="selected_holiday"
      @deleted="is_drawer_open = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import VTabs from "@/components/VTabs.vue";
import VTable from "@/components/VTable.vue";
import VPagination from "@/components/VPagination.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import HolidayDrawer from "./components/HolidayDrawer.vue";
import HolidayDeleteDialog from "./components/HolidayDeleteDialog.vue";
import { useHolidaysStore } from "@/stores/holidays";
import { useDate } from "@/composables/useDate";
import { getErrorMessage } from "@/utils/api-error";
import { holidayKindLabel } from "@/stores/holidays";
import { script, t } from "@/i18n";

const tabs = computed(() => [
  { value: "state", label: t("holidays.tabs.state") },
  { value: "company", label: t("holidays.tabs.company") }
]);

// label je ključ prevoda
const ALL_COLUMNS = [
  { key: "name", label: "holidays.columns.name", width: "260px", sortable: true },
  { key: "date", label: "holidays.columns.period", width: "260px", sortable: true },
  { key: "kind", label: "holidays.columns.kind", sortable: true }
];

const holidays_store = useHolidaysStore();

// kompanijski nemaju kolonu Vrsta, pa Period popunjava ostatak reda
const columns = computed(() => {
  const translated = ALL_COLUMNS.map((column) => ({ ...column, label: t(column.label) }));

  return scope.value === "company"
    ? translated
        .filter((column) => column.key !== "kind")
        .map((column) => (column.key === "date" ? { ...column, grow: true } : column))
    : translated;
});
const { formatDate } = useDate();

const is_filter_open = ref(false);
const draft_filters = ref({ ...holidays_store.filters });

watch(is_filter_open, (open) => {
  if (open) draft_filters.value = { ...holidays_store.filters };
});

function applyFilters() {
  holidays_store.setFilters(draft_filters.value);
  is_filter_open.value = false;
}

function clearFilters() {
  holidays_store.clearFilters();
  is_filter_open.value = false;
}

const scope = computed({
  get: () => holidays_store.scope,
  set: (value) => holidays_store.setScope(value)
});

const sort = computed({
  get: () => holidays_store.sort,
  set: (value) => holidays_store.setSort(value)
});

const page = computed({
  get: () => holidays_store.page,
  set: (value) => (holidays_store.page = value)
});
const empty_text = computed(() => {
  if (holidays_store.is_loading) return t("common.states.loading");
  if (holidays_store.error) return getErrorMessage(holidays_store.error, t("common.states.error"));

  return t("holidays.empty");
});

// bočni panel: "add" = Dodaj praznik, "details" = pregled (klik na red), "edit" = izmena
const is_drawer_open = ref(false);
const drawer_mode = ref("add");
const selected_holiday = ref(null);

function openDrawer(holiday, mode) {
  selected_holiday.value = holiday;
  drawer_mode.value = mode;
  is_drawer_open.value = true;
}

// potvrda brisanja, iz menija ili iz panela
const is_delete_open = ref(false);

function openDelete(holiday) {
  selected_holiday.value = holiday;
  is_delete_open.value = true;
}

onMounted(() => holidays_store.fetchHolidays());

onUnmounted(() => holidays_store.resetStore());
</script>

<style lang="scss" scoped>
.holidays {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  height: 100%;
  // siva pozadina strane, tabela je bijela kutija
  background: $cold-50;

  &__header {
    position: relative;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__filters.v-btn {
    color: $fg-action;
  }

  &__details {
    @include flex(center, center);
    padding: $space-4;
    color: $icon-default;
    background: transparent;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:hover {
      color: $fg-heading;
      background: $surface-default-hover;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
  }

  &__table {
    min-height: 0;
    margin: $space-16;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    // sjenka oko tabele
    box-shadow: $shadow-small;
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
}
</style>
