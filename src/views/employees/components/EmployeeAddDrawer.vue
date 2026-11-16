<template>
  <VDrawer v-model:open="is_open" :title="$t('employees.add.title')">
    <div class="employee-add__fields">
      <VBaseInput
        v-model="form.first_name"
:label="$t('employees.fields.first_name')"
        :placeholder="$t('employees.fields.first_name_placeholder')"
        appearance="outlined"
      />
      <VBaseInput
        v-model="form.last_name"
:label="$t('employees.fields.last_name')"
        :placeholder="$t('employees.fields.last_name_placeholder')"
        appearance="outlined"
      />
      <VBaseInput
        v-model="form.email"
:label="$t('employees.fields.email')"
        type="email"
        :placeholder="$t('employees.fields.email_placeholder')"
        appearance="outlined"
        :status="show_email_error ? 'error' : 'default'"
        :supporting-text="show_email_error ? $t('employees.fields.email_invalid') : ''"
      />
      <VBaseInput
        v-model="form.phone_number"
:label="$t('employees.fields.phone')"
        type="tel"
        optional
        :placeholder="$t('employees.fields.phone_placeholder')"
        appearance="outlined"
      />

      <!-- hire_date i date_of_birth ne smiju biti u buducnosti -->
      <VDateInput
        v-model="form.hire_date"
        :label="$t('employees.fields.hire_date')"
        icon="today"
        :max="today"
      />
      <VDateInput
        v-model="form.date_of_birth"
        :label="$t('employees.fields.date_of_birth')"
        icon="cake"
        :max="today"
      />

      <VSelect
        v-model="form.onboarding_type"
:label="$t('employees.fields.onboarding_type')"
        :placeholder="$t('employees.fields.onboarding_placeholder')"
        :options="ONBOARDING_OPTIONS"
      />
      <VSelect
        v-model="form.manager_id"
:label="$t('employees.fields.manager')"
        :placeholder="$t('employees.fields.manager_placeholder')"
        :options="manager_options"
      />
      <VSelect
        v-model="form.team_id"
:label="$t('employees.fields.team')"
        :placeholder="$t('employees.fields.team_placeholder')"
        :options="employees_store.team_options"
      />
      <VSelect
        v-model="form.religion"
:label="$t('employees.fields.religion')"
        optional
        :placeholder="$t('employees.fields.religion_placeholder')"
        :options="RELIGION_OPTIONS"
      />

      <VBaseInput
        v-model="form.used_days"
:label="$t('employees.fields.used_days')"
        type="number"
        :placeholder="$t('employees.fields.used_days_placeholder')"
        appearance="outlined"
      />
      <VBaseInput
        v-model="form.remaining_days"
:label="$t('employees.fields.remaining_days')"
        type="number"
        :placeholder="$t('employees.fields.remaining_days_placeholder')"
        appearance="outlined"
      />
      <VBaseInput
        v-model="form.general_leave_remaining_days"
:label="$t('employees.fields.general_remaining')"
        type="number"
        :placeholder="$t('employees.fields.remaining_days_placeholder')"
        appearance="outlined"
      />
      <VBaseInput
        v-model="form.general_leave_used_days"
:label="$t('employees.fields.general_used')"
        type="number"
        :placeholder="$t('employees.fields.used_days_placeholder')"
        appearance="outlined"
      />
    </div>

    <p v-if="error_message" class="employee-add__error">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!is_valid || is_saving" @click="save">
        {{ $t("employees.add.submit") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useEmployeesStore } from "@/stores/employees";
import { useRolesStore } from "@/stores/roles";
import { getErrorMessage } from "@/utils/api-error";
import { ONBOARDING_OPTIONS, RELIGION_OPTIONS } from "../employee-config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const is_open = defineModel("open", { type: Boolean, default: false });

const employees_store = useEmployeesStore();

const createEmptyForm = () => ({
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  hire_date: "",
  date_of_birth: "",
  onboarding_type: null,
  manager_id: null,
  team_id: null,
  religion: null,
  used_days: "",
  remaining_days: "",
  general_leave_remaining_days: "",
  general_leave_used_days: ""
});

const form = ref(createEmptyForm());
const is_saving = ref(false);
const error_message = ref("");

// sv-SE locale vraca datum kao YYYY-MM-DD
const today = new Date().toLocaleDateString("sv-SE");

// svako otvaranje krece od prazne forme
const roles_store = useRolesStore();

watch(is_open, (open) => {
  if (!open) return;

  form.value = createEmptyForm();
  error_message.value = "";

  // uloge trebaju za izbor nadredjenog, ucitavaju se samo prvi put
  if (!roles_store.items.length) roles_store.fetchRoles();
});

// samo zaposleni cija uloga moze da odobrava zahtjeve
const manager_options = computed(() =>
  employees_store.managerOptions(roles_store.approver_role_ids)
);

const is_existing = computed(() => form.value.onboarding_type === "EXISTING_EMPLOYEE");

const is_email_valid = computed(() => EMAIL_PATTERN.test(form.value.email.trim()));
const show_email_error = computed(() => form.value.email.trim() !== "" && !is_email_valid.value);

const isWholeNumber = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;
const isEmptyOrWholeNumber = (value) => value === "" || isWholeNumber(value);

const DAY_FIELDS = [
  "used_days",
  "remaining_days",
  "general_leave_remaining_days",
  "general_leave_used_days"
];

const is_valid = computed(() => {
  const { first_name, last_name, hire_date, onboarding_type, manager_id, team_id } = form.value;
  const is_birth_date_valid = !form.value.date_of_birth || form.value.date_of_birth <= today;

  const has_required = Boolean(
    first_name.trim() &&
    last_name.trim() &&
    is_email_valid.value &&
    hire_date &&
    hire_date <= today &&
    onboarding_type &&
    manager_id &&
    team_id
  );

  const are_days_valid = DAY_FIELDS.every((key) => isEmptyOrWholeNumber(form.value[key]));

  // za postojeceg zaposlenog iskorisceni i preostali dani idu zajedno
  const has_existing_days =
    !is_existing.value || (form.value.used_days !== "" && form.value.remaining_days !== "");

  return has_required && is_birth_date_valid && are_days_valid && has_existing_days;
});

async function save() {
  if (!is_valid.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const error = await employees_store.createEmployee(form.value);

    // panel ostaje otvoren sa porukom, npr. kad email vec postoji
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
.employee-add {
  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
