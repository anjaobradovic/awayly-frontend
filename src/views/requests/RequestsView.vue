<template>
  <div class="requests">
    <SubmitRequestButton />

    <div class="requests__header">
      <VPageHeader :title="$t('requests.title')" :description="$t('requests.description')">
        <template #actions>
          <VBaseButton appearance="outlined" size="header" @click="openDelegations">
            <VIcon name="how_to_reg" :size="16" />
            {{ $t("requests.delegations") }}
          </VBaseButton>

          <!-- prekidač između zahtjeva koje odobravam i mojih -->
          <VBaseButton
            :class="['requests__mine', { 'is-active': is_mine }]"
            appearance="outlined"
            size="header"
            :aria-pressed="is_mine"
            @click="toggleMine"
          >
            <VIcon name="person" :size="16" filled />
            {{ $t("requests.mine") }}
          </VBaseButton>

          <VBaseInput
            v-model="search"
            class="requests__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('requests.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>

          <VFilterPopup
            v-model:open="is_filter_open"
            :title="$t('requests.filter_title')"
            :clear-label="$t('requests.clear_filters')"
            :apply-label="$t('requests.apply_filters')"
            :can-clear="requests_store.has_filters"
            :count="requests_store.filter_count"
            @apply="applyFilters"
            @clear="clearFilters"
          >
            <template #trigger="{ toggle, open }">
              <VBaseButton
                class="requests__filters"
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
              v-model="draft_filters.leave_type_id"
              :label="$t('requests.leave_type')"
              :placeholder="$t('requests.leave_type_placeholder')"
              :options="requests_store.leave_type_options"
            />
            <VDateInput
              v-model="draft_filters.from"
              :label="$t('requests.date_from')"
              :max="draft_filters.to"
            />
            <VDateInput
              v-model="draft_filters.to"
              :label="$t('requests.date_to')"
              :min="draft_filters.from"
            />
          </VFilterPopup>
        </template>
      </VPageHeader>

      <!-- greška akcije sa strane, npr. Odobri sve -->
      <div v-if="action_error" class="requests__action-error">
        <VNotice>{{ action_error }}</VNotice>
      </div>
    </div>

    <p v-if="message" class="requests__message">{{ message }}</p>

    <div v-else class="requests__groups">
      <RequestGroup
        v-for="group in groups"
        :key="group.key"
        :title="group.title"
        :accent="group.accent"
        :count="group.items.length"
        :approvable="!is_mine && group.items.some((request) => !request.is_decided)"
        @approve-all="approveAll(group)"
      >
        <RequestCard
          v-for="request in group.items"
          :key="request.id"
          :request="request"
          :approving="!is_mine"
          @approve="details_ref?.show(request.id)"
          @reject="details_ref?.show(request.id, { reject: true })"
          @open="details_ref?.show(request.id)"
          @cancel="openCancel"
        />
      </RequestGroup>
    </div>

    <!-- detalji zahtjeva, klik na karticu -->
    <RequestDetailsDrawer ref="details_ref" />

    <!-- otkazivanje sopstvenog zahtjeva -->
    <CancelRequestDialog v-model:open="is_cancel_open" :request="cancelling" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import RequestGroup from "./components/RequestGroup.vue";
import RequestCard from "./components/RequestCard.vue";
import CancelRequestDialog from "./components/CancelRequestDialog.vue";
import RequestDetailsDrawer from "./components/RequestDetailsDrawer.vue";
import SubmitRequestButton from "./components/SubmitRequestButton.vue";
import { REQUEST_GROUPS, groupKeyOf } from "./request-config";
import { useRequestsStore } from "@/stores/requests";
import VNotice from "@/components/VNotice.vue";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const requests_store = useRequestsStore();
const router = useRouter();

const details_ref = ref(null);

const is_mine = computed(() => requests_store.mode === "mine");

function toggleMine() {
  requests_store.setMode(is_mine.value ? "approve" : "mine");
}

// svaki zahtev ide u kolonu svog tipa (request-config.js)
const groups = computed(() =>
  REQUEST_GROUPS.map((group) => ({
    ...group,
    items: requests_store.filtered_items.filter(
      (request) => groupKeyOf(request.leave_type) === group.key
    )
  }))
);

const message = computed(() => {
  if (requests_store.is_loading && !requests_store.items.length) return t("common.states.loading");
  if (requests_store.error) return getErrorMessage(requests_store.error);
  return "";
});

const search = computed({
  get: () => requests_store.search,
  set: (value) => requests_store.setSearch(value)
});

// popup radi nad kopijom, store se mijenja tek na Primeni filtere
const is_filter_open = ref(false);
const draft_filters = ref({ ...requests_store.filters });

watch(is_filter_open, (open) => {
  if (open) draft_filters.value = { ...requests_store.filters };
});

function applyFilters() {
  requests_store.setFilters(draft_filters.value);
  is_filter_open.value = false;
}

function clearFilters() {
  requests_store.clearFilters();
  is_filter_open.value = false;
}

// Odobri i Odbij sa kartice otvaraju panel sa detaljima
// busy_id sprečava dupli klik dok traje Odobri sve
const busy_id = ref(null);
const action_error = ref("");

// Odobri sve ide redom, da se greška vidi kod pravog zahtjeva
async function approveAll(group) {
  if (busy_id.value !== null) return;

  action_error.value = "";

  for (const request of group.items.filter((item) => !item.is_decided)) {
    busy_id.value = request.id;
    const error = await requests_store.approveRequest(request.id);
    busy_id.value = null;

    if (error) {
      action_error.value = getErrorMessage(error);
      return;
    }
  }
}

const is_cancel_open = ref(false);
const cancelling = ref(null);

function openCancel(request) {
  cancelling.value = request;
  is_cancel_open.value = true;
}

function openDelegations() {
  router.push({ name: "delegations" });
}

onMounted(() => {
  requests_store.fetchRequests();
  requests_store.fetchLeaveTypes();
});

onUnmounted(() => requests_store.resetStore());
</script>

<style lang="scss" scoped>
.requests {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  // siva pozadina iza kolona
  background: $cold-50;

  &__header {
    position: relative;
    z-index: 1;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__search {
    width: 18.75rem;
  }

  &__filters.v-btn {
    color: $fg-action;
  }

  // uključeno Moji zahtjevi: crveni okvir i tekst
  &__mine.is-active {
    color: $fg-action;
    border-color: $border-action;
    background: $alpha-primary-5;
  }

  &__action-error {
    padding-top: $space-12;
  }

  &__message {
    padding: $space-24 $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  // četiri kolone, svaka skroluje sama (RequestGroup)
  &__groups {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    min-height: 0;
    padding: 0 $space-4;
  }

  // uži ekran: dvije kolone, skroluje cijeli dio sa karticama
  @include respond-to("laptop-sm") {
    &__groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: max-content;
      @include thin-scrollbar($primary);
    }

    &__groups :deep(.request-group__list) {
      flex: none;
      overflow: visible;
    }
  }

  // telefon: jedna kolona
  @include respond-to("tablet-sm") {
    &__groups {
      grid-template-columns: minmax(0, 1fr);
    }

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
