<template>
  <!-- potvrda prije brisanja zakazane polise (api 2.6) -->
  <VDialog v-model:open="is_open" :title="$t('policy.cancel_dialog.title')">
    <p class="policy-cancel__text">{{ $t("policy.cancel_dialog.question") }}</p>

    <VNotice>
      {{ $t("policy.cancel_dialog.notice", { date: effectiveFrom }) }}
    </VNotice>

    <p v-if="error_message" class="policy-cancel__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="is_busy" @click="confirm">
        {{ $t("policy.cancel_dialog.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { usePolicyStore } from "@/stores/policy";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const is_open = defineModel("open", { type: Boolean, default: false });

defineProps({
  // već formatiran datum, npr. 01.01.2027.
  effectiveFrom: { type: String, default: "" }
});

const emit = defineEmits(["cancelled"]);

const policy_store = usePolicyStore();

const is_busy = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  is_busy.value = true;
  error_message.value = "";

  const error = await policy_store.cancelScheduledPolicy();

  is_busy.value = false;

  if (error) {
    error_message.value = getErrorMessage(error, t("common.states.error"));
    return;
  }

  is_open.value = false;
  emit("cancelled");
}
</script>

<style scoped lang="scss">
.policy-cancel {
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
