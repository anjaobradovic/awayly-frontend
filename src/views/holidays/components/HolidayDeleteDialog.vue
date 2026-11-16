<template>
  <!-- potvrda prije brisanja kompanijskog praznika -->
  <VDialog v-model:open="is_open" :title="$t('holidays.delete_dialog.title')">
    <p class="holiday-delete__text">
      {{ $t("holidays.delete_dialog.text", { name: script(holiday?.name ?? "") }) }}
    </p>

    <VNotice>
      {{ $t("holidays.delete_dialog.notice", { date }) }}
    </VNotice>

    <p v-if="error_message" class="holiday-delete__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="is_deleting" @click="confirm">
        {{ $t("holidays.remove") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useHolidaysStore } from "@/stores/holidays";
import { useDate } from "@/composables/useDate";
import { getErrorMessage } from "@/utils/api-error";
import { script, t } from "@/i18n";

const is_open = defineModel("open", { type: Boolean, default: false });

// red iz tabele
const props = defineProps({
  holiday: { type: Object, default: null }
});

const emit = defineEmits(["deleted"]);

const holidays_store = useHolidaysStore();
const { formatDate } = useDate();

const is_deleting = ref(false);
const error_message = ref("");

const date = computed(() => formatDate(props.holiday?.date, { dateOnly: true }));

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  is_deleting.value = true;
  error_message.value = "";

  const error = await holidays_store.deleteCompanyHoliday(props.holiday.id);

  is_deleting.value = false;

  if (error) {
    error_message.value = getErrorMessage(error, t("common.states.error"));
    return;
  }

  is_open.value = false;
  emit("deleted");
}
</script>

<style scoped lang="scss">
.holiday-delete {
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
