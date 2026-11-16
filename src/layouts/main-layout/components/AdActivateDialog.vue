<template>
  <!-- potvrda prije prelaska na AD prijavu, ne može se vratiti -->
  <VDialog v-model:open="is_open" :title="$t('layout.ad_activate.title')">
    <p class="ad-activate__text">{{ $t("layout.ad_activate.text") }}</p>

    <VNotice>{{ $t("layout.ad_activate.notice") }}</VNotice>

    <p v-if="error_message" class="ad-activate__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton
        appearance="outlined"
        color="neutral"
        :disabled="is_busy"
        @click="is_open = false"
      >
        {{ $t("common.actions.back") }}
      </VBaseButton>
      <VBaseButton :disabled="is_busy" @click="confirm">
        {{ is_busy ? $t("layout.ad_activate.busy") : $t("layout.ad_activate.submit") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { getAdErrorMessage, useAdSettingsStore } from "@/stores/ad-settings";

const is_open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["activated"]);

const ad_store = useAdSettingsStore();

const is_busy = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  is_busy.value = true;
  error_message.value = "";

  // 19.5 je sinhrona, dugme ostaje zaključano dok se ne završi
  const { error, sync, sync_error } = await ad_store.activateAd();

  is_busy.value = false;

  // npr. 409.020.005, nalog ne postoji u AD-u
  if (error) {
    error_message.value = getAdErrorMessage(error);
    return;
  }

  is_open.value = false;
  emit("activated", { sync, sync_error });
}
</script>

<style scoped lang="scss">
.ad-activate {
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
