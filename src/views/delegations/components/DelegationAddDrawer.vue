<template>
  <VDrawer v-model:open="is_open" :title="$t('delegations.add')" :illustration="illustration">
    <VSelect
      v-model="form.delegated_by_id"
      :label="$t('delegations.form.delegated_by')"
      :placeholder="$t('delegations.form.delegated_by_placeholder')"
      :options="delegated_by_options"
    />

    <VSelect
      v-model="form.delegated_to_id"
      :label="$t('delegations.form.delegated_to')"
      :placeholder="$t('delegations.form.delegated_to_placeholder')"
      :options="delegated_to_options"
    />

    <div class="delegation-add__dates">
      <VDateInput
        v-model="form.start_date"
        :label="$t('delegations.form.absence_from')"
        :max="form.end_date"
      />
      <VDateInput
        v-model="form.end_date"
        :label="$t('delegations.form.absence_to')"
        :min="form.start_date"
      />
    </div>

    <p v-if="error_message" class="delegation-add__error">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!is_valid || is_saving" @click="save">
        {{ $t("common.actions.save") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useDelegationsStore } from "@/stores/delegations";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";
import illustration from "@/assets/images/delegation-add.svg";

const is_open = defineModel("open", { type: Boolean, default: false });

const delegations_store = useDelegationsStore();

// Delegirano od je unaprijed prijavljeni korisnik
const createEmptyForm = () => ({
  delegated_by_id: delegations_store.current_user_id ?? null,
  delegated_to_id: null,
  start_date: "",
  end_date: ""
});

const form = ref(createEmptyForm());
const is_saving = ref(false);
const error_message = ref("");

// svako otvaranje kreće od prazne forme, zaposleni se učitavaju jednom
watch(is_open, async (open) => {
  if (!open) return;

  form.value = createEmptyForm();
  error_message.value = "";

  const error = await delegations_store.fetchEmployees();

  if (error) error_message.value = getErrorMessage(error, t("common.states.error"));
});

// bez prava DELEGATION.MANAGE.OTHERS korisnik može da delegira samo svoja odobravanja
const delegated_by_options = computed(() => {
  if (delegations_store.can_manage_others) return delegations_store.employee_options;

  return delegations_store.employee_options.filter(
    (option) => option.value === delegations_store.current_user_id
  );
});

// zaposleni ne može delegirati sam sebi
const delegated_to_options = computed(() =>
  delegations_store.employee_options.filter((option) => option.value !== form.value.delegated_by_id)
);

// ako se "od" promeni u osobu koja je već izabrana u "za", brišemo "za"
watch(
  () => form.value.delegated_by_id,
  (id) => {
    if (id === form.value.delegated_to_id) form.value.delegated_to_id = null;
  }
);

// ISO datumi ("2026-06-07") se mogu porediti kao obični stringovi
const is_valid = computed(() => {
  const { delegated_by_id, delegated_to_id, start_date, end_date } = form.value;

  return Boolean(
    delegated_by_id && delegated_to_id && start_date && end_date && start_date <= end_date
  );
});

async function save() {
  if (!is_valid.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const error = await delegations_store.createDelegation(form.value);

    // panel ostaje otvoren sa porukom o grešci
    if (error) {
      error_message.value = getErrorMessage(error, t("common.states.error"));
      return;
    }

    is_open.value = false;
  } finally {
    is_saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.delegation-add {
  &__dates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-24;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
