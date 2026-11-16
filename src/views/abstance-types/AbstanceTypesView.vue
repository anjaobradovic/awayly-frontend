<template>
  <div class="absence-types">
    <Teleport defer to="#navbar-actions">
      <VBaseButton size="header" @click="addType">
        <VIcon name="add" :size="16" />
        {{ $t("absence_types.add") }}
      </VBaseButton>
    </Teleport>

    <div class="absence-types__header">
      <VPageHeader
        :title="$t('absence_types.title')"
        :description="$t('absence_types.description')"
      />
    </div>

    <VTable
      v-model:sort="sort"
      class="absence-types__table"
      :columns="columns"
      :rows="types_store.paginated_items"
      :empty-text="empty_text"
      clickable
      @row-click="showType"
    >
      <template #cell-name="{ row }">
        <div class="absence-types__name">
          <strong>{{ row.name }}</strong>
          <!-- API nema grupe tipova, ista podjela kao na zahtjevima -->
          <span>{{ groupTitle(row) }}</span>
        </div>
      </template>

      <template #cell-requires_approval="{ value }">
        {{ $t(value ? "absence_types.approval.yes" : "absence_types.approval.no") }}
      </template>

      <template #cell-is_system="{ value }">
        <!-- sistemski tip ima crveni čip, prilagođeni sivi -->
        <VChip :tone="value ? 'action' : 'default'">
          {{ $t(value ? "absence_types.system" : "absence_types.custom") }}
        </VChip>
      </template>

      <template #cell-notice_days="{ value }">
        {{ $t("common.days", { count: value ?? 0 }) }}
      </template>

      <template #cell-requires_reason="{ value }">
        {{ $t(value ? "absence_types.reason.yes" : "absence_types.reason.no") }}
      </template>

      <template #cell-allow_past_dates="{ value }">
        {{ $t(value ? "absence_types.past_dates.yes" : "absence_types.past_dates.no") }}
      </template>

      <template #cell-reduces_balance="{ value }">
        {{ $t(value ? "absence_types.balance.yes" : "absence_types.balance.no") }}
      </template>

      <template #actions="{ row }">
        <!-- sistemski tipovi se ne mijenjaju ni ne brišu, samo Detalji -->
        <VDropdown :label="$t('absence_types.actions_for', { name: row.name })">
          <VMenu>
            <VMenuItem
              v-if="row.is_system"
              :label="$t('common.actions.details')"
              @click="showType(row)"
            />
            <template v-else>
              <VMenuItem :label="$t('common.actions.edit')" @click="editType(row)" />
              <VMenuItem :label="$t('common.actions.delete')" danger @click="deleteType(row)" />
            </template>
          </VMenu>
        </VDropdown>
      </template>

      <template #footer>
        <p class="absence-types__count">
          <strong>{{ types_store.paginated_items.length }}</strong>
          {{
            $t("absence_types.count", {
              count: types_store.total_items,
              total: types_store.total_items
            })
          }}
        </p>
        <VPagination v-model="page" :total-pages="types_store.total_pages" />
      </template>
    </VTable>

    <AbsenceTypeAddDrawer v-model:open="is_add_open" />
    <!-- isti panel kao za dodavanje, popunjen izabranim tipom -->
    <AbsenceTypeAddDrawer v-model:open="is_edit_open" :type="selected_type" />
    <AbsenceTypeDeleteDialog v-model:open="is_delete_open" :type="selected_type" />
    <AbsenceTypeDetailsDrawer
      v-model:open="is_details_open"
      :type="selected_type"
      :group="selected_type ? groupTitle(selected_type) : ''"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import VTable from "@/components/VTable.vue";
import VChip from "@/components/VChip.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import VPagination from "@/components/VPagination.vue";
import AbsenceTypeAddDrawer from "./components/AbsenceTypeAddDrawer.vue";
import AbsenceTypeDetailsDrawer from "./components/AbsenceTypeDetailsDrawer.vue";
import AbsenceTypeDeleteDialog from "./components/AbsenceTypeDeleteDialog.vue";
import { REQUEST_GROUPS, groupKeyOf } from "@/views/requests/request-config";
import { useAbsenceTypesStore } from "@/stores/absence-types";
import { getErrorMessage } from "@/utils/api-error";
import { leaveTypeSourceName } from "@/utils/leave-type-name";
import { script, t, te } from "@/i18n";

// label je ključ prevoda, prevodi se u computed ispod
const COLUMNS = [
  { key: "name", label: "absence_types.columns.name", width: "260px", sortable: true },
  {
    key: "requires_approval",
    label: "absence_types.columns.approval",
    width: "256px",
    sortable: true
  },
  { key: "is_system", label: "absence_types.columns.kind", width: "223px", sortable: true },
  { key: "notice_days", label: "absence_types.columns.notice", width: "238px", sortable: true },
  { key: "requires_reason", label: "absence_types.columns.reason", width: "220px", sortable: true },
  {
    key: "allow_past_dates",
    label: "absence_types.columns.past_dates",
    width: "259px",
    sortable: true
  },
  { key: "reduces_balance", label: "absence_types.columns.balance", sortable: true }
];

const columns = computed(() => COLUMNS.map((column) => ({ ...column, label: t(column.label) })));

const types_store = useAbsenceTypesStore();

const sort = computed({
  get: () => types_store.sort,
  set: (value) => types_store.setSort(value)
});

const page = computed({
  get: () => types_store.page,
  set: (value) => (types_store.page = value)
});

// bočni panel za dodavanje tipa
const is_add_open = ref(false);

function addType() {
  is_add_open.value = true;
}

// nepoznat tip ide u Ostalo, kao na zahtjevima
// mapa grupa je po srpskim nazivima; naslov grupe može biti tekst ili ključ prevoda
const groupTitle = (type) => {
  const key = groupKeyOf(leaveTypeSourceName(type.api_name ?? type.name));
  const title = REQUEST_GROUPS.find((group) => group.key === key)?.title ?? "";

  return title && te(title) ? t(title) : script(title);
};

// panel sa detaljima, otvara se klikom na red
const is_details_open = ref(false);
const selected_type = ref(null);

function showType(type) {
  selected_type.value = type;
  is_details_open.value = true;
}

// Izmeni (10.4) i Obriši (10.5, samo prilagođeni) iz menija
const is_edit_open = ref(false);
const is_delete_open = ref(false);

function editType(type) {
  selected_type.value = type;
  is_edit_open.value = true;
}

function deleteType(type) {
  selected_type.value = type;
  is_delete_open.value = true;
}

const empty_text = computed(() => {
  if (types_store.is_loading) return t("common.states.loading");
  if (types_store.error) return getErrorMessage(types_store.error, t("common.states.error"));

  return t("absence_types.empty");
});

onMounted(() => types_store.fetchTypes());
</script>

<style lang="scss" scoped>
.absence-types {
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

  &__table {
    min-height: 0;
    margin: $space-16;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    // senka oko tabele
    box-shadow: $shadow-small;
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
