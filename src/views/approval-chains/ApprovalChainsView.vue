<template>
  <div class="approval-chains">
    <Teleport defer to="#navbar-actions">
      <VBaseButton size="header" :disabled="!is_enabled" @click="addChain">
        <VIcon name="add" :size="16" />
        {{ $t("approval_chains.add") }}
      </VBaseButton>
    </Teleport>

    <div class="approval-chains__header">
      <VPageHeader :title="$t('approval_chains.title')" :description="$t('approval_chains.description')">
        <template #actions>
          <VSwitch
            :model-value="is_enabled"
            :label="$t('approval_chains.custom_switch')"
            :disabled="!company_store.company || is_switching"
            @update:model-value="setEnabled"
          />
        </template>
      </VPageHeader>
    </div>

    <div class="approval-chains__content">
      <p v-if="toggle_error" class="approval-chains__error" role="alert">{{ toggle_error }}</p>

      <!-- isključeno: važi samo podrazumevani lanac (vođa tima) -->
      <section v-if="company_store.company && !is_enabled" class="approval-chains__disabled">
        <VNotice tone="info">{{ $t("approval_chains.disabled.text") }}</VNotice>

        <article class="approval-chains__default">
          <div class="approval-chains__default-text">
            <h2>{{ $t("approval_chains.disabled.default_title") }}</h2>
            <p>{{ $t("approval_chains.disabled.default_scope") }}</p>
          </div>
          <div class="approval-chains__default-step">
            <VStepNumber :number="1" size="small" />
            <span>
              <strong>{{ $t("approval_chains.approver.TEAM_LEAD") }}</strong>
              <small>{{ $t("approval_chains.approver.team_lead_hint") }}</small>
            </span>
          </div>
          <VBaseButton :disabled="is_switching" @click="setEnabled(true)">
            <VIcon name="tune" :size="16" />
            {{ $t("approval_chains.disabled.enable") }}
          </VBaseButton>
        </article>

        <p v-if="approval_chains_store.chains.length" class="approval-chains__hint">
          {{ $t("approval_chains.disabled.saved") }}
        </p>
      </section>

      <p v-if="approval_chains_store.chains.length" class="approval-chains__count">
        <strong>{{ $t("approval_chains.list.count", { count: approval_chains_store.chains.length }) }}</strong>
        ·
        {{ $t("approval_chains.list.active_count", { count: approval_chains_store.active_count }) }}
      </p>

      <p v-if="message" class="approval-chains__message">{{ message }}</p>

      <div v-else class="approval-chains__grid">
        <ApprovalChainCard
          v-for="chain in approval_chains_store.chains"
          :key="chain.id"
          :chain="chain"
          :readonly="!is_enabled"
          :busy="toggling_id === chain.id"
          @edit="editChain"
          @delete="deleteChain"
          @toggle="toggleChain"
        />
      </div>
    </div>

    <ApprovalChainDrawer
      v-model:open="is_drawer_open"
      :chain="selected_chain"
      @delete="deleteChain"
    />
    <ApprovalChainDeleteDialog
      v-model:open="is_delete_open"
      :chain="delete_chain"
      @deleted="is_drawer_open = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import VNotice from "@/components/VNotice.vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VStepNumber from "@/components/VStepNumber.vue";
import VSwitch from "@/components/VSwitch.vue";
import { t } from "@/i18n";
import { useApprovalChainsStore } from "@/stores/approval-chains";
import { useCompanyStore } from "@/stores/company";
import { getErrorMessage } from "@/utils/api-error";
import { chainErrorMessage } from "./approval-chain-config";
import ApprovalChainCard from "./components/ApprovalChainCard.vue";
import ApprovalChainDeleteDialog from "./components/ApprovalChainDeleteDialog.vue";
import ApprovalChainDrawer from "./components/ApprovalChainDrawer.vue";

const approval_chains_store = useApprovalChainsStore();
const company_store = useCompanyStore();

// podešavanje kompanije, 8.2 updateCompany
const is_enabled = computed(() => Boolean(company_store.company?.custom_approval_chains_enabled));
const is_switching = ref(false);
const toggle_error = ref("");

async function setEnabled(value) {
  is_switching.value = true;
  toggle_error.value = "";

  try {
    const error = await company_store.updateCompany({ custom_approval_chains_enabled: value });

    if (error) toggle_error.value = getErrorMessage(error, t("common.states.error"));
  } finally {
    is_switching.value = false;
  }
}

const is_drawer_open = ref(false);
const selected_chain = ref(null);

function addChain() {
  selected_chain.value = null;
  is_drawer_open.value = true;
}

function editChain(chain) {
  selected_chain.value = chain;
  is_drawer_open.value = true;
}

const is_delete_open = ref(false);
const delete_chain = ref(null);

function deleteChain(chain) {
  delete_chain.value = chain;
  is_delete_open.value = true;
}

// prekidač na kartici čuva odmah
const toggling_id = ref(null);

async function toggleChain(chain, value) {
  toggling_id.value = chain.id;
  toggle_error.value = "";

  try {
    const error = await approval_chains_store.setActive(chain.id, value);

    if (error) {
      toggle_error.value = `${t("approval_chains.toast.toggle_failed")} ${chainErrorMessage(error)}`;
    }
  } finally {
    toggling_id.value = null;
  }
}

const message = computed(() => {
  if (approval_chains_store.is_loading && !approval_chains_store.chains.length) {
    return t("common.states.loading");
  }
  if (approval_chains_store.error) {
    return getErrorMessage(approval_chains_store.error, t("common.states.error"));
  }
  if (!approval_chains_store.chains.length && is_enabled.value) return t("approval_chains.list.empty");

  return "";
});

onMounted(() => {
  company_store.fetchCompany();
  approval_chains_store.fetchChains();
  approval_chains_store.fetchOptions();
});

onUnmounted(() => approval_chains_store.resetStore());
</script>

<style scoped lang="scss">
.approval-chains {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  background: $cold-50;

  &__header {
    position: relative;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__content {
    @include flex(flex-start, stretch, $space-16, column);
    min-height: 0;
    padding: $space-16;
    overflow-y: auto;
    @include thin-scrollbar($primary);
  }

  &__disabled {
    @include flex(flex-start, stretch, $space-12, column);
  }

  // podrazumevani lanac, ista kartica kao lanci ispod
  &__default {
    @include flex(space-between, center, $space-24);
    flex-wrap: wrap;
    padding: $space-16;
    background: $surface-default;
    border: 1px solid $border-default;
    border-left: 4px solid $border-action;
    border-radius: $radius-xs;
    box-shadow: $shadow-small;
  }

  &__default-text {
    @include flex(flex-start, flex-start, $space-4, column);

    h2 {
      font-size: $text-16;
      font-weight: $weight-semibold;
      line-height: $leading-sm;
      color: $fg-heading;
    }

    p {
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
    }
  }

  &__default-step {
    @include flex(flex-start, center, $space-8);
    flex: 1;

    span {
      @include flex(flex-start, flex-start, 0, column);
    }

    strong {
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    small {
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
    }
  }

  &__hint,
  &__count {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__count strong {
    font-weight: $weight-semibold;
    color: $fg-action;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(26rem, 1fr));
    gap: $space-16;
    align-items: start;
  }

  &__message {
    padding: $space-24;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  @include respond-to("tablet") {
    &__header {
      padding: $space-8;
    }

    &__content {
      gap: $space-12;
      padding: $space-8;
    }

    &__grid {
      grid-template-columns: minmax(0, 1fr);
      gap: $space-12;
    }
  }

  @include respond-to("mobile") {
    &__default {
      flex-direction: column;
      align-items: stretch;
      gap: $space-16;
    }
  }
}
</style>
