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
          <VBaseInput
            v-model="search"
            class="holidays__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('holidays.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>

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

    <div class="holidays__body">
      <div class="holidays__inner">
        <!-- prvo učitavanje: kostur -->
        <div v-if="is_initial_loading" class="holidays__skeleton" aria-hidden="true">
          <span class="holidays__skeleton-hero" />
          <span v-for="index in 4" :key="index" class="holidays__skeleton-card" />
        </div>
        <p v-if="is_initial_loading" class="visually-hidden">{{ $t("common.states.loading") }}</p>

        <div
          v-else-if="holidays_store.error && !holidays_store.is_loaded"
          class="holidays__state is-error"
        >
          <span class="holidays__state-icon">
            <VIcon name="error_outline" :size="28" />
          </span>
          <p class="holidays__state-title">{{ error_text }}</p>
          <VBaseButton appearance="outlined" size="small" @click="holidays_store.fetchHolidays()">
            {{ $t("common.actions.retry") }}
          </VBaseButton>
        </div>

        <template v-else>
          <HolidayNextCard
            :span="holidays_store.next_span"
            :counts="holidays_store.kind_counts"
            :year="holidays_store.year"
            @details="openDrawer($event, 'details')"
          />

          <p v-if="holidays_store.error" class="holidays__inline-error" role="alert">
            {{ error_text }}
          </p>

          <div class="holidays__list-head">
            <h2 class="holidays__list-title">
              {{ $t("holidays.year_title", { year: holidays_store.year }) }}
            </h2>
            <span class="holidays__list-count">
              {{ $t("holidays.month_count", { count: holidays_store.total_items }) }}
            </span>
          </div>

          <div v-if="!months.length" class="holidays__state">
            <span class="holidays__state-icon">
              <VIcon :name="is_filtered ? 'search_off' : 'event_busy'" :size="28" />
            </span>
            <p class="holidays__state-title">
              {{ is_filtered ? $t("holidays.empty_filtered") : $t("holidays.empty") }}
            </p>
            <p class="holidays__state-hint">{{ empty_hint }}</p>
            <VBaseButton v-if="is_filtered" appearance="outlined" size="small" @click="clearAll">
              {{ $t("holidays.clear_filters") }}
            </VBaseButton>
          </div>

          <ol
            v-else
            :class="['holidays__months', { 'is-refreshing': holidays_store.is_loading }]"
            :aria-label="$t('holidays.list_label')"
            :aria-busy="holidays_store.is_loading"
          >
            <li v-for="month in months" :key="month.key" class="holidays__month">
              <h3 class="holidays__month-header">
                <span class="holidays__month-title">{{ month.title }}</span>
                <span class="holidays__month-count">
                  {{ $t("holidays.month_count", { count: month.count }) }}
                </span>
              </h3>

              <ul class="holidays__grid">
                <li v-for="span in month.spans" :key="span.id">
                  <HolidayCard
                    :span="span"
                    @details="openDrawer($event, 'details')"
                    @edit="openDrawer($event, 'edit')"
                    @delete="openDelete"
                  />
                </li>
              </ul>
            </li>
          </ol>
        </template>
      </div>
    </div>

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
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VTabs from "@/components/VTabs.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import HolidayDrawer from "./components/HolidayDrawer.vue";
import HolidayDeleteDialog from "./components/HolidayDeleteDialog.vue";
import HolidayNextCard from "./components/HolidayNextCard.vue";
import HolidayCard from "./components/HolidayCard.vue";
import { useHolidaysStore } from "@/stores/holidays";
import { getErrorMessage } from "@/utils/api-error";
import { monthLong } from "./holiday-dates";
import { t } from "@/i18n";

const tabs = computed(() => [
  { value: "state", label: t("holidays.tabs.state") },
  { value: "company", label: t("holidays.tabs.company") }
]);

const holidays_store = useHolidaysStore();

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

// prazno stanje: briše i pretragu i filtere
function clearAll() {
  holidays_store.setSearch("");
  clearFilters();
}

const scope = computed({
  get: () => holidays_store.scope,
  set: (value) => holidays_store.setScope(value)
});

const search = computed({
  get: () => holidays_store.search,
  set: (value) => holidays_store.setSearch(value)
});

const is_initial_loading = computed(() => holidays_store.is_loading && !holidays_store.is_loaded);

// godina nije "skrivajući" filter, pa se ne računa
const is_filtered = computed(
  () => !!holidays_store.search.trim() || (scope.value === "state" && !!holidays_store.filters.type)
);

const error_text = computed(() => getErrorMessage(holidays_store.error, t("common.states.error")));

const empty_hint = computed(() => {
  if (is_filtered.value) return t("holidays.empty_filtered_hint");

  return t(scope.value === "company" ? "holidays.empty_hint_company" : "holidays.empty_hint_state");
});

// rasponi grupisani po mjesecu početka, hronološki
const months = computed(() => {
  const groups = new Map();

  for (const span of holidays_store.spans) {
    const key = span.start.slice(0, 7);

    if (!groups.has(key))
      groups.set(key, { key, title: monthLong(span.start), spans: [], count: 0 });

    const group = groups.get(key);

    group.spans.push(span);
    group.count += span.holidays.length;
  }

  return [...groups.values()];
});

// bočni panel: "add" = Dodaj praznik, "details" = pregled (klik na karticu), "edit" = izmena
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
  --page-bg: #{$cold-50};

  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  background: var(--page-bg);

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
    max-width: 64rem;
    margin: 0 auto;
    padding: $space-16 $space-24 $space-32;
  }

  &__inline-error {
    margin-top: $space-12;
    font-size: $text-12;
    color: $fg-error;
  }

  &__list-head {
    @include flex(flex-start, baseline, $space-8);
    margin-top: $space-24;
  }

  &__list-title {
    font-size: $text-16;
    font-weight: 800;
    letter-spacing: -0.01em;
    color: $fg-heading;
  }

  &__list-count {
    font-size: $text-12;
    color: $fg-body;
  }

  &__months {
    list-style: none;
    transition: opacity 0.2s ease;

    &.is-refreshing {
      opacity: 0.55;
    }
  }

  // zaglavlje mjeseca se lijepi dok se skroluje
  &__month-header {
    @include flex(flex-start, center, $space-8);
    position: sticky;
    top: 0;
    z-index: 2;
    margin: 0 (-$space-4);
    padding: $space-14 $space-4 $space-8;
    font-size: $text-13;
    background: var(--page-bg);
  }

  &__month-title {
    font-weight: $weight-bold;
    color: $fg-heading;
  }

  &__month-count {
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xxs;
    color: $fg-body;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-pill;
  }

  // linija do kraja reda poslije brojača
  &__month-header::after {
    content: "";
    flex: 1;
    height: 1px;
    background: $border-default;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
    gap: $space-10;
    padding-bottom: $space-8;
    list-style: none;
  }

  // prazno stanje i greška
  &__state {
    @include flex(center, center, $space-8, column);
    margin-top: $space-12;
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
    max-width: 22rem;
    font-size: $text-13;
    color: $fg-body;
  }

  // kostur
  &__skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
    gap: $space-10;
  }

  &__skeleton-hero,
  &__skeleton-card {
    background: $surface-default;
    border: 1px solid $border-default;
    animation: holidays-pulse 1.2s ease-in-out infinite;
  }

  &__skeleton-hero {
    grid-column: 1 / -1;
    height: 9rem;
    margin-bottom: $space-16;
    border-radius: $radius-xl;
  }

  &__skeleton-card {
    height: 5.5rem;
    border-radius: $radius-lg;
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
      flex: 1;
      width: auto;
      min-width: 0;
    }

    &__inner {
      padding: $space-12 $space-12 $space-24;
    }
  }

  @include respond-to("mobile") {
    &__grid,
    &__skeleton {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}

@keyframes holidays-pulse {
  50% {
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .holidays__skeleton-hero,
  .holidays__skeleton-card {
    animation: none;
  }
}
</style>
