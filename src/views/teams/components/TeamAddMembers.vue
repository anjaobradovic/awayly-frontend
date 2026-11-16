<template>
  <VDialog v-model:open="is_open" :title="$t('teams.add_dialog.title')" width="32.4375rem" overflow-visible>
    <p class="team-add-members__text">{{ $t("teams.add_dialog.text") }}</p>

    <VSelect
      v-model="picked_id"
      :label="$t('teams.add_dialog.employee')"
      :placeholder="$t('teams.add_dialog.placeholder')"
      :options="options"
    />

    <div v-if="selected.length" class="team-add-members__chips">
      <VChip
        v-for="user in selected"
        :key="user.id"
        tone="solid"
        removable
        :remove-label="$t('teams.add_dialog.remove', { name: user.name })"
        @remove="unpick(user.id)"
      >
        {{ user.name }}
      </VChip>
    </div>

    <p v-if="error_message" class="team-add-members__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!selected.length || is_saving" @click="save">
        {{ $t("teams.add_dialog.submit") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VChip from "@/components/VChip.vue";
import VDialog from "@/components/VDialog.vue";
import VSelect from "@/components/VSelect.vue";
import { useEmployeesStore } from "@/stores/employees";
import { useTeamsStore } from "@/stores/teams";
import { getErrorMessage } from "@/utils/api-error";

const is_open = defineModel("open", { type: Boolean, default: false });

const teams_store = useTeamsStore();
const employees_store = useEmployeesStore();

const picked_id = ref(null);
const selected_ids = ref([]);
const is_saving = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (!open) return;

  picked_id.value = null;
  selected_ids.value = [];
  error_message.value = "";
});

watch(picked_id, (id) => {
  if (id === null) return;

  selected_ids.value = [...selected_ids.value, id];
  picked_id.value = null;
});

const unpick = (id) => (selected_ids.value = selected_ids.value.filter((item) => item !== id));

const selected = computed(() =>
  selected_ids.value
    .map((id) => employees_store.all_users.find((user) => user.id === id))
    .filter(Boolean)
);

// 12.6 prepisuje stari tim, zato pored imena piše trenutni tim
const options = computed(() =>
  employees_store.all_users
    .filter(
      (user) =>
        user.status !== "DEACTIVATED" &&
        user.team_id !== teams_store.selected_id &&
        !selected_ids.value.includes(user.id)
    )
    .map((user) => ({
      value: user.id,
      label: user.team ? `${user.name} (${user.team})` : user.name
    }))
);

// api: 12.6 assignUsersToTeam/{id}
async function save() {
  is_saving.value = true;
  error_message.value = "";

  const error = await teams_store.addMembers(selected_ids.value);

  is_saving.value = false;

  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }

  employees_store.fetchOptions();
  is_open.value = false;
}
</script>

<style lang="scss" scoped>
.team-add-members {
  &__text {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: $space-10;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
