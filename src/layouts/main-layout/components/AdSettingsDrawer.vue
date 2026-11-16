<template>
  <VDrawer v-model:open="is_open" :title="$t('layout.ad_settings.title')" width="35rem">
    <p v-if="ad_store.is_loading" class="ad-settings__message">
      {{ $t("common.states.loading") }}
    </p>

    <template v-else>
      <section class="ad-settings__card ad-settings__fields">
        <div class="ad-settings__heading">
          <h3 class="ad-settings__title">{{ $t("layout.ad_settings.connection_title") }}</h3>
          <p class="ad-settings__text">{{ $t("layout.ad_settings.connection_text") }}</p>
        </div>

        <VBaseInput
          v-model="form.ldap_host"
          label="Host"
          :placeholder="$t('layout.ad_settings.example', { value: '127.0.0.1' })"
          appearance="outlined"
          :clearable="false"
        />
        <VBaseInput
          v-model="form.ldap_port"
          label="Port"
          :placeholder="$t('layout.ad_settings.example', { value: '389' })"
          appearance="outlined"
          :clearable="false"
        />
        <VBaseInput
          v-model="form.ldap_base_dn"
          label="Base DN"
          :placeholder="$t('layout.ad_settings.example', { value: 'dc=codebron,dc=local' })"
          appearance="outlined"
          :clearable="false"
        />
        <VBaseInput
          v-model="form.ldap_bind_dn"
          label="Bind DN"
          :placeholder="
            $t('layout.ad_settings.example', { value: 'serviceaccount@codebron.local' })
          "
          appearance="outlined"
          :clearable="false"
        />
        <!-- server ne vraca lozinku, prazno polje znaci da ostaje stara -->
        <VBaseInput
          v-model="form.ldap_bind_password"
          type="password"
          :label="$t('layout.ad_settings.bind_password')"
          :placeholder="is_configured ? '••••••••••••••••' : ''"
          autocomplete="new-password"
          :clearable="false"
          appearance="outlined"
        />

        <VSwitch v-model="form.use_ssl" :label="$t('layout.ad_settings.use_ssl')" />
      </section>

      <section class="ad-settings__card ad-settings__test">
        <div class="ad-settings__heading">
          <h3 class="ad-settings__title">{{ $t("layout.ad_settings.test_title") }}</h3>
          <p class="ad-settings__text">
            {{ $t("layout.ad_settings.test_text", { app: APP_NAME }) }}
            <br />
            {{ $t("layout.ad_settings.test_hint") }}
          </p>
        </div>

        <div class="ad-settings__test-row">
          <button
            type="button"
            :class="['ad-settings__test-button', `is-${test_state}`]"
            :disabled="test_state === 'testing' || is_saving"
            @click="testConnection"
          >
            <VIcon v-if="test_state === 'testing'" name="sync" :size="18" class="is-spinning" />
            <VIcon v-else-if="test_state === 'success'" name="check_circle" :size="18" filled />
            <VIcon v-else-if="test_state === 'error'" name="cancel" :size="18" filled />
            {{ $t(`layout.ad_settings.test_states.${test_state}`) }}
          </button>

          <p v-if="last_tested" class="ad-settings__tested">
            {{ $t("layout.ad_settings.last_tested", { date: last_tested }) }}
          </p>
        </div>

        <!-- aktivacija tek posle uspjesnog testa, kad je AD aktivan dugme nestaje -->
        <VBaseButton
          v-if="!ad_store.is_ad_active"
          class="ad-settings__activate"
          block
          :disabled="!can_activate"
          @click="is_activate_open = true"
        >
          {{ $t("layout.ad_activate.title") }}
        </VBaseButton>
      </section>

      <p v-if="is_ad_active_notice" class="ad-settings__message">
        {{ $t("layout.ad_settings.active_notice") }}
      </p>
      <p v-if="sync_message" class="ad-settings__message">{{ sync_message }}</p>
    </template>

    <p v-if="error_message" class="ad-settings__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.close") }}
      </VBaseButton>
      <VBaseButton
        class="ad-settings__save"
        :disabled="!has_changes || is_saving || test_state === 'testing'"
        @click="save"
      >
        {{ $t("common.actions.save_changes") }}
      </VBaseButton>
    </template>
  </VDrawer>

  <AdActivateDialog v-model:open="is_activate_open" @activated="onActivated" />
</template>

<script setup>
import { APP_NAME } from "@/config";
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VSwitch from "@/components/VSwitch.vue";
import VIcon from "@/components/VIcon.vue";
import { getAdErrorMessage, useAdSettingsStore } from "@/stores/ad-settings";
import { useDate } from "@/composables/useDate";
import { getErrorCode } from "@/utils/api-error";
import { t } from "@/i18n";
import AdActivateDialog from "./AdActivateDialog.vue";

const is_open = defineModel("open", { type: Boolean, default: false });


const MIN_TESTING_MS = 800;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FIELDS = ["ldap_host", "ldap_port", "ldap_base_dn", "ldap_bind_dn", "use_ssl"];

const ad_store = useAdSettingsStore();
const { formatDate } = useDate();

const createForm = () => ({
  ldap_host: ad_store.settings?.ldap_host ?? "",
  // tekstualno polje, u broj se pretvara tek pri slanju
  ldap_port: String(ad_store.settings?.ldap_port ?? 389),
  ldap_base_dn: ad_store.settings?.ldap_base_dn ?? "",
  ldap_bind_dn: ad_store.settings?.ldap_bind_dn ?? "",
  ldap_bind_password: "",
  use_ssl: ad_store.settings?.use_ssl ?? false
});

const form = ref(createForm());
const initial = ref(createForm());
const test_state = ref("idle");
const is_saving = ref(false);
const is_activate_open = ref(false);
const is_ad_active_notice = ref(false);
const sync_message = ref("");
const error_message = ref("");

watch(is_open, async (open) => {
  if (!open) return;

  test_state.value = "idle";
  error_message.value = "";
  sync_message.value = "";
  is_ad_active_notice.value = false;

  const error = await ad_store.fetchSettings();

  // 404 znaci da AD jos nije podesen, pa samo prazna forma
  if (error && !String(getErrorCode(error) ?? "").startsWith("404")) {
    error_message.value = getAdErrorMessage(error);
  }

  form.value = createForm();
  initial.value = createForm();
});

// ako je AD vec sacuvan, lozinka nije obavezna
const is_configured = computed(() => Boolean(ad_store.settings?.ldap_host));

// samo izmijenjena polja, lozinka samo ako je upisana
const changes = computed(() => {
  const result = {};

  for (const key of FIELDS) {
    if (form.value[key] !== initial.value[key]) result[key] = form.value[key];
  }

  if (form.value.ldap_bind_password) result.ldap_bind_password = form.value.ldap_bind_password;
  if ("ldap_port" in result) result.ldap_port = Number(result.ldap_port);

  return result;
});

const has_changes = computed(() => Object.keys(changes.value).length > 0);

// svaka izmjena ponistava prethodni test (server brise tested_at)
watch(
  form,
  () => {
    if (test_state.value !== "testing") test_state.value = "idle";
  },
  { deep: true }
);

const last_tested = computed(() => formatDate(ad_store.settings?.tested_at).replace(" ", " - "));

// aktiviraj je crveno tek posle uspjesnog testa u ovom otvaranju
const can_activate = computed(
  () => test_state.value === "success" && ad_store.is_tested && !has_changes.value
);

function validate() {
  const { ldap_host, ldap_port, ldap_base_dn, ldap_bind_dn, ldap_bind_password } = form.value;
  const port = Number(ldap_port);

  if (!ldap_host?.trim() || !ldap_base_dn?.trim() || !ldap_bind_dn?.trim()) {
    return t("layout.ad_settings.errors.required");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return t("layout.ad_settings.errors.port");
  }

  if (!is_configured.value && !ldap_bind_password) return t("layout.ad_settings.errors.password");

  return "";
}

// prvo cuvamo izmjene jer test provjerava sacuvana podesavanja
async function saveChanges() {
  if (!has_changes.value) return true;

  const validation_error = validate();

  if (validation_error) {
    error_message.value = validation_error;
    return false;
  }

  const error = await ad_store.updateSettings(changes.value);

  if (error) {
    error_message.value = getAdErrorMessage(error);
    return false;
  }

  form.value = createForm();
  initial.value = createForm();

  return true;
}

async function testConnection() {
  error_message.value = "";
  test_state.value = "testing";

  const is_saved = await saveChanges();

  if (!is_saved) {
    test_state.value = "error";
    return;
  }

  // spiner ostaje bar MIN_TESTING_MS da ne trepne kod brzog servera
  const [error] = await Promise.all([ad_store.testConnection(), wait(MIN_TESTING_MS)]);

  test_state.value = error ? "error" : "success";

  if (error) error_message.value = getAdErrorMessage(error);
}

async function save() {
  error_message.value = "";
  is_saving.value = true;

  const is_saved = await saveChanges();

  is_saving.value = false;

  if (is_saved) is_open.value = false;
}

function onActivated({ sync, sync_error }) {
  is_ad_active_notice.value = true;

  if (sync_error) {
    error_message.value = t("layout.ad_settings.sync_failed", {
      error: getAdErrorMessage(sync_error)
    });
    return;
  }

  if (sync) {
    const { created, updated, deactivated, reactivated } = sync;

    sync_message.value = t("layout.ad_settings.sync_done", {
      created,
      updated,
      deactivated,
      reactivated
    });
  }
}
</script>

<style lang="scss" scoped>
.ad-settings {
  &__card {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__test {
    gap: $space-24;
  }

  &__test-row {
    @include flex(flex-start, stretch, $space-12, column);
  }

  // neaktivno dugme je svijetlo, ne tamno kao u tokenima
  &__activate.v-btn:disabled,
  &__save.v-btn:disabled {
    color: $cold-350;
    background: $cold-50;
    border-color: $cold-50;
  }

  &__heading {
    @include flex(flex-start, flex-start, $space-8, column);
  }

  &__title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__text {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__fields :deep(.v-input) {
    gap: $space-4;
  }

  &__fields :deep(.v-input__label) {
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
  }

  &__fields :deep(.v-switch) {
    padding: $space-8 0;
  }

  // posle testa okvir i tekst su u boji rezultata
  &__test-button {
    @include flex(center, center, $space-8);
    width: 100%;
    height: 2rem;
    padding: $space-8;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:hover:not(:disabled) {
      background: $surface-default-hover;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }

    &:disabled {
      cursor: default;
    }

    &.is-success {
      color: $fg-success;
      border-color: $border-success;
    }

    &.is-error {
      color: $fg-error;
      border-color: $border-error;
    }
  }

  &__tested {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__message {
    font-size: $text-14;
    color: $fg-body;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}

.is-spinning {
  animation: ad-spin 1s linear infinite;
}

@keyframes ad-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-spinning {
    animation: none;
  }
}
</style>
