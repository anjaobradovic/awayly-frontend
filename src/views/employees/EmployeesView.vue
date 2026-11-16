<template>
  <div class="employees">
    <Teleport defer to="#navbar-actions">
      <VBaseButton
        appearance="text"
        size="header"
        :disabled="is_downloading"
        @click="downloadTemplate"
      >
        <VIcon name="save_alt" :size="14" />
        {{ $t("employees.actions.download_template") }}
      </VBaseButton>

      <div class="employees__add">
        <VBaseButton class="employees__add-main" size="header" @click="addEmployee">
          <VIcon name="add" :size="16" />
          {{ $t("employees.actions.add") }}
        </VBaseButton>

        <VDropdown class="employees__add-more" :label="$t('employees.actions.more')">
          <template #trigger>
            <VIcon name="expand_more" :size="20" />
          </template>

          <VMenu>
            <VMenuItem :label="$t('employees.actions.import')" @click="importEmployees" />
            <VMenuItem
              :label="$t('employees.actions.import_template')"
              @click="importFromTemplate"
            />
          </VMenu>
        </VDropdown>
      </div>
    </Teleport>

    <div class="employees__header">
      <VPageHeader :title="$t('employees.title')" :description="$t('employees.description')">
        <template #actions>
          <VBaseInput
            v-model="search"
            class="employees__search"
            appearance="outlined"
            size="header"
:placeholder="$t('employees.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>

          <VFilterPopup
            v-model:open="is_filter_open"
:title="$t('employees.filter.title')"
            :can-clear="employees_store.has_filters"
            :count="employees_store.filter_count"
            @apply="applyFilters"
            @clear="clearFilters"
          >
            <template #trigger="{ toggle, open }">
              <VBaseButton
                class="employees__filters"
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
              v-model="draft_filters.manager_id"
:label="$t('employees.fields.manager')"
              :placeholder="$t('employees.fields.manager_placeholder')"
              :options="employees_store.manager_options"
            />
            <VSelect
              v-model="draft_filters.team_id"
:label="$t('employees.fields.team')"
              :placeholder="$t('employees.fields.team_placeholder')"
              :options="employees_store.team_options"
            />
          </VFilterPopup>
        </template>
      </VPageHeader>
    </div>

    <VTable
      v-model:sort="sort"
      class="employees__table"
      :columns="COLUMNS"
      :rows="employees_store.paginated_items"
      :empty-text="empty_text"
      clickable
      @row-click="showEmployee"
    >
      <template #cell-name="{ row }">
        <div class="employees__name">
          <strong>{{ row.name }}</strong>
          <span v-if="row.team">{{ row.team }}</span>
        </div>
      </template>

      <!-- email u jednom redu, cijeli se vidi na hover -->
      <template #cell-email="{ value }">
        <span class="employees__email" :title="value">{{ value }}</span>
      </template>

      <template #cell-status="{ value }">
        <div class="employees__status">
          <VChip :tone="STATUS_CHIPS[value]?.tone" :icon="STATUS_CHIPS[value]?.icon">
            {{ STATUS_CHIPS[value]?.label ?? value }}
          </VChip>

          <VTooltip
            v-if="STATUS_CHIPS[value]?.hint"
            :title="STATUS_CHIPS[value].hint.title"
            :text="STATUS_CHIPS[value].hint.text"
          >
            <span class="employees__hint">
              <VIcon name="info" :size="18" />
            </span>
          </VTooltip>
        </div>
      </template>

      <template #cell-date_of_birth="{ value }">
        {{ value ? formatDate(value, { dateOnly: true }) : "—" }}
      </template>

      <template #cell-hire_date="{ value }">
        {{ value ? formatDate(value, { dateOnly: true }) : "—" }}
      </template>

      <template #cell-balance="{ value }">
        <VProgressBar
          v-if="value"
          :value="value.remaining"
          :max="value.total"
          :label="$t('employees.balance_label')"
        />
        <span v-else>—</span>
      </template>

      <template #actions="{ row }">
        <VDropdown :label="$t('employees.row_actions', { name: row.name })">
          <VMenu>
            <VMenuItem :label="$t('common.actions.edit')" @click="editEmployee(row)" />
            <VMenuItem
              v-if="row.status !== 'DEACTIVATED'"
              :label="$t('common.actions.delete')"
              danger
              @click="deleteEmployee(row)"
            />
          </VMenu>
        </VDropdown>
      </template>

      <template #footer>
        <p class="employees__count">
          <strong>{{ employees_store.paginated_items.length }}</strong>
          {{ $t("employees.count_of", { count: employees_store.total_items }) }}
        </p>
        <VPagination v-model="page" :total-pages="employees_store.total_pages" />
      </template>
    </VTable>

    <EmployeeAddDrawer v-model:open="is_add_open" />
    <EmployeeImportDrawer v-model:open="is_import_open" />
    <EmployeeTemplateImportDrawer v-model:open="is_template_import_open" />
    <EmployeeDetailsDrawer
      v-model:open="is_details_open"
      :transition="drawer_transition"
      :employee-id="edit_employee_id"
      @edit="editFromDetails"
    />
    <EmployeeEditDrawer
      v-model:open="is_edit_open"
      :transition="drawer_transition"
      :employee-id="edit_employee_id"
      @deleted="return_to_details = false"
    />
    <EmployeeDeleteDialog v-model:open="is_delete_open" :employee-id="delete_employee_id" />
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
import VTooltip from "@/components/VTooltip.vue";
import { STATUS_CHIPS } from "./employee-config";
import VProgressBar from "@/components/VProgressBar.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import VPagination from "@/components/VPagination.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import EmployeeAddDrawer from "./components/EmployeeAddDrawer.vue";
import EmployeeEditDrawer from "./components/EmployeeEditDrawer.vue";
import EmployeeDetailsDrawer from "./components/EmployeeDetailsDrawer.vue";
import EmployeeDeleteDialog from "./components/EmployeeDeleteDialog.vue";
import EmployeeImportDrawer from "./components/EmployeeImportDrawer.vue";
import EmployeeTemplateImportDrawer from "./components/EmployeeTemplateImportDrawer.vue";
import { useEmployeesStore } from "@/stores/employees";
import { useDate } from "@/composables/useDate";
import { useDebounce } from "@/composables/useDebounce";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

// naslovi kolona su ključevi, prevode se u computed ispod
const COLUMN_DEFS = [
  { key: "name", width: "260px", minWidth: "10rem", sortable: true },
  { key: "role", width: "260px", minWidth: "6rem", sortable: true },
  { key: "status", width: "160px", minWidth: "8.5rem", sortable: true },
  { key: "email", width: "320px", minWidth: "13rem", sortable: true },
  {
    key: "date_of_birth",
    width: "220px",
    minWidth: "7.5rem",
    sortable: true
  },
  {
    key: "hire_date",
    width: "180px",
    minWidth: "8rem",
    sortable: true
  },
  // naslov u jednom redu, minWidth je naslov sa strelicom za sort
  {
    key: "balance",
    width: "320px",
    minWidth: "14.5rem",
    nowrap: true,
    sortable: true
  }
];

const COLUMNS = computed(() =>
  COLUMN_DEFS.map((column) => ({ ...column, label: t(`employees.columns.${column.key}`) }))
);

const employees_store = useEmployeesStore();
const { formatDate } = useDate();

const is_filter_open = ref(false);
const draft_filters = ref({ ...employees_store.filters });

watch(is_filter_open, (open) => {
  if (open) draft_filters.value = { ...employees_store.filters };
});

function applyFilters() {
  employees_store.setFilters(draft_filters.value);
  is_filter_open.value = false;
}

function clearFilters() {
  employees_store.clearFilters();
  is_filter_open.value = false;
}

// pretraga ide na backend
const fetchEmployeesDebounced = useDebounce(() => employees_store.fetchEmployees(), 300);

const search = computed({
  get: () => employees_store.search,
  set: (value) => {
    employees_store.setSearch(value);
    fetchEmployeesDebounced();
  }
});

const sort = computed({
  get: () => employees_store.sort,
  set: (value) => employees_store.setSort(value)
});

const page = computed({
  get: () => employees_store.page,
  set: (value) => (employees_store.page = value)
});

const is_downloading = ref(false);

async function downloadTemplate() {
  is_downloading.value = true;

  const error = await employees_store.downloadTemplate();

  is_downloading.value = false;

  if (error) window.alert(getErrorMessage(error));
}

const is_add_open = ref(false);

function addEmployee() {
  is_add_open.value = true;
}

// uvoz iz CSV-a sa pregledom i uvoz popunjenog šablona
const is_import_open = ref(false);
const is_template_import_open = ref(false);

function importEmployees() {
  is_import_open.value = true;
}

function importFromTemplate() {
  is_template_import_open.value = true;
}

const is_edit_open = ref(false);
const edit_employee_id = ref(null);

const is_details_open = ref(false);
// detalji i izmjena se pretapaju na mjestu, otvaranje i zatvaranje klizi sa strane
const drawer_transition = ref("slide");
// izmjena otvorena iz detalja se vraća na detalje
const return_to_details = ref(false);

function showEmployee(employee) {
  edit_employee_id.value = employee.id;
  is_details_open.value = true;
}

function editEmployee(employee) {
  edit_employee_id.value = employee.id;
  drawer_transition.value = "slide";
  return_to_details.value = false;
  is_edit_open.value = true;
}

function editFromDetails() {
  drawer_transition.value = "dissolve";
  is_details_open.value = false;
  return_to_details.value = true;
  is_edit_open.value = true;
}

watch(is_edit_open, (open) => {
  if (open || !return_to_details.value) return;

  return_to_details.value = false;
  is_details_open.value = true;

  // poslije pretapanja X opet zatvara klizanjem
  setTimeout(() => (drawer_transition.value = "slide"), 300);
});

const is_delete_open = ref(false);
const delete_employee_id = ref(null);

// Obriši je deaktivacija, potvrda u dijalogu
function deleteEmployee(employee) {
  delete_employee_id.value = employee.id;
  is_delete_open.value = true;
}

const empty_text = computed(() => {
  if (employees_store.is_loading) return t("common.states.loading");
  if (employees_store.error) return getErrorMessage(employees_store.error);

  return t("employees.empty");
});

onMounted(() => {
  employees_store.refresh();
});

onUnmounted(() => employees_store.resetStore());
</script>

<style lang="scss" scoped>
.employees {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  // siva pozadina strane, tabela je bijela kutija
  background: $cold-50;

  &__add {
    display: flex;
    gap: 1px;
  }

  &__add-main.v-btn {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  &__add-more :deep(.v-dropdown__trigger) {
    width: 2rem;
    height: $size-header;
    color: $fg-on-action;
    background: $surface-action;
    border-radius: 0 $radius-sm $radius-sm 0;

    &:hover {
      color: $fg-on-action;
      background: $surface-action-hover;
    }
  }

  &__header {
    position: relative;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__search {
    width: 20.125rem;
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

  &__filters.v-btn {
    color: $fg-action;
  }

  &__table {
    min-height: 0;
    margin: $space-16;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    box-shadow: $shadow-small;
  }

  // svi redovi iste visine, i kad zaposleni nema tim ili saldo
  &__table :deep(.v-table__row) {
    min-height: 3.875rem;
  }

  &__email {
    @include truncate;
  }

  &__name {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    min-width: 0;

    strong {
      @include truncate;
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    span {
      @include truncate;
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
    }
  }

  &__status {
    @include flex(flex-start, center, $space-4);
  }

  &__hint {
    display: inline-flex;
    color: $cold-350;
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
