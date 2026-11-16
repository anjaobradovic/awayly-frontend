<template>
  <div class="absence-types">
    <Teleport defer to="#navbar-actions">
      <VBaseButton size="header" @click="addType">
        <VIcon name="add" :size="16" />
        {{ $t("absence_types.add") }}
      </VBaseButton>
    </Teleport>

    <div class="absence-types__header">
      <VPageHeader :title="$t('absence_types.title')" :description="$t('absence_types.description')">
        <template #actions>
          <VBaseInput
            v-model="search"
            class="absence-types__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('absence_types.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>
        </template>
      </VPageHeader>
    </div>

    <div class="absence-types__content">
      <!-- brojevi nad svim tipovima -->
      <dl class="absence-types__summary" :aria-label="$t('absence_types.summary.label')">
        <div v-for="stat in stats" :key="stat.key" class="absence-types__stat">
          <span class="absence-types__stat-icon" aria-hidden="true">
            <VIcon :name="stat.icon" :size="20" />
          </span>
          <div class="absence-types__stat-text">
            <dt>{{ stat.label }}</dt>
            <dd>{{ is_first_load ? "–" : stat.value }}</dd>
          </div>
        </div>
      </dl>

      <div class="absence-types__toolbar">
        <VSegmentedButton v-model="kind" :options="kind_options" size="small" />
        <VSelect
          v-model="sort"
          class="absence-types__sort"
          size="header"
          leading-icon="swap_vert"
          :options="sort_options"
          :aria-label="$t('absence_types.sort.label')"
        />
      </div>

      <!-- učitavanje: sive kartice -->
      <div v-if="is_first_load" class="absence-types__grid">
        <div v-for="index in 6" :key="index" class="absence-types__skeleton" aria-hidden="true">
          <span class="is-tile" />
          <span class="is-title" />
          <span class="is-box" />
          <span class="is-line" />
          <span class="is-line is-short" />
        </div>
        <span class="absence-types__sr">{{ $t("common.states.loading") }}</span>
      </div>

      <div v-else-if="types_store.error" class="absence-types__state" role="alert">
        <span class="absence-types__state-icon is-error" aria-hidden="true">
          <VIcon name="error_outline" :size="28" />
        </span>
        <strong>{{ getErrorMessage(types_store.error, $t("common.states.error")) }}</strong>
      </div>

      <div v-else-if="!types_store.total_items" class="absence-types__state">
        <span class="absence-types__state-icon" aria-hidden="true">
          <VIcon :name="has_types ? 'search_off' : 'category'" :size="28" />
        </span>
        <strong>{{ has_types ? $t("absence_types.no_results") : $t("absence_types.empty") }}</strong>
        <p>
          {{ has_types ? $t("absence_types.no_results_text") : $t("absence_types.empty_text") }}
        </p>
        <VBaseButton
          v-if="has_types"
          size="small"
          appearance="outlined"
          color="neutral"
          @click="types_store.resetFilters()"
        >
          {{ $t("absence_types.reset_filters") }}
        </VBaseButton>
        <VBaseButton v-else size="small" @click="addType">
          <VIcon name="add" :size="16" />
          {{ $t("absence_types.add") }}
        </VBaseButton>
      </div>

      <template v-else>
        <!-- ista podjela u 4 grupe kao na zahtjevima i kalendaru -->
        <section
          v-for="group in groups"
          :key="group.key"
          class="absence-types__group"
          :style="{ '--group-accent': resolveColor(group.accent) }"
          :aria-labelledby="`absence-group-${group.key}`"
        >
          <header class="absence-types__group-header">
            <span class="absence-types__group-icon" aria-hidden="true">
              <VIcon :name="GROUP_ICONS[group.key] ?? 'event'" :size="18" />
            </span>
            <h2 :id="`absence-group-${group.key}`" class="absence-types__group-title">
              {{ group.title }}
            </h2>
            <span class="absence-types__group-count">
              {{ $t("absence_types.group_count", { count: group.types.length }) }}
            </span>
          </header>

          <div class="absence-types__grid">
            <AbsenceTypeCard
              v-for="type in group.types"
              :key="type.id"
              :type="type"
              :accent="group.accent"
              @details="showType"
              @edit="editType"
              @delete="deleteType"
            />
          </div>
        </section>

        <p class="absence-types__count">
          {{
            $t("absence_types.shown_count", {
              count: types_store.total_items,
              total: types_store.items.length
            })
          }}
        </p>
      </template>
    </div>

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
import { computed, onMounted, onUnmounted, ref } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VSelect from "@/components/VSelect.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import AbsenceTypeCard from "./components/AbsenceTypeCard.vue";
import AbsenceTypeAddDrawer from "./components/AbsenceTypeAddDrawer.vue";
import AbsenceTypeDetailsDrawer from "./components/AbsenceTypeDetailsDrawer.vue";
import AbsenceTypeDeleteDialog from "./components/AbsenceTypeDeleteDialog.vue";
import { REQUEST_GROUPS, groupKeyOf } from "@/views/requests/request-config";
import {
  ABSENCE_TYPE_KINDS,
  ABSENCE_TYPE_SORTS,
  useAbsenceTypesStore
} from "@/stores/absence-types";
import { getErrorMessage } from "@/utils/api-error";
import { leaveTypeSourceName } from "@/utils/leave-type-name";
import { resolveColor } from "@/utils/color";
import { t } from "@/i18n";

// iste ikonice grupa kao na kalendaru
const GROUP_ICONS = {
  vacation: "beach_access",
  family: "favorite_border",
  paid: "payments",
  other: "more_horiz"
};

const types_store = useAbsenceTypesStore();

const search = computed({
  get: () => types_store.search,
  set: (value) => types_store.setSearch(value)
});

const kind = computed({
  get: () => types_store.kind,
  set: (value) => types_store.setKind(value)
});

const sort = computed({
  get: () => types_store.sort,
  set: (value) => types_store.setSort(value)
});

const kind_options = computed(() =>
  ABSENCE_TYPE_KINDS.map((value) => ({ value, label: t(`absence_types.kind_filter.${value}`) }))
);

const sort_options = computed(() =>
  Object.keys(ABSENCE_TYPE_SORTS).map((value) => ({
    value,
    label: t(`absence_types.sort.${value}`)
  }))
);

// skeleton samo dok prvi put stižu podaci
const is_first_load = computed(() => types_store.is_loading && !types_store.items.length);
const has_types = computed(() => types_store.items.length > 0);

const stats = computed(() => {
  const { total, system, custom, balance } = types_store.summary;

  return [
    { key: "total", icon: "category", label: t("absence_types.summary.total"), value: total },
    { key: "system", icon: "lock", label: t("absence_types.summary.system"), value: system },
    { key: "custom", icon: "tune", label: t("absence_types.summary.custom"), value: custom },
    {
      key: "balance",
      icon: "account_balance_wallet",
      label: t("absence_types.summary.balance"),
      value: balance
    }
  ];
});

// API nema grupe tipova; nepoznat tip ide u Ostalo, kao na zahtjevima
const keyOf = (type) => groupKeyOf(leaveTypeSourceName(type.api_name ?? type.name));

// samo grupe koje imaju bar jedan tip posle filtera
const groups = computed(() =>
  REQUEST_GROUPS.map((group) => ({
    key: group.key,
    accent: group.accent,
    title: group.title,
    types: types_store.filtered_items.filter((type) => keyOf(type) === group.key)
  })).filter((group) => group.types.length)
);

const groupTitle = (type) => REQUEST_GROUPS.find((group) => group.key === keyOf(type))?.title ?? "";

// bočni panel za dodavanje tipa
const is_add_open = ref(false);

function addType() {
  is_add_open.value = true;
}

// panel sa detaljima, otvara se klikom na karticu
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

onMounted(() => types_store.fetchTypes());

// filteri se ne pamte između posjeta
onUnmounted(() => types_store.resetFilters());
</script>

<style lang="scss" scoped>
.absence-types {
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

  // jedna grupa tipova: zaglavlje sa ikonicom u boji pa kartice
  &__group {
    @include flex(flex-start, stretch, $space-12, column);
  }

  &__group-header {
    @include flex(flex-start, center, $space-10);
    padding-bottom: $space-8;
    border-bottom: 1px solid $border-default;
  }

  &__group-icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    color: var(--group-accent);
    background: color-mix(in srgb, var(--group-accent) 16%, transparent);
    border-radius: 50%;
  }

  &__group-title {
    @include truncate;
    min-width: 0;
    font-size: $text-16;
    font-weight: $weight-bold;
    letter-spacing: -0.01em;
    color: $fg-heading;
  }

  &__group-count {
    flex-shrink: 0;
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-bold;
    line-height: $leading-xs;
    color: var(--group-accent);
    background: color-mix(in srgb, var(--group-accent) 12%, transparent);
    border-radius: $radius-pill;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr));
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
      animation: absence-types-pulse 1.4s ease-in-out infinite;
    }

    .is-tile {
      width: 3rem;
      height: 3rem;
      border-radius: $radius-lg;
    }

    .is-title {
      width: 55%;
      height: 1rem;
    }

    .is-box {
      height: 3.25rem;
      margin: $space-4 0;
    }

    .is-short {
      width: 70%;
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

  &__count {
    padding: $space-4 0;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
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
      gap: $space-10;
      padding: $space-10 $space-12;
    }

    // usko: bez ikonice, natpis se prelama umesto tri tačke
    &__stat-icon {
      display: none;
    }

    &__stat-text dt {
      white-space: normal;
    }

    &__stat-text dd {
      font-size: $text-20;
    }

    &__sort {
      width: 100%;
    }
  }
}

@keyframes absence-types-pulse {
  50% {
    opacity: 0.5;
  }
}
</style>
