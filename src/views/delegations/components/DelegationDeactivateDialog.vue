<template>
  <!-- potvrda prije otkazivanja delegacije, ne može se vratiti -->
  <VDialog v-model:open="is_open" :title="$t('delegations.deactivate_dialog.title')">
    <VNotice>
      {{ $t("delegations.deactivate_dialog.notice") }}
    </VNotice>

    <p v-if="error_message" class="delegation-deactivate__error" role="alert">
      {{ error_message }}
    </p>

    <template #footer>
      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ $t("common.actions.back") }}
      </VBaseButton>
      <VBaseButton :disabled="is_busy" @click="confirm">
        {{ $t("delegations.deactivate_dialog.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useDelegationsStore } from "@/stores/delegations";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const is_open = defineModel("open", { type: Boolean, default: false });

// red iz tabele (delegations_store.items)
const props = defineProps({
  delegation: { type: Object, default: null }
});

const emit = defineEmits(["deactivated"]);

const delegations_store = useDelegationsStore();

const is_busy = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  is_busy.value = true;
  error_message.value = "";

  const error = await delegations_store.cancelDelegation(props.delegation);

  is_busy.value = false;

  if (error) {
    error_message.value = getErrorMessage(error, t("common.states.error"));
    return;
  }

  is_open.value = false;
  emit("deactivated");
}
</script>

<style scoped lang="scss">
.delegation-deactivate__error {
  font-size: $text-12;
  line-height: $leading-xs;
  color: $fg-error;
}
</style>
