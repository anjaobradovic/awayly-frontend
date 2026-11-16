<template>
  <!-- otkaži zahtjev za odsustvo -->
  <VDialog v-model:open="is_open" :title="$t('requests.cancel_dialog.title')" width="28.125rem">
    <p class="cancel-request__text">{{ text }}</p>

    <p v-if="error_message" class="cancel-request__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton
        appearance="outlined"
        color="neutral"
        :disabled="is_busy"
        @click="is_open = false"
      >
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="is_busy" @click="confirm">
        {{ is_busy ? $t("requests.cancel_dialog.cancelling") : $t("requests.cancel_dialog.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useRequestsStore } from "@/stores/requests";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";

const is_open = defineModel("open", { type: Boolean, default: false });

const props = defineProps({
  // zahtev sa bar { id, status }
  request: { type: Object, default: null }
});

const emit = defineEmits(["cancelled"]);

const requests_store = useRequestsStore();

const is_busy = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

// zahtjev na čekanju se briše (9.6), odobren ide odobravaocu na otkazivanje (9.7)
const text = computed(() =>
  props.request?.status === "APPROVED"
    ? t("requests.cancel_dialog.approved_text")
    : t("requests.cancel_dialog.pending_text")
);

async function confirm() {
  is_busy.value = true;
  error_message.value = "";

  const error = await requests_store.cancelRequest(props.request);

  is_busy.value = false;

  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }

  is_open.value = false;
  emit("cancelled", props.request.id);
}
</script>

<style scoped lang="scss">
.cancel-request {
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
