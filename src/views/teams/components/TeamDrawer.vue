<template>
  <VDrawer v-model:open="is_open" :title="title" :illustration="illustration">
    <div class="team-drawer__fields">
      <VBaseInput
        v-model="form.name"
        :label="$t('teams.drawer.name')"
        :placeholder="$t('teams.drawer.name_placeholder')"
        appearance="outlined"
      />
      <VSelect
        v-model="form.lead_id"
        :label="$t('teams.drawer.lead')"
        :placeholder="$t('teams.drawer.lead_placeholder')"
        :options="lead_options"
        clearable
      />
    </div>

    <p v-if="error_message" class="team-drawer__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton
        v-if="mode === 'details'"
        class="team-drawer__delete"
        appearance="tonal"
        color="error"
        :disabled="is_saving"
        @click="emit('delete')"
      >
        {{ $t("teams.drawer.delete") }}
      </VBaseButton>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!can_save || is_saving" @click="save">
        {{ mode === "details" ? $t("common.actions.save") : $t("teams.drawer.create") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VSelect from "@/components/VSelect.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useTeamsStore } from "@/stores/teams";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorMessage } from "@/utils/api-error";
import add_illustration from "@/assets/images/team-add.svg";
import details_illustration from "@/assets/images/team-details.svg";
import { t } from "@/i18n";

const props = defineProps({
  // izabrani tim iz store-a ({ id, name, lead_id }) ili null za novi tim
  team: { type: Object, default: null },
  mode: {
    type: String,
    default: "add",
    validator: (value) => ["add", "details"].includes(value)
  }
});

// obrisi tim otvara potvrdu u roditelju
const emit = defineEmits(["delete"]);

const is_open = defineModel("open", { type: Boolean, default: false });

const teams_store = useTeamsStore();
const employees_store = useEmployeesStore();

const title = computed(() =>
  props.mode === "add" ? t("teams.drawer.title_add") : t("teams.drawer.title_details")
);
const illustration = computed(() =>
  props.mode === "add" ? add_illustration : details_illustration
);

// vodja tima moze biti svako ko nije deaktiviran
const lead_options = computed(() =>
  employees_store.all_users
    .filter((user) => user.status !== "DEACTIVATED")
    .map((user) => ({ value: user.id, label: user.name }))
);

const createForm = () => ({
  name: props.mode === "details" ? (props.team?.name ?? "") : "",
  lead_id: props.mode === "details" ? (props.team?.lead_id ?? null) : null
});

const form = ref(createForm());
const is_saving = ref(false);
const error_message = ref("");

// svako otvaranje krece od izabranog tima ili prazne forme
watch(is_open, (open) => {
  if (!open) return;

  form.value = createForm();
  error_message.value = "";
});

// oba polja su obavezna, inace backend vraca 400
const is_valid = computed(() => Boolean(form.value.name.trim() && form.value.lead_id));

// saljemo samo ono sto se promijenilo
const changes = computed(() => {
  const initial = createForm();
  const result = {};

  if (form.value.name.trim() !== initial.name) result.name = form.value.name.trim();
  if (form.value.lead_id !== initial.lead_id) result.team_lead_id = form.value.lead_id;

  return result;
});

const can_save = computed(
  () => is_valid.value && (props.mode === "add" || Object.keys(changes.value).length > 0)
);

async function save() {
  if (!can_save.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const error =
      props.mode === "details"
        ? await teams_store.updateTeam(props.team.id, changes.value)
        : await teams_store.createTeam(form.value);

    // panel ostaje otvoren sa porukom, npr. kad tim vec postoji
    if (error) {
      error_message.value = getErrorMessage(error);
      return;
    }

    is_open.value = false;
  } finally {
    is_saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.team-drawer {
  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;

    // manji input, isto kao na praznicima
    :deep(.v-input) {
      gap: $space-4;
    }

    :deep(.v-input__label) {
      font-size: $text-12;
      line-height: $leading-xs;
    }

    :deep(.v-input__field) {
      box-sizing: border-box;
      height: 2rem;
      padding: 0 $space-4 0 $space-8;
    }
  }

  // obrisi tim lijevo, ostala dugmad desno
  &__delete {
    margin-right: auto;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
