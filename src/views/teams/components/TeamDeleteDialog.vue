<template>
  <VDialog v-model:open="is_open" :title="$t('teams.delete.title')">
    <p class="team-delete__text">
      {{ question[0] }}<strong>{{ team?.name }}</strong>{{ question[1] }}
    </p>

    <VNotice>{{ $t("teams.delete.notice") }}</VNotice>

    <p v-if="error_message" class="team-delete__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="is_deleting" @click="confirm">
        {{ $t("teams.delete.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import { useTeamsStore } from "@/stores/teams";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorMessage } from "@/utils/api-error";
import { splitAround } from "../team-config";

const is_open = defineModel("open", { type: Boolean, default: false });

const props = defineProps({
  team: { type: Object, default: null }
});

const emit = defineEmits(["deleted"]);

const teams_store = useTeamsStore();
const employees_store = useEmployeesStore();

// tekst oko podebljanog imena tima
const question = computed(() => splitAround("teams.delete.question", "name"));

const is_deleting = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (open) error_message.value = "";
});

// api: 12.5 deleteTeam
async function confirm() {
  is_deleting.value = true;
  error_message.value = "";

  const error = await teams_store.deleteTeam(props.team.id);

  is_deleting.value = false;

  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }


  employees_store.fetchOptions();
  is_open.value = false;
  emit("deleted");
}
</script>

<style lang="scss" scoped>
.team-delete {
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
