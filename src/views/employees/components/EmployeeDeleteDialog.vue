<template>
  <!-- potvrda prije deaktivacije (4.5 deactivateUser) -->
  <VDialog v-model:open="is_open" :title="$t('employees.delete.title')">
    <VNotice>{{ $t("employees.delete.notice") }}</VNotice>

    <p v-if="error_message" class="employee-delete__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ $t("common.actions.back") }}
      </VBaseButton>
      <VBaseButton :disabled="is_deleting" @click="confirm">
        {{ $t("employees.delete.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorMessage } from "@/utils/api-error";

const is_open = defineModel("open", { type: Boolean, default: false });

const props = defineProps({
  employeeId: { type: Number, default: null }
});

const emit = defineEmits(["deleted"]);

const employees_store = useEmployeesStore();

const is_deleting = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  is_deleting.value = true;
  error_message.value = "";

  const error = await employees_store.deactivateEmployee(props.employeeId);

  is_deleting.value = false;

  // dijalog ostaje otvoren sa porukom servera (npr. zaposleni je nečiji nadređeni)
  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }

  is_open.value = false;
  emit("deleted");
}
</script>

<style scoped lang="scss">
.employee-delete__error {
  font-size: $text-12;
  line-height: $leading-xs;
  color: $fg-error;
}
</style>
