<template>
  <!-- izmjena zaposlenog, polja u dvije kolone i reset TOTP-a -->
  <VDrawer
    v-model:open="is_open"
    :title="$t('employees.details.title')"
    :transition="transition"
    close-icon="arrow_back"
  >
    <p v-if="is_loading" class="employee-edit__message">{{ $t("common.states.loading") }}</p>

    <template v-else-if="employee">
      <EmployeeSummary :employee="employee" />

      <section class="employee-edit__card employee-edit__fields">
        <VBaseInput
          v-model="form.first_name"
          :label="$t('employees.fields.first_name')"
          required
          :placeholder="$t('employees.fields.first_name_placeholder')"
          appearance="outlined"
        />
        <VBaseInput
          v-model="form.last_name"
          :label="$t('employees.fields.last_name')"
          required
          :placeholder="$t('employees.fields.last_name_placeholder')"
          appearance="outlined"
        />

        <!-- api 4.4 ne mijenja veroispovest ni email, samo se prikazuju -->
        <VBaseInput
          class="employee-edit__wide employee-edit__locked"
          :model-value="religion_label"
          :label="$t('employees.fields.confession')"
          appearance="outlined"
          :clearable="false"
          readonly
        />
        <VBaseInput
          class="employee-edit__wide employee-edit__locked"
          :model-value="employee.email"
          :label="$t('employees.fields.email')"
          appearance="outlined"
          :clearable="false"
          readonly
        />

        <VBaseInput
          v-model="form.phone_number"
          class="employee-edit__wide"
          :label="$t('employees.fields.phone')"
          type="tel"
          :placeholder="$t('employees.fields.phone_placeholder')"
          appearance="outlined"
        />

        <!-- uloga ide posebnim pozivom 7.6 changeUserRole -->
        <VSelect
          v-model="form.role_id"
          :label="$t('employees.fields.role')"
          :placeholder="$t('employees.fields.role_placeholder')"
          :options="role_options"
        />
        <VSelect
          v-model="form.team_id"
          :label="$t('employees.fields.team')"
          :placeholder="$t('employees.fields.team_placeholder_short')"
          :options="employees_store.team_options"
        />

        <!-- api 4.4: datumi ne smiju biti u budućnosti -->
        <VDateInput
          v-model="form.date_of_birth"
          :label="$t('employees.fields.date_of_birth')"
          :max="today"
        />
        <VDateInput
          v-model="form.hire_date"
          :label="$t('employees.fields.hire_date')"
          required
          :max="today"
        />

        <VSelect
          v-model="form.manager_id"
          class="employee-edit__wide"
          :label="$t('employees.fields.manager')"
          :placeholder="$t('employees.fields.manager_placeholder')"
          :options="manager_options"
        />
      </section>

      <!-- api 4.8 resetUserTotp -->
      <section class="employee-edit__card employee-edit__totp">
        <VNotice>{{ $t("employees.edit.totp_notice") }}</VNotice>
        <VBaseButton
          appearance="outlined"
          color="neutral"
          block
          :disabled="is_resetting"
          @click="resetTotp"
        >
          {{ $t("employees.edit.totp_reset") }}
        </VBaseButton>
        <p v-if="totp_message" class="employee-edit__success" role="status">{{ totp_message }}</p>
      </section>
    </template>

    <p v-if="error_message" class="employee-edit__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton
        class="employee-edit__delete"
        appearance="tonal"
        color="error"
        :disabled="!employee || employee.status === 'DEACTIVATED'"
        @click="is_delete_open = true"
      >
        {{ $t("employees.edit.delete") }}
      </VBaseButton>
      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!is_valid || is_saving || is_loading" @click="save">
        {{ $t("common.actions.save") }}
      </VBaseButton>
    </template>
  </VDrawer>

  <EmployeeDeleteDialog
    v-model:open="is_delete_open"
    :employee-id="employeeId"
    @deleted="onDeleted"
  />
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VNotice from "@/components/VNotice.vue";
import { useEmployeesStore } from "@/stores/employees";
import { useRolesStore } from "@/stores/roles";
import { getErrorMessage } from "@/utils/api-error";
import { RELIGION_OPTIONS } from "../employee-config";
import { t } from "@/i18n";
import EmployeeSummary from "./EmployeeSummary.vue";
import EmployeeDeleteDialog from "./EmployeeDeleteDialog.vue";

const is_open = defineModel("open", { type: Boolean, default: false });

// deleted: roditelj ne vraća panel detalja poslije brisanja
const emit = defineEmits(["deleted"]);

const props = defineProps({
  employeeId: { type: Number, default: null },
  // dissolve dok se prelazi između detalja i izmjene
  transition: { type: String, default: "slide" }
});

const employees_store = useEmployeesStore();
const roles_store = useRolesStore();

const createEmptyForm = () => ({
  first_name: "",
  last_name: "",
  phone_number: "",
  hire_date: "",
  date_of_birth: "",
  manager_id: null,
  team_id: null,
  role_id: null
});

// odgovor 4.3 getSingleUser, null dok se ne učita
const employee = ref(null);
const form = ref(createEmptyForm());
// vrijednosti sa servera, za poređenje šta je izmijenjeno
const initial_form = ref(createEmptyForm());
const is_loading = ref(false);
const is_saving = ref(false);
const is_resetting = ref(false);
const error_message = ref("");
const totp_message = ref("");
const is_delete_open = ref(false);

// lokalni datum kao YYYY-MM-DD (sv-SE vraća baš taj oblik)
const today = new Date().toLocaleDateString("sv-SE");

watch(is_open, async (open) => {
  if (!open) return;

  employee.value = null;
  form.value = createEmptyForm();
  initial_form.value = createEmptyForm();
  error_message.value = "";
  totp_message.value = "";
  is_loading.value = true;

  // uloge se učitavaju samo prvi put
  const [{ data, error }] = await Promise.all([
    employees_store.fetchEmployee(props.employeeId),
    roles_store.items.length ? null : roles_store.fetchRoles()
  ]);

  is_loading.value = false;

  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }

  employee.value = data;
  form.value = {
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    phone_number: data.phone_number ?? "",
    hire_date: data.hire_date?.slice(0, 10) ?? "",
    // server vraća 1994-04-19T00:00:00Z, a VDateInput radi sa YYYY-MM-DD
    date_of_birth: data.date_of_birth?.slice(0, 10) ?? "",
    manager_id: data.manager_id ?? null,
    team_id: data.team_id ?? null,
    role_id: data.role?.id ?? null
  };
  initial_form.value = { ...form.value };
});

const full_name = computed(() =>
  [employee.value?.first_name, employee.value?.last_name].filter(Boolean).join(" ")
);

// veroispovest se samo prikazuje, naziv prati jezik
const religion_label = computed(
  () =>
    RELIGION_OPTIONS.find((option) => option.value === employee.value?.religion)?.label ?? "—"
);

const role_options = computed(() =>
  // naziv sistemske uloge je već preveden u roles store-u
  roles_store.items.map((role) => ({ value: role.id, label: role.name }))
);

// samo zaposleni sa pravom odobravanja (4.4 inače odbija), bez njega samog
const manager_options = computed(() =>
  employees_store.managerOptions(roles_store.approver_role_ids, props.employeeId)
);

// PATCH: šaljemo samo izmijenjeno, inače hire_date za ne-admina vrati 403
const changes = computed(() => {
  const { role_id, ...fields } = form.value;

  return Object.fromEntries(
    Object.entries(fields).filter(([key, value]) => value !== initial_form.value[key])
  );
});

const is_role_changed = computed(() => form.value.role_id !== initial_form.value.role_id);

const has_changes = computed(() => Object.keys(changes.value).length > 0 || is_role_changed.value);

// tim, nadređeni i uloga nisu obavezni, npr. direktor nema nadređenog
const is_valid = computed(() => {
  const { first_name, last_name, hire_date, date_of_birth } = form.value;

  return Boolean(
    has_changes.value &&
    first_name.trim() &&
    last_name.trim() &&
    (hire_date || !initial_form.value.hire_date) &&
    (!hire_date || hire_date <= today) &&
    (!date_of_birth || date_of_birth <= today)
  );
});

async function save() {
  if (!is_valid.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const error = await employees_store.updateEmployee(props.employeeId, changes.value, {
      role_id: form.value.role_id,
      previous_role_id: initial_form.value.role_id
    });

    // panel ostaje otvoren sa porukom servera
    if (error) {
      error_message.value = getErrorMessage(error);
      return;
    }

    is_open.value = false;
  } finally {
    is_saving.value = false;
  }
}

async function resetTotp() {
  const question = t("employees.edit.totp_confirm", { name: full_name.value });

  if (!window.confirm(question)) return;

  is_resetting.value = true;
  totp_message.value = "";

  const error = await employees_store.resetEmployeeTotp(props.employeeId);

  is_resetting.value = false;

  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }

  totp_message.value = t("employees.edit.totp_done");
}

function onDeleted() {
  is_open.value = false;
  emit("deleted");
}
</script>

<style lang="scss" scoped>
.employee-edit {
  // svaka cjelina je svijetlo siva kutija sa tankim okvirom
  &__card {
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  // dvije kolone, Veroispovest, Email, Telefon i Nadređeni preko cijele širine
  &__fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-12 $space-16;
  }

  &__wide {
    grid-column: 1 / -1;
  }

  // naslov polja kao kod VSelect / VDateInput
  &__fields :deep(.v-input) {
    gap: $space-4;
  }

  &__fields :deep(.v-input__label) {
    font-size: $text-12;
    line-height: $leading-xs;
  }

  // polja koja se ne mijenjaju imaju sivu pozadinu
  &__locked :deep(.v-input__field) {
    padding-left: $space-8;
    background: $cold-50;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
  }

  &__locked :deep(.v-input__control) {
    color: $fg-body;
    cursor: default;
  }

  &__totp {
    @include flex(flex-start, stretch, $space-16, column);
  }

  // dugme za brisanje lijevo, ostala desno
  &__delete {
    margin-right: auto;
  }

  &__message {
    font-size: $text-14;
    color: $fg-body;
  }

  &__success {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-success;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  @include respond-to("tablet-sm") {
    &__fields {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
