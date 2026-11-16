<template>
  <!-- izmjena zamjenika i perioda, neaktivna delegacija je samo za pregled -->
  <VDrawer
    v-model:open="is_open"
    :title="$t('delegations.edit.title')"
    :illustration="illustration"
  >
    <template v-if="delegation">
      <section class="delegation-edit__fields">
        <!-- delegirani zaposleni se ne mijenja, API prima samo zamjenika i datume -->
        <VBaseInput
          class="delegation-edit__locked"
          :model-value="script(delegation.delegated_by)"
          :label="$t('delegations.form.delegated_by')"
          appearance="outlined"
          :clearable="false"
          readonly
        />

        <VSelect
          v-if="is_editable"
          v-model="form.delegate_id"
          :label="$t('delegations.form.delegated_to')"
          :placeholder="$t('delegations.form.delegated_to_placeholder')"
          :options="delegate_options"
        />
        <VBaseInput
          v-else
          class="delegation-edit__locked"
          :model-value="script(delegation.delegated_to)"
          :label="$t('delegations.form.delegated_to')"
          appearance="outlined"
          :clearable="false"
          readonly
        />

        <div :class="['delegation-edit__dates', { 'is-readonly': !is_editable }]">
          <VDateInput
            v-model="form.start_date"
            :label="$t('delegations.form.absence_from')"
            :max="form.end_date"
            :readonly="!is_editable"
          />
          <VDateInput
            v-model="form.end_date"
            :label="$t('delegations.form.absence_to')"
            :min="form.start_date"
            :readonly="!is_editable"
          />
        </div>
      </section>
    </template>

    <p v-if="error_message" class="delegation-edit__error" role="alert">{{ error_message }}</p>

    <!-- neaktivna delegacija ima samo Zatvori -->
    <template v-if="!is_editable" #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.close") }}
      </VBaseButton>
    </template>

    <template v-else #footer>
      <VBaseButton
        class="delegation-edit__deactivate"
        appearance="tonal"
        color="error"
        @click="is_deactivate_open = true"
      >
        {{ $t("delegations.edit.deactivate") }}
      </VBaseButton>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!can_save || is_saving" @click="save">
        {{ $t("common.actions.save_changes") }}
      </VBaseButton>
    </template>
  </VDrawer>

  <DelegationDeactivateDialog
    v-model:open="is_deactivate_open"
    :delegation="delegation"
    @deactivated="is_open = false"
  />
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useDelegationsStore } from "@/stores/delegations";
import { getErrorMessage } from "@/utils/api-error";
import { script, t } from "@/i18n";
import illustration from "@/assets/images/delegation-settings.svg";
import DelegationDeactivateDialog from "./DelegationDeactivateDialog.vue";

const is_open = defineModel("open", { type: Boolean, default: false });

// red iz tabele (delegations_store.items)
const props = defineProps({
  delegation: { type: Object, default: null }
});

const delegations_store = useDelegationsStore();

// date input traži "YYYY-MM-DD"; server može poslati i vreme
const toDateValue = (value) => (value ? String(value).slice(0, 10) : "");

const createForm = () => ({
  delegate_id: props.delegation?.delegate_id ?? null,
  start_date: toDateValue(props.delegation?.start_date),
  end_date: toDateValue(props.delegation?.end_date)
});

const form = ref(createForm());
const initial = ref(createForm());
const is_saving = ref(false);
const is_deactivate_open = ref(false);
const error_message = ref("");

// otkazana delegacija se više ne mijenja
const is_editable = computed(() => Boolean(props.delegation?.is_active));

watch(is_open, async (open) => {
  if (!open) return;

  form.value = createForm();
  initial.value = createForm();
  error_message.value = "";

  // za pregled neaktivne delegacije lista zamenika nije potrebna
  if (!is_editable.value) return;

  // zaposleni i uloge za listu Delegirano za, učitavaju se jednom
  const [employees_error] = await Promise.all([
    delegations_store.fetchEmployees(),
    delegations_store.fetchApproverRoleIds()
  ]);

  if (employees_error)
    error_message.value = getErrorMessage(employees_error, t("common.states.error"));
});

// zamjenik mora imati pravo odobravanja i ne može biti sam delegirani
const delegate_options = computed(() =>
  delegations_store.approver_options.filter(
    (option) => option.value !== props.delegation?.delegator_id
  )
);

const has_changes = computed(() =>
  Object.keys(form.value).some((key) => form.value[key] !== initial.value[key])
);

// ISO datumi ("2026-06-07") se mogu porediti kao obični stringovi
const can_save = computed(() => {
  const { delegate_id, start_date, end_date } = form.value;

  return Boolean(
    is_editable.value &&
    has_changes.value &&
    delegate_id &&
    start_date &&
    end_date &&
    start_date <= end_date
  );
});

async function save() {
  if (!can_save.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const error = await delegations_store.updateDelegation(props.delegation, form.value);

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
.delegation-edit {
  // polja u svijetlo sivoj kutiji
  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__dates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-24;
  }

  // naslov polja manji nego u VBaseInput
  &__fields :deep(.v-input) {
    gap: $space-4;
  }

  &__fields :deep(.v-input__label) {
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
  }

  // Delegirano od se ne mijenja, zato siva pozadina
  &__locked :deep(.v-input__field) {
    padding-left: $space-8;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
  }

  &__locked :deep(.v-input__control) {
    color: $fg-heading;
    cursor: default;
  }

  // dugme za deaktivaciju levo, ostala desno
  &__deactivate {
    margin-right: auto;
  }

  // kod pregleda je ikona kalendara siva
  &__dates.is-readonly :deep(.v-date-input__icon) {
    color: $icon-default;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  @include respond-to("tablet-sm") {
    &__dates {
      grid-template-columns: 1fr;
      gap: $space-16;
    }
  }
}
</style>
