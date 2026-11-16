<template>
  <div class="roles">
    <Teleport defer to="#navbar-actions">
      <VBaseButton size="header" @click="addRole">
        <VIcon name="add" :size="16" />
        {{ $t("roles.add") }}
      </VBaseButton>
    </Teleport>

    <div class="roles__header">
      <VPageHeader :title="$t('roles.title')" :description="$t('roles.description')" />
    </div>

    <VTable
      v-model:sort="sort"
      class="roles__table"
      :columns="COLUMNS"
      :rows="roles_store.paginated_items"
      :empty-text="empty_text"
      clickable
      @row-click="openRole"
    >
      <template #cell-name="{ row }">
        <div class="roles__name">
          <strong>{{ row.name }}</strong>
          <span v-if="row.description" :title="row.description">{{ row.description }}</span>
        </div>
      </template>

      <template #cell-is_system="{ value }">
        <span class="roles__type">
          <VChip :tone="value ? 'action' : 'default'">
            {{ value ? $t("roles.type.system") : $t("roles.type.custom") }}
          </VChip>
        </span>
      </template>

      <template #cell-user_count="{ value }">
        <strong class="roles__users">{{ value }}</strong>
      </template>

      <!-- jedan slot za svih 11 kolona dozvola -->
      <template
        v-for="permission in PERMISSIONS"
        #[`cell-${permission.key}`]="{ value }"
        :key="permission.key"
      >
        <span
          class="roles__permission"
          role="img"
          :aria-label="
            $t('roles.permission_value', {
              permission: permission.label,
              value: value ? $t('common.yes') : $t('common.no')
            })
          "
        >
          <VIcon
            :name="value ? 'check' : 'close'"
            :size="16"
            :color="value ? 'icon-action' : 'cold-225'"
          />
        </span>
      </template>

      <!-- sistemske uloge ne mogu da se mijenjaju ni brisu -->
      <template #actions="{ row }">
        <VDropdown v-if="!row.is_system" :label="$t('roles.row_actions', { name: row.name })">
          <VMenu>
            <VMenuItem :label="$t('common.actions.edit')" @click="editRole(row)" />
            <VMenuItem :label="$t('common.actions.delete')" danger @click="deleteRole(row)" />
          </VMenu>
        </VDropdown>
      </template>

      <template #footer>
        <p class="roles__count">
          <strong>{{ roles_store.paginated_items.length }}</strong>
          {{ $t("roles.count_of", { count: roles_store.total_items }) }}
        </p>
        <VPagination v-model="page" :total-pages="roles_store.total_pages" />
      </template>
    </VTable>

    <RoleDrawer v-model:open="is_drawer_open" :role="selected_role" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import VTable from "@/components/VTable.vue";
import VChip from "@/components/VChip.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import VPagination from "@/components/VPagination.vue";
import { useRolesStore } from "@/stores/roles";
import { getErrorMessage } from "@/utils/api-error";
import { PERMISSIONS } from "./permissions";
import RoleDrawer from "./components/RoleDrawer.vue";
import { t } from "@/i18n";

// kolone rastu kad ima mjesta, na uskom ekranu se suzavaju do minWidth
// computed: naslovi prate promjenu jezika
const COLUMNS = computed(() => [
  {
    key: "name",
    label: t("roles.columns.name"),
    width: "9.5rem",
    minWidth: "7rem",
    grow: true,
    sortable: true
  },
  {
    key: "is_system",
    label: t("roles.columns.type"),
    width: "6rem",
    minWidth: "6rem",
    sortable: true
  },
  {
    key: "user_count",
    label: t("roles.columns.user_count"),
    width: "5.75rem",
    minWidth: "2.5rem",
    grow: true,
    sortable: true
  },
  ...PERMISSIONS.map(({ key, label, width }) => ({
    key,
    label,
    width,
    minWidth: "2.5rem",
    grow: true,
    sortable: true
  }))
]);

const roles_store = useRolesStore();

const sort = computed({
  get: () => roles_store.sort,
  set: (value) => roles_store.setSort(value)
});

const page = computed({
  get: () => roles_store.page,
  set: (value) => (roles_store.page = value)
});

// null je nova uloga, inace detalji izabrane
const is_drawer_open = ref(false);
const selected_role = ref(null);

function openRole(role) {
  selected_role.value = role;
  is_drawer_open.value = true;
}

function addRole() {
  openRole(null);
}

function editRole(role) {
  openRole(role);
}

// brisanje je trajno, pa prvo pitamo
async function deleteRole(role) {
  const question = t("roles.delete_confirm", {
    name: role.name,
    employee: t("roles.system.employee.name")
  });

  if (!window.confirm(question)) return;

  const error = await roles_store.deleteRole(role.id);

  if (error) window.alert(getErrorMessage(error));
}

const empty_text = computed(() => {
  if (roles_store.is_loading) return t("common.states.loading");
  if (roles_store.error) return getErrorMessage(roles_store.error);

  return t("roles.empty");
});

onMounted(() => roles_store.fetchRoles());

onUnmounted(() => roles_store.resetStore());
</script>

<style lang="scss" scoped>
.roles {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
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
    box-shadow: $shadow-small;

    // 14 kolona, uzi razmaci da tabela stane bez skrola
    :deep(.v-table__cell:not(.v-table__cell--actions)) {
      padding-right: $space-6;
      padding-left: $space-6;
    }

    // na manjim ekranima kolone su preuske za veci razmak
    @include respond-to("desktop") {
      :deep(.v-table__cell--head) {
        gap: $space-4;
      }
    }

    // naslov od dvije rijeci ide u dva reda, strelice stoje uz njega
    :deep(.v-table__label) {
      width: min-content;
    }

    // sve kolone osim prve su centrirane
    :deep(.v-table__cell--head:nth-child(n + 2)),
    :deep(.v-table__row .v-table__cell:nth-child(n + 2):not(.v-table__cell--actions)) {
      justify-content: center;
      text-align: center;
    }

    // strelice za sort zauzimaju previse mjesta
    @include respond-to("laptop") {
      :deep(.v-table__cell--head:nth-child(n + 3) .v-table__sort) {
        display: none;
      }
    }

    // ni bez strelica rijeci ne staju, pa naslovi idu uspravno
    @include respond-to("laptop-sm") {
      :deep(.v-table__cell--head) {
        height: auto;
        min-height: 3rem;
      }

      :deep(.v-table__cell--head:nth-child(n + 3) .v-table__label) {
        width: auto;
        white-space: nowrap;
        writing-mode: vertical-rl;
        transform: rotate(180deg);
      }
    }
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

  // cip sistemska ili prilagodjena na sredini kolone
  &__type {
    @include flex(center, center);
    width: 100%;
  }

  &__users {
    font-weight: $weight-semibold;
  }

  &__permission {
    display: inline-flex;
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

  @include respond-to("tablet-sm") {
    &__header {
      padding: $space-8;
    }

    &__table {
      margin: $space-8;
    }

    &__table :deep(.v-table__footer) {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
}
</style>
