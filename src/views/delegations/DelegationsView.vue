<template>
  <div class="delegations">
    <Teleport defer to="#navbar-actions">
      <VBaseButton size="header" @click="addDelegation">
        <VIcon name="add" :size="16" />
        {{ $t("delegations.add") }}
      </VBaseButton>
    </Teleport>

    <div class="delegations__header">
      <VPageHeader :title="$t('delegations.title')" :description="$t('delegations.description')">
        <template #actions>
          <VBaseButton appearance="outlined" size="header" @click="openSettings">
            <VIcon name="settings" :size="16" filled />
            {{ $t("delegations.settings_button") }}
          </VBaseButton>

          <!-- uključi/isključi: samo moje delegacije (getMyDelegations) -->
          <VBaseButton
            :class="['delegations__mine', { 'is-active': delegations_store.show_mine }]"
            appearance="outlined"
            size="header"
            :aria-pressed="delegations_store.show_mine"
            @click="delegations_store.toggleMine()"
          >
            <VIcon name="person" :size="16" filled />
            {{ $t("delegations.mine") }}
          </VBaseButton>

          <VBaseInput
            v-model="search"
            class="delegations__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('delegations.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>

          <VFilterPopup
            v-model:open="is_filter_open"
            :title="$t('delegations.filter_title')"
            :can-clear="delegations_store.has_filters"
            :count="delegations_store.filter_count"
            @apply="applyFilters"
            @clear="clearFilters"
          >
            <template #trigger="{ toggle, open }">
              <VBaseButton
                class="delegations__filters"
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
              v-model="draft_filters.status"
              :label="$t('delegations.status_label')"
              :placeholder="$t('delegations.status_placeholder')"
              :options="status_options"
            />
          </VFilterPopup>
        </template>
      </VPageHeader>
    </div>

    <VTable
      v-model:sort="sort"
      class="delegations__table"
      :columns="columns"
      :rows="delegations_store.paginated_items"
      :empty-text="empty_text"
      clickable
      @row-click="editDelegation"
    >
      <template #cell-delegated_to="{ value }">
        <span class="delegations__name">{{ script(value) }}</span>
      </template>

      <template #cell-delegated_by="{ value }">
        <span class="delegations__name">{{ script(value) }}</span>
      </template>

      <!-- kolona je sortirana po start_date, a prikazuje ceo period -->
      <template #cell-start_date="{ row }">
        {{ formatDate(row.start_date, { dateOnly: true }) }} -
        {{ formatDate(row.end_date, { dateOnly: true }) }}
      </template>

      <template #cell-is_active="{ value }">
        <VChip
          :tone="value ? 'active' : 'inactive'"
          :icon="value ? 'check_circle' : 'remove_circle'"
        >
          {{ $t(value ? "delegations.status.active" : "delegations.status.inactive") }}
        </VChip>
      </template>

      <template #cell-created_at="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <template #cell-updated_at="{ value }">
        {{ value ? formatDateTime(value) : "–" }}
      </template>

      <template #actions="{ row }">
        <VDropdown :label="$t('delegations.actions_for', { name: row.delegated_by })">
          <VMenu>
            <VMenuItem
              :label="$t(row.is_active ? 'common.actions.edit' : 'common.actions.details')"
              @click="editDelegation(row)"
            />
            <!-- API zna samo za otkazivanje, pa se nudi samo za aktivne -->
            <VMenuItem
              v-if="row.is_active"
              :label="$t('delegations.deactivate')"
              @click="deactivateDelegation(row)"
            />
          </VMenu>
        </VDropdown>
      </template>

      <template #footer>
        <p class="delegations__count">
          <strong>{{ delegations_store.paginated_items.length }}</strong>
          {{
            $t("delegations.count", {
              count: delegations_store.total_items,
              total: delegations_store.total_items
            })
          }}
        </p>
        <VPagination v-model="page" :total-pages="delegations_store.total_pages" />
      </template>
    </VTable>

    <DelegationAddDrawer v-model:open="is_add_open" />
    <DelegationSettingsDrawer v-model:open="is_settings_open" />
    <DelegationEditDrawer v-model:open="is_edit_open" :delegation="selected_delegation" />
    <DelegationDeactivateDialog
      v-model:open="is_deactivate_open"
      :delegation="selected_delegation"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VTable from "@/components/VTable.vue";
import VChip from "@/components/VChip.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import VPagination from "@/components/VPagination.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import DelegationAddDrawer from "./components/DelegationAddDrawer.vue";
import DelegationSettingsDrawer from "./components/DelegationSettingsDrawer.vue";
import DelegationEditDrawer from "./components/DelegationEditDrawer.vue";
import DelegationDeactivateDialog from "./components/DelegationDeactivateDialog.vue";
import { useDelegationsStore } from "@/stores/delegations";
import { useDate } from "@/composables/useDate";
import { getErrorMessage } from "@/utils/api-error";
import { script, t } from "@/i18n";

// širine kolona, label je ključ prevoda
const COLUMNS = [
  {
    key: "delegated_to",
    label: "delegations.columns.delegated_to",
    width: "260px",
    sortable: true
  },
  {
    key: "delegated_by",
    label: "delegations.columns.delegated_by",
    width: "260px",
    sortable: true
  },
  { key: "start_date", label: "delegations.columns.period", width: "260px", sortable: true },
  { key: "is_active", label: "delegations.columns.status", width: "200px", sortable: true },
  { key: "created_at", label: "delegations.columns.created_at", width: "220px", sortable: true },
  { key: "updated_at", label: "delegations.columns.updated_at", sortable: true }
];

const columns = computed(() => COLUMNS.map((column) => ({ ...column, label: t(column.label) })));

// vrijednosti idu direktno u ?status=
const status_options = computed(() => [
  { value: "ACTIVE", label: t("delegations.status.active") },
  { value: "CANCELLED", label: t("delegations.status.inactive") }
]);

const delegations_store = useDelegationsStore();
const { formatDate } = useDate();
const is_filter_open = ref(false);
const draft_filters = ref({ ...delegations_store.filters });

watch(is_filter_open, (open) => {
  if (open) draft_filters.value = { ...delegations_store.filters };
});

function applyFilters() {
  delegations_store.setFilters(draft_filters.value);
  is_filter_open.value = false;
}
function clearFilters() {
  delegations_store.clearFilters();
  is_filter_open.value = false;
}

const search = computed({
  get: () => delegations_store.search,
  set: (value) => delegations_store.setSearch(value)
});

const sort = computed({
  get: () => delegations_store.sort,
  set: (value) => delegations_store.setSort(value)
});

const page = computed({
  get: () => delegations_store.page,
  set: (value) => (delegations_store.page = value)
});

const formatDateTime = (value) => formatDate(value).replace(" ", " - ");

// bočni paneli, otvaraju se kad su true
const is_add_open = ref(false);
const is_settings_open = ref(false);

function addDelegation() {
  is_add_open.value = true;
}

function openSettings() {
  is_settings_open.value = true;
}

// panel delegacije i dijalog za deaktivaciju rade nad istim redom
const selected_delegation = ref(null);
const is_edit_open = ref(false);
const is_deactivate_open = ref(false);

function editDelegation(delegation) {
  selected_delegation.value = delegation;
  is_edit_open.value = true;
}

// deaktivacija se ne može vratiti, pa prvo potvrda
function deactivateDelegation(delegation) {
  selected_delegation.value = delegation;
  is_deactivate_open.value = true;
}

const empty_text = computed(() => {
  if (delegations_store.is_loading) return t("common.states.loading");
  if (delegations_store.error) {
    return getErrorMessage(delegations_store.error, t("common.states.error"));
  }

  return t("delegations.empty");
});

// na ulasku samo getAllDelegations, zaposlene učitava panel
onMounted(() => delegations_store.fetchDelegations());
</script>

<style lang="scss" scoped>
.delegations {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  // siva pozadina strane, tabela je bijela kutija
  background: $cold-50;

  // header je nastavak navbara, relative bez z-index da prekrije senku navbara
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

  // uključen "Moje delegacije" izgleda kao aktivan filter
  &__mine.v-btn.is-active {
    color: $fg-action;
    background: $alpha-primary-5;
    border-color: $border-action;
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
    @include truncate;
    font-weight: $weight-semibold;
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
