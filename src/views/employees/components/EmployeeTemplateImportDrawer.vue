<template>
  <!-- uvoz putem šablona: preuzimanje (5.1), pa otpremanje popunjenog fajla (5.2) -->
  <VDrawer v-model:open="is_open" :title="$t('employees.import.template.title')">
    <template v-if="!result">
      <section class="template-import__step">
        <VStepNumber :number="1" />
        <div class="template-import__body">
          <h3 class="template-import__title">
            {{ $t("employees.import.template.step_download") }}
          </h3>
          <p class="template-import__text">
            {{ $t("employees.import.template.step_download_text") }}
          </p>
          <div class="template-import__downloads">
            <VBaseButton
              appearance="outlined"
              color="neutral"
              size="small"
              :disabled="is_downloading"
              @click="download('CSV')"
            >
              <VIcon name="save_alt" :size="16" />
              {{ $t("employees.import.template.download_csv") }}
            </VBaseButton>
          </div>
        </div>
      </section>

      <section class="template-import__step">
        <VStepNumber :number="2" />
        <div class="template-import__body">
          <h3 class="template-import__title">{{ $t("employees.import.template.step_upload") }}</h3>
          <p class="template-import__text">
            {{ $t("employees.import.template.step_upload_text") }}
          </p>

          <label
            :class="['template-import__drop', { 'is-dragging': is_dragging }]"
            @dragover.prevent="is_dragging = true"
            @dragleave="is_dragging = false"
            @drop.prevent="onDrop"
          >
            <VIcon name="upload_file" :size="28" />
            <span class="template-import__drop-action">
              {{ $t("employees.import.template.choose_file") }}
            </span>
            <span class="template-import__drop-hint">
              {{ $t("employees.import.template.drop_hint") }}
            </span>
            <input
              class="template-import__input"
              type="file"
              :accept="ACCEPT"
              @change="onPick"
            />
          </label>

          <div v-if="file" class="template-import__file">
            <VIcon name="description" :size="20" />
            <div class="template-import__file-text">
              <span class="template-import__file-name">{{ file.name }}</span>
              <span class="template-import__file-size">{{ file_size }}</span>
            </div>
            <button
              type="button"
              class="template-import__remove"
              :aria-label="$t('employees.import.template.remove_file')"
              @click="file = null"
            >
              <VIcon name="close" :size="18" />
            </button>
          </div>
        </div>
      </section>
    </template>

    <EmployeeImportResult v-else :result="result" />

    <p v-if="error_message" class="template-import__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <template v-if="!result">
        <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
          {{ $t("common.actions.cancel") }}
        </VBaseButton>
        <VBaseButton :disabled="!file || is_saving" @click="upload">
          <VIcon name="file_upload" :size="16" />
          {{ $t("employees.import.template.upload") }}
        </VBaseButton>
      </template>
      <VBaseButton v-else @click="is_open = false">{{ $t("employees.import.ok") }}</VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import VStepNumber from "@/components/VStepNumber.vue";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorCode, getErrorMessage } from "@/utils/api-error";
import { intlLocale, t } from "@/i18n";
import EmployeeImportResult from "./EmployeeImportResult.vue";

const ACCEPT =
  ".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const is_open = defineModel("open", { type: Boolean, default: false });

const employees_store = useEmployeesStore();

const file = ref(null);
const is_dragging = ref(false);
const is_downloading = ref(false);
const is_saving = ref(false);
const error_message = ref("");
const result = ref(null);

watch(is_open, (open) => {
  if (!open) return;

  file.value = null;
  error_message.value = "";
  result.value = null;
});

const file_size = computed(() => {
  const kb = (file.value?.size ?? 0) / 1024;

  return `${new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 1 }).format(kb)} KB`;
});

const isAccepted = (picked) => /\.(csv|xlsx)$/i.test(picked?.name ?? "");

function setFile(picked) {
  if (!picked) return;

  error_message.value = "";

  if (!isAccepted(picked)) {
    error_message.value = t("employees.import.errors.file_type");
    return;
  }

  file.value = picked;
}

function onPick(event) {
  setFile(event.target.files?.[0]);
  event.target.value = "";
}

function onDrop(event) {
  is_dragging.value = false;
  setFile(event.dataTransfer?.files?.[0]);
}

async function download(format) {
  is_downloading.value = true;
  error_message.value = "";

  const error = await employees_store.downloadTemplate(format);

  is_downloading.value = false;

  if (error) error_message.value = getErrorMessage(error);
}

async function upload() {
  if (!file.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const { data, error } = await employees_store.importTemplateFile(file.value);

    if (error) {
      // demo (mock) čita samo CSV
      error_message.value =
        getErrorCode(error) === "415.005.001"
          ? t("employees.import.errors.xlsx_demo")
          : getErrorMessage(error);
      return;
    }

    result.value = data;
  } finally {
    is_saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.template-import {
  &__step {
    @include flex(flex-start, flex-start, $space-12);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__body {
    @include flex(flex-start, stretch, $space-8, column);
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__text {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__downloads {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    margin-top: $space-4;
  }

  &__drop {
    @include flex(center, center, $space-4, column);
    margin-top: $space-4;
    padding: $space-24 $space-16;
    color: $fg-body;
    text-align: center;
    background: $surface-default;
    border: 1px dashed $border-default;
    border-radius: $radius-sm;
    cursor: pointer;

    &:hover,
    &.is-dragging {
      border-color: $border-action-focused;
      background: $alpha-primary-10;
    }

    &:focus-within {
      outline: 1px solid $border-action-focused;
    }
  }

  &__drop-action {
    font-size: $text-14;
    font-weight: $weight-semibold;
    color: $fg-action;
  }

  &__drop-hint {
    font-size: $text-12;
    line-height: $leading-xs;
  }

  // input vizuelno skriven, ali ostaje dostupan tastaturi kroz label
  &__input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  &__file {
    @include flex(flex-start, center, $space-8);
    padding: $space-8 $space-12;
    color: $fg-action;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
  }

  &__file-text {
    @include flex(flex-start, flex-start, 0, column);
    flex: 1;
    min-width: 0;
  }

  &__file-name {
    @include truncate;
    max-width: 100%;
    font-size: $text-14;
    color: $fg-heading;
  }

  &__file-size {
    font-size: $text-12;
    color: $fg-body;
  }

  &__remove {
    @include flex(center, center);
    padding: 0;
    color: $fg-body;
    background: transparent;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
