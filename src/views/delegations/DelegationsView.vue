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

    <!-- sve (getAllDelegations) ili samo moje (getMyDelegations) -->
    <VTabs v-model="scope" :tabs="tabs" />

    <div class="delegations__body">
      <div class="delegations__inner">
        <!-- prvo učitavanje: kostur -->
        <div v-if="is_initial_loading" class="delegations__skeleton" aria-hidden="true">
          <span v-for="index in 4" :key="`s${index}`" class="delegations__skeleton-stat" />
          <span class="delegations__skeleton-hero" />
          <span v-for="index in 3" :key="`c${index}`" class="delegations__skeleton-card" />
        </div>
        <p v-if="is_initial_loading" class="visually-hidden">{{ $t("common.states.loading") }}</p>

        <div
          v-else-if="delegations_store.error && !delegations_store.is_loaded"
          class="delegations__state is-error"
        >
          <span class="delegations__state-icon">
            <VIcon name="error_outline" :size="28" />
          </span>
          <p class="delegations__state-title">{{ error_text }}</p>
          <VBaseButton
            appearance="outlined"
            size="small"
            @click="delegations_store.fetchDelegations()"
          >
            {{ $t("common.actions.retry") }}
          </VBaseButton>
        </div>

        <template v-else>
          <!-- brojke za cijeli spisak, bez obzira na pretragu i filter -->
          <dl class="delegations__stats" :aria-label="$t('delegations.summary.label')">
            <div
              v-for="stat in stats"
              :key="stat.key"
              :class="['delegations__stat', `is-${stat.key}`]"
            >
              <dt>
                <VIcon :name="stat.icon" :size="16" />
                {{ stat.label }}
              </dt>
              <dd>{{ stat.value }}</dd>
            </div>
          </dl>

          <div v-if="delegations_store.my_active_items.length" class="delegations__heroes">
            <DelegationActiveCard
              v-for="item in delegations_store.my_active_items"
              :key="item.id"
              :delegation="item"
              :current-user-id="delegations_store.current_user_id"
              @edit="editDelegation"
              @deactivate="deactivateDelegation"
            />
          </div>

          <p v-if="delegations_store.error" class="delegations__inline-error" role="alert">
            {{ error_text }}
          </p>

          <div v-if="!delegations_store.grouped_items.length" class="delegations__state">
            <span class="delegations__state-icon">
              <VIcon :name="is_filtered ? 'search_off' : 'supervisor_account'" :size="28" />
            </span>
            <p class="delegations__state-title">
              {{ $t(is_filtered ? "delegations.empty_filtered" : "delegations.empty") }}
            </p>
            <p class="delegations__state-hint">
              {{ $t(is_filtered ? "delegations.empty_filtered_hint" : "delegations.empty_hint") }}
            </p>
            <VBaseButton v-if="is_filtered" appearance="outlined" size="small" @click="clearAll">
              {{ $t("delegations.clear_filters") }}
            </VBaseButton>
            <VBaseButton v-else size="small" @click="addDelegation">
              <VIcon name="add" :size="16" />
              {{ $t("delegations.add") }}
            </VBaseButton>
          </div>

          <ol
            v-else
            :class="['delegations__groups', { 'is-refreshing': delegations_store.is_loading }]"
            :aria-label="$t('delegations.list_label')"
            :aria-busy="delegations_store.is_loading"
          >
            <li
              v-for="group in delegations_store.grouped_items"
              :key="group.key"
              :class="['delegations__group', `is-${group.key}`]"
            >
              <h3 class="delegations__group-header">
                <span class="delegations__group-title">
                  {{ $t(`delegations.groups.${group.key}`) }}
                </span>
                <span class="delegations__group-count">
                  {{ $t("delegations.count", { count: group.items.length }) }}
                </span>
              </h3>

              <ul class="delegations__grid">
                <li v-for="item in group.items" :key="item.id">
                  <DelegationCard
                    :delegation="item"
                    :current-user-id="delegations_store.current_user_id"
                    @edit="editDelegation"
                    @deactivate="deactivateDelegation"
                  />
                </li>
              </ul>
            </li>
          </ol>
        </template>
      </div>
    </div>

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
import VTabs from "@/components/VTabs.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import DelegationAddDrawer from "./components/DelegationAddDrawer.vue";
import DelegationSettingsDrawer from "./components/DelegationSettingsDrawer.vue";
import DelegationEditDrawer from "./components/DelegationEditDrawer.vue";
import DelegationDeactivateDialog from "./components/DelegationDeactivateDialog.vue";
import DelegationActiveCard from "./components/DelegationActiveCard.vue";
import DelegationCard from "./components/DelegationCard.vue";
import { DELEGATION_STATES, useDelegationsStore } from "@/stores/delegations";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const delegations_store = useDelegationsStore();

const tabs = computed(() => [
  { value: "all", label: t("delegations.tabs.all") },
  { value: "mine", label: t("delegations.tabs.mine") }
]);

const scope = computed({
  get: () => (delegations_store.show_mine ? "mine" : "all"),
  set: (value) => delegations_store.setMine(value === "mine")
});

// stanje se računa iz statusa i perioda, filter je na klijentu
const status_options = computed(() =>
  DELEGATION_STATES.map((value) => ({ value, label: t(`delegations.status.${value}`) }))
);

const stats = computed(() => {
  const counts = delegations_store.state_counts;

  return [
    { key: "total", icon: "supervisor_account", value: counts.total },
    { key: "active", icon: "check_circle", value: counts.active },
    { key: "scheduled", icon: "event", value: counts.scheduled },
    { key: "ended", icon: "history", value: counts.ended }
  ].map((stat) => ({ ...stat, label: t(`delegations.summary.${stat.key}`) }));
});

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

// prazno stanje: briše i pretragu i filter
function clearAll() {
  delegations_store.setSearch("");
  clearFilters();
}

const search = computed({
  get: () => delegations_store.search,
  set: (value) => delegations_store.setSearch(value)
});

const is_filtered = computed(
  () => !!delegations_store.search.trim() || delegations_store.has_filters
);

const is_initial_loading = computed(
  () => delegations_store.is_loading && !delegations_store.is_loaded
);

const error_text = computed(() =>
  getErrorMessage(delegations_store.error, t("common.states.error"))
);

// bočni paneli, otvaraju se kad su true
const is_add_open = ref(false);
const is_settings_open = ref(false);

function addDelegation() {
  is_add_open.value = true;
}

function openSettings() {
  is_settings_open.value = true;
}

// panel delegacije i dijalog za deaktivaciju rade nad istom karticom
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

// na ulasku samo getAllDelegations, zaposlene učitava panel
onMounted(() => delegations_store.fetchDelegations());
</script>

<style lang="scss" scoped>
.delegations {
  --page-bg: #{$cold-50};

  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  background: var(--page-bg);

  // header je nastavak navbara
  &__header {
    position: relative;
    z-index: 3;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__search {
    width: 18rem;
  }

  &__filters.v-btn {
    color: $fg-action;
  }

  &__body {
    min-height: 0;
    overflow-y: auto;
  }

  &__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: $space-16;
    max-width: 72rem;
    margin: 0 auto;
    padding: $space-16 $space-24 $space-32;
  }

  // traka sa brojkama
  &__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-10;
    margin: 0;
  }

  &__stat {
    --state: #{$cold-550};

    @include flex(space-between, flex-start, $space-6, column);
    position: relative;
    padding: $space-12 $space-16 $space-12 $space-20;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;

    // crtica u boji statusa
    &::before {
      content: "";
      position: absolute;
      top: $space-14;
      bottom: $space-14;
      left: $space-8;
      width: 3px;
      background: var(--state);
      border-radius: $radius-pill;
    }

    &.is-active {
      --state: #{$success-500};
    }

    &.is-scheduled {
      --state: #{$information-500};
    }

    &.is-ended {
      --state: #{$cold-300};
    }

    dt {
      @include flex(flex-start, center, $space-6);
      font-size: $text-12;
      font-weight: $weight-semibold;
      color: $fg-body;

      :deep(.v-icon) {
        color: var(--state);
      }
    }

    &.is-ended dt :deep(.v-icon) {
      color: $icon-default;
    }

    dd {
      margin: 0;
      font-size: $text-26;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      color: $fg-heading;
    }
  }

  &__heroes {
    display: grid;
    gap: $space-12;
  }

  &__inline-error {
    font-size: $text-12;
    color: $fg-error;
  }

  &__groups {
    display: grid;
    gap: $space-8;
    list-style: none;
    transition: opacity 0.2s ease;

    &.is-refreshing {
      opacity: 0.55;
    }
  }

  // zaglavlje grupe se lijepi dok se skroluje
  &__group-header {
    @include flex(flex-start, center, $space-8);
    position: sticky;
    top: 0;
    z-index: 2;
    margin: 0 (-$space-4);
    padding: $space-8 $space-4;
    font-size: $text-13;
    background: var(--page-bg);

    &::before {
      content: "";
      width: 0.5rem;
      height: 0.5rem;
      background: var(--state, #{$cold-300});
      border-radius: 50%;
    }

    // linija do kraja reda poslije brojača
    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: $border-default;
    }
  }

  &__group.is-active {
    --state: #{$success-500};
  }

  &__group.is-scheduled {
    --state: #{$information-500};
  }

  &__group-title {
    font-weight: $weight-bold;
    color: $fg-heading;
  }

  &__group-count {
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xxs;
    color: $fg-body;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-pill;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr));
    gap: $space-10;
    padding-bottom: $space-8;
    list-style: none;
  }

  // prazno stanje i greška
  &__state {
    @include flex(center, center, $space-8, column);
    padding: $space-40 $space-24;
    text-align: center;
    background: $surface-default;
    border: 1px dashed $border-default;
    border-radius: $radius-xl;

    .v-btn {
      margin-top: $space-8;
    }
  }

  &__state-icon {
    @include flex(center, center);
    width: 3.5rem;
    height: 3.5rem;
    margin-bottom: $space-4;
    color: $primary-500;
    background: $alpha-primary-10;
    border-radius: 50%;
  }

  &__state.is-error &__state-icon {
    color: $error-500;
    background: $alpha-red;
  }

  &__state-title {
    font-size: $text-14;
    font-weight: $weight-bold;
    color: $fg-heading;
  }

  &__state-hint {
    max-width: 24rem;
    font-size: $text-13;
    color: $fg-body;
  }

  // kostur
  &__skeleton {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-10;
  }

  &__skeleton-stat,
  &__skeleton-hero,
  &__skeleton-card {
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
    animation: delegations-pulse 1.2s ease-in-out infinite;
  }

  &__skeleton-stat {
    height: 4.75rem;
  }

  &__skeleton-hero {
    grid-column: 1 / -1;
    height: 10rem;
    margin: $space-6 0;
    border-radius: $radius-xl;
  }

  &__skeleton-card {
    grid-column: span 2;
    height: 9rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @include respond-to("tablet-sm") {
    &__header {
      padding: $space-8;
    }

    &__search {
      flex: 1 1 12rem;
      width: auto;
      min-width: 0;
    }

    &__inner {
      padding: $space-12 $space-12 $space-24;
    }

    &__stats,
    &__skeleton {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @include respond-to("mobile") {
    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}

@keyframes delegations-pulse {
  50% {
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .delegations__skeleton-stat,
  .delegations__skeleton-hero,
  .delegations__skeleton-card {
    animation: none;
  }
}
</style>
