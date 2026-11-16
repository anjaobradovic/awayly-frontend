<template>
  <VDrawer
    v-model:open="is_open"
    :title="$t('delegations.settings.title')"
    width="35rem"
    :illustration="illustration"
  >
    <section class="delegation-settings__section">
      <h3 class="delegation-settings__title">{{ $t("delegations.settings.backup_title") }}</h3>
      <p class="delegation-settings__text">{{ $t("delegations.settings.backup_text") }}</p>
    </section>

    <VSelect
      v-model="form.backup_employee_id"
      :label="$t('delegations.settings.backup_person')"
      :placeholder="$t('delegations.settings.employee_placeholder')"
      :options="delegations_store.approver_options"
    />

    <section class="delegation-settings__section">
      <h3 class="delegation-settings__title">{{ $t("delegations.settings.absence_title") }}</h3>
      <p class="delegation-settings__text">{{ $t("delegations.settings.absence_text") }}</p>
    </section>

    <VSelect
      v-model="form.absence_employee_id"
      :label="$t('delegations.settings.backup_person')"
      :placeholder="$t('delegations.settings.employee_placeholder')"
      :options="delegations_store.approver_options"
    />

    <div class="delegation-settings__dates">
      <VDateInput
        v-model="form.absence_start"
        :label="$t('delegations.form.absence_from')"
        :max="form.absence_end"
      />
      <VDateInput
        v-model="form.absence_end"
        :label="$t('delegations.form.absence_to')"
        :min="form.absence_start"
      />
    </div>

    <p v-if="error_message" class="delegation-settings__error">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!is_valid || is_busy" @click="save">
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
import illustration from "@/assets/images/delegation-settings.svg";

const is_open = defineModel("open", { type: Boolean, default: false });

const delegations_store = useDelegationsStore();

// panel radi nad kopijom: store se menja tek na "Sačuvaj", "Odustani" ništa ne pamti
const form = ref({ ...delegations_store.settings });
const is_busy = ref(false);
const error_message = ref("");

// pri svakom otvaranju povlačimo sveže stanje sa servera, pa tek onda punimo formu
watch(is_open, async (open) => {
  if (!open) return;

  is_busy.value = true;
  error_message.value = "";

  try {
    // zaposleni i uloge se učitavaju tek sada, samo oni koji smiju da odobravaju
    const [error, employees_error] = await Promise.all([
      delegations_store.fetchSettings(),
      delegations_store.fetchEmployees(),
      delegations_store.fetchApproverRoleIds()
    ]);

    if (error || employees_error)
      error_message.value = getErrorMessage(error || employees_error, t("common.states.error"));

    form.value = { ...delegations_store.settings };
  } finally {
    is_busy.value = false;
  }
});

// delegacija je opciona, ali ako je počneš mora biti kompletna
const is_valid = computed(() => {
  const { absence_employee_id, absence_start, absence_end } = form.value;
  const is_empty = !absence_employee_id && !absence_start && !absence_end;
  const is_complete = absence_employee_id && absence_start && absence_end;

  return Boolean(is_empty || (is_complete && absence_start <= absence_end));
});

async function save() {
  if (!is_valid.value) return;

  is_busy.value = true;
  error_message.value = "";

  try {
    const error = await delegations_store.saveSettings(form.value);

    if (error) {
      error_message.value = getErrorMessage(error, t("common.states.error"));
      return;
    }

    is_open.value = false;
  } finally {
    is_busy.value = false;
  }
}
</script>

<style lang="scss" scoped>
.delegation-settings {
  &__section {
    @include flex(flex-start, stretch, $space-8, column);
  }

  &__title {
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__text {
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

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
