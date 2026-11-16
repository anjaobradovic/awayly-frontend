<template>
  <div class="teams">
    <Teleport defer to="#navbar-actions">
      <VBaseButton size="header" @click="addTeam">
        <VIcon name="add" :size="16" />
        {{ $t("teams.add") }}
      </VBaseButton>
    </Teleport>

    <div class="teams__header">
      <VPageHeader :title="$t('teams.title')" :description="$t('teams.description')">
        <template #actions>
          <VBaseInput
            v-model="team_search"
            class="teams__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('teams.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>
        </template>
      </VPageHeader>
    </div>

    <div class="teams__content">
      <!-- lista timova lijevo, izabrani tim desno -->
      <div class="teams__list">
        <TeamCard
          v-for="item in teams_store.filtered_teams"
          :key="item.id"
          :team="item"
          :active="item.id === teams_store.selected_id"
          @select="teams_store.selectTeam"
        />
        <p v-if="!teams_store.filtered_teams.length" class="teams__message">{{ list_text }}</p>
      </div>

      <section v-if="team" class="teams__panel">
        <header class="teams__panel-header">
          <div class="teams__titles">
            <h2 class="teams__title">
              {{ team.name }}
              <span class="teams__title-count">({{ team.member_count }})</span>
            </h2>
            <!-- Vođa tima, pa ikonica i ime -->
            <p v-if="team.lead_name" class="teams__lead">
              <span class="teams__lead-label">{{ $t("teams.lead") }}</span>
              <span class="teams__lead-name">
                <VIcon name="admin_panel_settings" :size="20" filled color="icon-action" />
                {{ team.lead_name }}
              </span>
            </p>
          </div>

          <div class="teams__panel-actions">
            <span v-if="team.updated_at" class="teams__updated">
              {{
                $t("teams.last_change", { date: formatDate(team.updated_at, { dateOnly: true }) })
              }}
            </span>
            <VBaseButton class="teams__details" appearance="outlined" @click="openDetails">
              <VIcon name="settings" :size="16" filled />
              {{ $t("teams.details") }}
            </VBaseButton>
          </div>
        </header>

        <!-- akcije lijevo, pretraga članova desno -->
        <div class="teams__toolbar">
          <div class="teams__toolbar-actions">
            <VBaseButton appearance="text" @click="is_add_members_open = true">
              <VIcon name="add_circle_outline" :size="16" />
              {{ $t("teams.add_members") }}
            </VBaseButton>
            <VBaseButton
              class="teams__remove"
              appearance="outlined"
              color="neutral"
              size="small"
              :disabled="!teams_store.checked_ids.length"
              @click="removeChecked"
            >
              <VIcon name="remove_circle_outline" :size="14" />
              {{ $t("teams.remove_members") }}
            </VBaseButton>
          </div>

          <VBaseInput
            v-model="member_search"
            class="teams__member-search"
            appearance="outlined"
            size="header"
            :placeholder="$t('teams.member_search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>
        </div>

        <VTable
          v-model:sort="sort"
          class="teams__table"
          :columns="columns"
          :rows="teams_store.paginated_members"
          :empty-text="empty_text"
          :row-class="(row) => ({ 'is-selected': isChecked(row) })"
          clickable
          @row-click="showMember"
        >
          <template #head-select>
            <VCheckbox
              :model-value="all_checked"
              :disabled="!teams_store.paginated_members.length"
              :aria-label="$t('teams.select_all')"
              @update:model-value="teams_store.toggleAllOnPage"
            />
          </template>

          <template #cell-select="{ row }">
            <span @click.stop>
              <VCheckbox
                :model-value="isChecked(row)"
                :aria-label="$t('teams.select_member', { name: row.name })"
                @update:model-value="teams_store.toggleChecked(row.id)"
              />
            </span>
          </template>

          <template #cell-name="{ value }">
            <strong class="teams__name">{{ value }}</strong>
          </template>

          <template #cell-role="{ value }">
            <VChip tone="action">{{ value }}</VChip>
          </template>

          <template #cell-email="{ value }">
            <span class="teams__email" :title="value">{{ value }}</span>
          </template>

          <template #cell-hire_date="{ value }">
            {{ value ? formatDate(value, { dateOnly: true }) : "—" }}
          </template>

          <template #actions="{ row }">
            <VDropdown :label="$t('teams.row_actions', { name: row.name })">
              <VMenu>
                <VMenuItem :label="$t('teams.member_details')" @click="showMember(row)" />
                <VMenuItem
                  :label="$t('teams.remove_member')"
                  danger
                  @click="removeMembers([row])"
                />
              </VMenu>
            </VDropdown>
          </template>

          <template #footer>
            <p class="teams__count">
              <strong>{{ teams_store.paginated_members.length }}</strong>
              {{ $t("teams.count_of", { count: teams_store.total_items }) }}
            </p>
            <VPagination v-model="page" :total-pages="teams_store.total_pages" />
          </template>
        </VTable>
      </section>
    </div>

    <TeamDrawer
      v-model:open="is_drawer_open"
      :mode="drawer_mode"
      :team="drawer_mode === 'details' ? team : null"
      @delete="is_delete_open = true"
    />
    <TeamDeleteDialog
      v-model:open="is_delete_open"
      :team="team"
      @deleted="is_drawer_open = false"
    />
    <TeamAddMembers v-model:open="is_add_members_open" />
    <TeamRemoveMembersDialog
      v-model:open="is_remove_open"
      :members="remove_members"
      @removed="is_details_open = false"
    />

    <EmployeeDetailsDrawer
      v-model:open="is_details_open"
      :transition="drawer_transition"
      :employee-id="member_id"
      :editable="false"
    >
      <template #footer>
        <VBaseButton
          class="teams__drawer-remove"
          appearance="tonal"
          color="error"
          :disabled="!current_member"
          @click="removeMembers([current_member])"
        >
          {{ $t("teams.remove_from_team") }}
        </VBaseButton>
        <VBaseButton appearance="outlined" color="neutral" @click="is_details_open = false">
          {{ $t("common.actions.close") }}
        </VBaseButton>
        <VBaseButton @click="editFromDetails">{{ $t("common.actions.edit") }}</VBaseButton>
      </template>
    </EmployeeDetailsDrawer>
    <EmployeeEditDrawer
      v-model:open="is_edit_open"
      :transition="drawer_transition"
      :employee-id="member_id"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VCheckbox from "@/components/VCheckbox.vue";
import VChip from "@/components/VChip.vue";
import VDropdown from "@/components/VDropdown.vue";
import VIcon from "@/components/VIcon.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VPagination from "@/components/VPagination.vue";
import VTable from "@/components/VTable.vue";
import { useDate } from "@/composables/useDate";
import { useEmployeesStore } from "@/stores/employees";
import { useTeamsStore } from "@/stores/teams";
import { getErrorMessage } from "@/utils/api-error";
import EmployeeDetailsDrawer from "@/views/employees/components/EmployeeDetailsDrawer.vue";
import EmployeeEditDrawer from "@/views/employees/components/EmployeeEditDrawer.vue";
import TeamCard from "./components/TeamCard.vue";
import TeamDrawer from "./components/TeamDrawer.vue";
import TeamDeleteDialog from "./components/TeamDeleteDialog.vue";
import TeamAddMembers from "./components/TeamAddMembers.vue";
import TeamRemoveMembersDialog from "./components/TeamRemoveMembersDialog.vue";
import { COLUMNS } from "./team-config";
import { t } from "@/i18n";

const teams_store = useTeamsStore();
const employees_store = useEmployeesStore();
const { formatDate } = useDate();

const team = computed(() => teams_store.selected_team);

const columns = computed(() =>
  COLUMNS.map((column) => ({ ...column, label: column.label && t(column.label) }))
);

const team_search = computed({
  get: () => teams_store.team_search,
  set: (value) => teams_store.setTeamSearch(value)
});

const member_search = computed({
  get: () => teams_store.member_search,
  set: (value) => teams_store.setMemberSearch(value)
});

const sort = computed({
  get: () => teams_store.sort,
  set: (value) => teams_store.setSort(value)
});

const page = computed({
  get: () => teams_store.page,
  set: (value) => (teams_store.page = value)
});

const isChecked = (row) => teams_store.checked_ids.includes(row.id);

const all_checked = computed(
  () =>
    teams_store.paginated_members.length > 0 &&
    teams_store.paginated_members.every((row) => isChecked(row))
);

const is_drawer_open = ref(false);
const drawer_mode = ref("add");
const is_delete_open = ref(false);

function addTeam() {
  drawer_mode.value = "add";
  is_drawer_open.value = true;
}

function openDetails() {
  drawer_mode.value = "details";
  is_drawer_open.value = true;
}

const is_add_members_open = ref(false);
const is_remove_open = ref(false);
const remove_members = ref([]);

function removeMembers(members) {
  remove_members.value = members;
  is_remove_open.value = true;
}

function removeChecked() {
  removeMembers(teams_store.members.filter((member) => isChecked(member)));
}

const is_details_open = ref(false);
const is_edit_open = ref(false);
const member_id = ref(null);
const drawer_transition = ref("slide");

const current_member = computed(
  () => teams_store.members.find((member) => member.id === member_id.value) ?? null
);

function showMember(member) {
  member_id.value = member.id;
  drawer_transition.value = "slide";
  is_details_open.value = true;
}

function editFromDetails() {
  drawer_transition.value = "dissolve";
  is_details_open.value = false;
  is_edit_open.value = true;
}

watch(is_edit_open, (open) => {
  if (!open) teams_store.fetchMembers();
});

const list_text = computed(() => {
  if (teams_store.is_loading) return t("common.states.loading");
  if (teams_store.error) return getErrorMessage(teams_store.error);
  if (teams_store.team_search) return t("teams.empty.no_search_teams");

  return t("teams.empty.no_teams");
});

const empty_text = computed(() => {
  if (teams_store.is_members_loading) return t("common.states.loading");
  if (teams_store.members_error) return getErrorMessage(teams_store.members_error);
  if (teams_store.member_search) return t("teams.empty.no_search_members");

  return t("teams.empty.no_members");
});

onMounted(() => {
  teams_store.fetchTeams();
  employees_store.fetchOptions();
});

onUnmounted(() => teams_store.resetStore());
</script>
<style scoped lang="scss">
.teams {
  display: grid;
  // minmax(0, 1fr): kolona se ne širi do pune širine tabele, tabela skroluje u sebi
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  // siva pozadina strane, vidi se iza kartica timova
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

  &__content {
    display: flex;
    gap: $space-4;
    min-height: 0;
    padding: $space-16;
  }

  &__list {
    @include flex(flex-start, stretch, $space-12, column);
    flex: 0 0 22.5rem;
    min-height: 0;
    padding: $space-2 $space-8 $space-16 $space-2;
    // uzak skrol sa crvenom ručicom
    @include thin-scrollbar($primary);
  }

  &__message {
    padding: $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  &__panel {
    @include flex(flex-start, stretch, 0, column);
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    box-shadow: $shadow-small;
  }

  &__panel-header {
    position: relative;
    z-index: 1;
    @include flex(space-between, center, $space-16);
    padding: $space-16 $space-12;
    background: $surface-default;
    box-shadow: $shadow-small;
  }

  &__titles {
    @include flex(flex-start, flex-start, $space-16, column);
    min-width: 0;
  }

  &__title {
    font-size: $text-20;
    font-weight: $weight-semibold;
    line-height: $leading-24;
    color: $fg-heading;
  }

  &__title-count {
    font-size: $text-16;
    line-height: $leading-sm;
  }

  &__lead {
    @include flex(flex-start, center, $space-8);
    font-size: $text-14;
  }

  &__lead-label {
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__lead-name {
    @include flex(flex-start, center, $space-4);
    line-height: $leading-18;
    color: $fg-heading;
  }

  &__panel-actions {
    @include flex(flex-end, center, $space-12);
    flex-shrink: 0;
  }

  &__details.v-btn {
    color: $fg-heading;
  }

  &__updated {
    white-space: nowrap;
    padding: $space-2 $space-8;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    background: $cold-25;
    border: 1px solid $cold-75;
    border-radius: $radius-xl;
  }

  &__toolbar {
    @include flex(space-between, center, $space-16);
    padding: $space-12 $space-16;
    background: $surface-default;
  }

  &__toolbar-actions {
    @include flex(flex-start, center, $space-24);
  }

  &__remove.v-btn:disabled {
    opacity: 0.5;
  }

  &__member-search {
    width: 20.125rem;
  }

  &__table {
    flex: 1;
    min-height: 0;
  }

  &__table :deep(.v-checkbox__box) {
    margin: 0;
  }

  &__table :deep(.v-table__row.is-selected) {
    background: $cold-50;
    border-color: $cold-225;
  }

  &__name {
    @include truncate;
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__email {
    @include truncate;
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

  &__drawer-remove {
    margin-right: auto;
  }

  // uža lista timova, da tabeli ostane više mjesta
  @include respond-to("laptop-sm") {
    &__list {
      flex-basis: 18rem;
    }
  }

  // timovi idu u red iznad panela, panel dobija cijelu širinu
  @include respond-to("tablet") {
    &__content {
      flex-direction: column;
      gap: $space-12;
      padding: $space-8;
      overflow-y: auto;
    }

    &__list {
      flex: none;
      flex-direction: row;
      padding: $space-2 $space-2 $space-8;
      overflow-x: auto;
      overflow-y: visible;

      .team-card {
        flex: 0 0 16rem;
      }
    }

    &__panel {
      flex: 1 0 auto;
      min-height: 24rem;
    }

    &__panel-header,
    &__toolbar {
      flex-wrap: wrap;
    }

    &__search,
    &__member-search {
      flex: 1;
      width: auto;
      min-width: 0;
    }
  }

  // zaglavlje panela i akcije jedno ispod drugog
  @include respond-to("mobile") {
    &__header {
      padding: $space-8;
    }

    &__panel-header {
      flex-direction: column;
      align-items: stretch;
      gap: $space-12;
    }

    &__panel-actions {
      justify-content: space-between;
    }

    &__toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: $space-12;
      padding: $space-12;
    }

    &__toolbar-actions {
      justify-content: space-between;
      gap: $space-12;
    }

    &__member-search {
      flex: none;
      width: 100%;
    }

    &__list .team-card {
      flex-basis: 14rem;
    }
  }
}
</style>
