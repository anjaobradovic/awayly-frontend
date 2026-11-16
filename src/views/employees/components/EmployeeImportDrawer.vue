<template>
  <!-- uvoz: CSV se nalepi ili izabere, pregled redova pa slanje (5.2 bulkImportUsers) -->
  <VDrawer v-model:open="is_open" :title="$t('employees.import.title')" width="45rem">
    <template v-if="!result">
      <section class="employee-import__card">
        <p class="employee-import__text">{{ $t("employees.import.intro") }}</p>

        <VTextarea
          v-model="text"
          :label="$t('employees.import.paste_label')"
          :placeholder="$t('employees.import.paste_placeholder')"
          :rows="6"
        />

        <div class="employee-import__file">
          <VBaseButton appearance="outlined" color="neutral" size="small" @click="pickFile">
            <VIcon name="upload_file" :size="16" />
            {{ $t("employees.import.choose_csv") }}
          </VBaseButton>
          <span v-if="file_name" class="employee-import__file-name">{{ file_name }}</span>
          <input
            ref="file_ref"
            class="employee-import__input"
            type="file"
            accept=".csv,text/csv"
            tabindex="-1"
            aria-hidden="true"
            @change="readFile"
          />
        </div>
      </section>

      <section class="employee-import__card">
        <header class="employee-import__preview-head">
          <h3 class="employee-import__title">{{ $t("employees.import.preview") }}</h3>
          <p v-if="parsed.rows.length" class="employee-import__summary">
            <span class="employee-import__ok">
              {{ $t("employees.import.ready", { count: valid_rows.length }) }}
            </span>
            <span v-if="invalid_count" class="employee-import__bad">
              {{ $t("employees.import.invalid", { count: invalid_count }) }}
            </span>
          </p>
        </header>

        <p v-if="!parsed.rows.length" class="employee-import__muted">
          {{ $t("employees.import.preview_empty") }}
        </p>

        <template v-else>
          <p v-if="parsed.has_header" class="employee-import__muted">
            {{ $t("employees.import.header_detected") }}
          </p>

          <EmployeeImportPreview :rows="parsed.rows" />
        </template>
      </section>
    </template>

    <EmployeeImportResult v-else :result="result" />

    <p v-if="error_message" class="employee-import__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <template v-if="!result">
        <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
          {{ $t("common.actions.cancel") }}
        </VBaseButton>
        <VBaseButton :disabled="!valid_rows.length || is_saving" @click="save">
          {{
            valid_rows.length
              ? $t("employees.import.submit_count", { count: valid_rows.length })
              : $t("employees.import.submit")
          }}
        </VBaseButton>
      </template>
      <VBaseButton v-else @click="is_open = false">{{ $t("employees.import.ok") }}</VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VTextarea from "@/components/VTextarea.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorMessage } from "@/utils/api-error";
import { t } from "@/i18n";
import { parseEmployeesCsv } from "../import-csv";
import EmployeeImportPreview from "./EmployeeImportPreview.vue";
import EmployeeImportResult from "./EmployeeImportResult.vue";

const is_open = defineModel("open", { type: Boolean, default: false });

const employees_store = useEmployeesStore();

const text = ref("");
const file_name = ref("");
const file_ref = ref(null);
const is_saving = ref(false);
const error_message = ref("");
// odgovor servera { imported, skipped }, poslije uvoza panel prikazuje samo rezultat
const result = ref(null);

// lokalni datum kao YYYY-MM-DD (sv-SE vraća baš taj oblik)
const today = new Date().toLocaleDateString("sv-SE");

watch(is_open, (open) => {
  if (!open) return;

  text.value = "";
  file_name.value = "";
  error_message.value = "";
  result.value = null;

  // postojeći emailovi i timovi za provjeru u pregledu
  if (!employees_store.all_users.length) employees_store.fetchOptions();
});

const parsed = computed(() =>
  parseEmployeesCsv(text.value, {
    existing_emails: employees_store.all_users.map((user) => user.email),
    teams: employees_store.team_options.map((team) => team.label),
    today
  })
);

const valid_rows = computed(() => parsed.value.rows.filter((row) => !row.errors.length));
const invalid_count = computed(() => parsed.value.rows.length - valid_rows.value.length);

function pickFile() {
  file_ref.value?.click();
}

// CSV se samo učita u polje, pa se može i ručno ispraviti
async function readFile(event) {
  const file = event.target.files?.[0];

  event.target.value = "";
  if (!file) return;

  error_message.value = "";

  try {
    text.value = await file.text();
    file_name.value = file.name;
  } catch {
    error_message.value = t("employees.import.errors.file_read");
  }
}

async function save() {
  if (!valid_rows.value.length) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const { data, error } = await employees_store.importEmployees(
      valid_rows.value.map((row) => row.values)
    );

    if (error) {
      error_message.value = getErrorMessage(error);
      return;
    }

    result.value = data;
  } finally {
    is_saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.employee-import {
  &__card {
    @include flex(flex-start, stretch, $space-12, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__text,
  &__muted {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__file {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
  }

  &__file-name {
    @include truncate;
    font-size: $text-12;
    color: $fg-heading;
  }

  // pravi input je skriven, otvara ga dugme
  &__input {
    display: none;
  }

  &__preview-head {
    @include flex(space-between, center, $space-8);
    flex-wrap: wrap;
  }

  &__title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__summary {
    @include flex(flex-start, center, $space-12);
    font-size: $text-12;
    line-height: $leading-xs;
  }

  &__ok {
    color: $fg-success;
  }

  &__bad,
  &__error {
    color: $fg-error;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
  }
}
</style>
