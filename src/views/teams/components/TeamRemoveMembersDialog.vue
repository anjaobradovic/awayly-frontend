<template>
  <VDialog v-model:open="is_open" :title="$t('teams.remove_dialog.title')" width="31.25rem">
    <p class="team-remove__text">
      {{ question[0] }}<strong>{{ bold }}</strong>{{ question[1] }}
    </p>

    <VNotice tone="info">{{ $t("teams.remove_dialog.notice") }}</VNotice>

    <p v-if="error_message" class="team-remove__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="is_removing" @click="confirm">
        {{ $t("teams.remove_dialog.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useTeamsStore } from "@/stores/teams";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorMessage } from "@/utils/api-error";
import { splitAround } from "../team-config";
import { intlLocale } from "@/i18n";

const is_open = defineModel("open", { type: Boolean, default: false });

const props = defineProps({
  members: { type: Array, default: () => [] }
});

const emit = defineEmits(["removed"]);

const teams_store = useTeamsStore();
const employees_store = useEmployeesStore();

// jedan član: podebljano ime, više njih: podebljan broj
const is_single = computed(() => props.members.length === 1);

const question = computed(() =>
  is_single.value
    ? splitAround("teams.remove_dialog.question_one", "name")
    : splitAround("teams.remove_dialog.question_many", "n", { count: props.members.length })
);

const bold = computed(() =>
  is_single.value
    ? props.members[0].name
    : new Intl.NumberFormat(intlLocale()).format(props.members.length)
);

const is_removing = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

async function confirm() {
  is_removing.value = true;
  error_message.value = "";

  const error = await teams_store.removeMembers(props.members.map((member) => member.id));

  is_removing.value = false;

  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }

  employees_store.fetchOptions();
  is_open.value = false;
  emit("removed");
}
</script>

<style lang="scss" scoped>
.team-remove {
  &__text {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;

    strong {
      font-weight: $weight-semibold;
      color: $fg-heading;
    }
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
