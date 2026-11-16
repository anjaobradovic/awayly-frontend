<template>
  <!-- potvrda prije brisanja prilagođenog tipa (api 10.5) -->
  <VDialog v-model:open="is_open" :title="$t('absence_types.delete_dialog.title')">
    <p class="absence-type-delete__text">
      {{ $t("absence_types.delete_dialog.text", { name: type_name }) }}
    </p>

    <VNotice>
      {{ $t("absence_types.delete_dialog.notice") }}
    </VNotice>

    <p v-if="error_message" class="absence-type-delete__error" role="alert">
      {{ error_message }}
    </p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="is_deleting" @click="confirm">
        {{ $t("absence_types.delete_dialog.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useAbsenceTypesStore } from "@/stores/absence-types";
import { getErrorMessage } from "@/utils/api-error";
import { leaveTypeName } from "@/utils/leave-type-name";
import { t } from "@/i18n";

const is_open = defineModel("open", { type: Boolean, default: false });

// red iz tabele (store absence-types)
const props = defineProps({
  type: { type: Object, default: null }
});

const types_store = useAbsenceTypesStore();

const type_name = computed(() => leaveTypeName(props.type?.api_name ?? props.type?.name));

const is_deleting = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  is_deleting.value = true;
  error_message.value = "";

  const error = await types_store.deleteType(props.type.id);

  is_deleting.value = false;

  if (error) {
    error_message.value = getErrorMessage(error, t("common.states.error"));
    return;
  }

  is_open.value = false;
}
</script>

<style scoped lang="scss">
.absence-type-delete {
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
