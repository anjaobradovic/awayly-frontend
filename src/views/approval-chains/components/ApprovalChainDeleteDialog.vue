<template>
  <VDialog v-model:open="is_open" :title="$t('approval_chains.delete.title')">
    <p class="chain-delete__text">
      {{ $t("approval_chains.delete.text", { name: chain?.name ?? "" }) }}
    </p>

    <VNotice>{{ $t("approval_chains.delete.notice") }}</VNotice>

    <p v-if="error_message" class="chain-delete__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton color="error" :disabled="is_deleting" @click="confirm">
        {{ $t("approval_chains.delete.title") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { ref, watch } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import { useApprovalChainsStore } from "@/stores/approval-chains";
import { chainErrorMessage } from "../approval-chain-config";

const is_open = defineModel("open", { type: Boolean, default: false });

const props = defineProps({
  chain: { type: Object, default: null }
});

const emit = defineEmits(["deleted"]);

const approval_chains_store = useApprovalChainsStore();

const is_deleting = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  if (!props.chain) return;

  is_deleting.value = true;
  error_message.value = "";

  try {
    const error = await approval_chains_store.deleteChain(props.chain.id);

    if (error) {
      error_message.value = chainErrorMessage(error);
      return;
    }

    is_open.value = false;
    emit("deleted");
  } finally {
    is_deleting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.chain-delete {
  &__text {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
