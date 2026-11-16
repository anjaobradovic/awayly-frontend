<template>
  <div class="calendar">
    <!-- novi zahtev se odmah vidi u kalendaru -->
    <SubmitRequestButton @submitted="calendar_store.refreshAfterSubmit" />

    <div class="calendar__header">
      <VPageHeader :title="$t('calendar.title')" :description="$t('calendar.description')">
        <template #actions>
          <VBaseButton
            :class="['calendar__mine', { 'is-active': calendar_store.is_mine }]"
            appearance="outlined"
            size="header"
            :aria-pressed="calendar_store.is_mine"
            @click="calendar_store.toggleMine()"
          >
            <VIcon name="person" :size="16" filled />
            {{ $t("calendar.mine") }}
          </VBaseButton>

          <VBaseInput
            v-model="search"
            class="calendar__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('calendar.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>

          <VFilterPopup
            v-model:open="is_filter_open"
            :title="$t('calendar.filter_title')"
            :clear-label="$t('calendar.clear_filters')"
            :apply-label="$t('calendar.apply_filters')"
            :can-clear="calendar_store.has_filters"
            :count="calendar_store.filter_count"
            @apply="applyFilters"
            @clear="clearFilters"
          >
            <template #trigger="{ toggle, open }">
              <VBaseButton
                class="calendar__filters"
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
              v-model="draft_type_id"
              :label="$t('calendar.leave_type')"
              :placeholder="$t('calendar.leave_type_placeholder')"
              :options="calendar_store.leave_type_options"
            />
          </VFilterPopup>
        </template>
      </VPageHeader>
    </div>

    <div class="calendar__body">
      <CalendarSummary
        :groups="summary_groups"
        :selected="calendar_store.selected_type"
        @select="calendar_store.selectType"
      />

      <CalendarToolbar
        v-model:view="view"
        v-model:status="status"
        :title="calendar_store.title"
        :range="calendar_store.range_label"
        :shows-today="calendar_store.shows_today"
        :status-options="calendar_store.status_options"
        @shift="calendar_store.shift"
        @today="calendar_store.goToToday()"
      />

      <p v-if="message" class="calendar__message">{{ message }}</p>

      <CalendarMonth
        v-else-if="calendar_store.view === 'month'"
        :title="calendar_store.title"
        :period="calendar_store.period"
        :grid-period="calendar_store.grid_period"
        :entries="calendar_store.sorted_entries"
        :holidays="calendar_store.holidays"
        @open="openDetails"
      />

      <CalendarYear
        v-else
        :year="Number(calendar_store.period.from.slice(0, 4))"
        :entries="calendar_store.sorted_entries"
        @pick="calendar_store.openMonth"
      />
    </div>


    <RequestDetailsDrawer ref="details_ref" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import CalendarSummary from "./components/CalendarSummary.vue";
import CalendarToolbar from "./components/CalendarToolbar.vue";
import CalendarMonth from "./components/CalendarMonth.vue";
import CalendarYear from "./components/CalendarYear.vue";
import RequestDetailsDrawer from "@/views/requests/components/RequestDetailsDrawer.vue";
import SubmitRequestButton from "@/views/requests/components/SubmitRequestButton.vue";
import { summaryGroups } from "./calendar-config";
import { useCalendarStore } from "@/stores/calendar";
import { useRequestsStore } from "@/stores/requests";
import { useDebounce } from "@/composables/useDebounce";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const calendar_store = useCalendarStore();
// tipovi sa saldom za formu Podnesi zahtjev
const requests_store = useRequestsStore();

const summary_groups = computed(() => summaryGroups(calendar_store.type_counts));

const view = computed({
  get: () => calendar_store.view,
  set: (value) => calendar_store.setView(value)
});

const status = computed({
  get: () => calendar_store.status,
  set: (value) => calendar_store.setStatus(value)
});

const search_text = ref(calendar_store.search);
const fetchSearch = useDebounce((value) => calendar_store.setSearch(value), 300);

const search = computed({
  get: () => search_text.value,
  set: (value) => {
    search_text.value = value;
    fetchSearch(value);
  }
});

const is_filter_open = ref(false);
const draft_type_id = ref(null);

watch(is_filter_open, (open) => {
  if (open) draft_type_id.value = calendar_store.leave_type_id;
});

function applyFilters() {
  calendar_store.setLeaveType(draft_type_id.value);
  is_filter_open.value = false;
}

function clearFilters() {
  calendar_store.setLeaveType(null);
  is_filter_open.value = false;
}

const details_ref = ref(null);


function openDetails(entry) {
  if (entry.kind !== "holiday") details_ref.value?.show(entry.id);
}

const message = computed(() => {
  if (calendar_store.error) return getErrorMessage(calendar_store.error);
  if (calendar_store.is_loading && !calendar_store.entries.length) return t("common.states.loading");
  return "";
});

onMounted(() => {
  calendar_store.fetchCalendar();
  calendar_store.fetchLeaveTypes();
  requests_store.fetchLeaveTypes();
});

onUnmounted(() => calendar_store.resetStore());
</script>

<style lang="scss" scoped>
.calendar {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  background: $cold-50;

  &__header {
    position: relative;
    z-index: 1;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__body {
    overflow-y: auto;
    @include thin-scrollbar($primary);
  }

  &__search {
    width: 18.75rem;
  }

  &__filters.v-btn {
    color: $fg-action;
  }


  &__mine.is-active {
    color: $fg-action;
    border-color: $border-action;
    background: $alpha-primary-5;
  }

  &__message {
    padding: $space-24 $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
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
  }
}
</style>
