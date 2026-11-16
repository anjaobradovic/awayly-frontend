<template>
  <VDialog v-model:open="is_open" :title="$t('layout.profile.title')" width="36.5625rem">
    <p v-if="is_loading" class="profile-settings__message">{{ $t("common.states.loading") }}</p>
    <p v-else-if="load_error" class="profile-settings__error" role="alert">{{ load_error }}</p>

    <template v-else-if="profile">
      <EmployeeSummary :employee="profile" />

      <dl class="profile-settings__info">
        <div v-for="item in info_items" :key="item.icon" class="profile-settings__info-item">
          <span class="profile-settings__info-icon" aria-hidden="true">
            <VIcon :name="item.icon" :size="24" />
          </span>
          <div class="profile-settings__info-text">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value || "—" }}</dd>
          </div>
        </div>
      </dl>

      <section class="profile-settings__card">
        <h3 class="profile-settings__card-title">{{ $t("layout.profile.personal") }}</h3>
        <div class="profile-settings__row">
          <VBaseInput
            v-model="form.phone_number"
            type="tel"
            :label="$t('layout.profile.phone')"
            appearance="outlined"
            placeholder="064 123 4567"
            :status="phone_error ? 'error' : 'default'"
            :supporting-text="phone_error"
          />
          <VSelect
            v-model="form.religion"
            :label="$t('layout.profile.religion')"
            :options="RELIGION_OPTIONS"
          />
        </div>
      </section>

      <!-- tema se primenjuje odmah, ne čeka Sačuvaj -->
      <section class="profile-settings__card">
        <h3 class="profile-settings__card-title">{{ $t("layout.profile.appearance") }}</h3>
        <p class="profile-settings__text">{{ $t("layout.profile.appearance_text") }}</p>
        <VSegmentedButton
          class="profile-settings__theme"
          :model-value="theme_store.mode"
          :options="theme_options"
          :aria-label="$t('layout.profile.appearance')"
          @update:model-value="theme_store.setMode($event)"
        />
      </section>

      <section class="profile-settings__card">
        <h3 class="profile-settings__card-title">{{ $t("layout.profile.security") }}</h3>
        <p class="profile-settings__text">{{ $t("layout.profile.security_text") }}</p>
        <VBaseButton appearance="outlined" color="neutral" block @click="emit('reset-totp')">
          {{ $t("layout.profile.reset_totp") }}
        </VBaseButton>
      </section>

      <p v-if="save_error" class="profile-settings__error" role="alert">{{ save_error }}</p>
    </template>

    <template #footer>
      <VBaseButton
        class="profile-settings__password"
        appearance="tonal"
        color="error"
        @click="emit('change-password')"
      >
        {{ $t("layout.profile.reset_password") }}
      </VBaseButton>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.close") }}
      </VBaseButton>
      <VBaseButton :disabled="!is_dirty || Boolean(phone_error) || is_saving" @click="save">
        {{ is_saving ? $t("common.states.saving") : $t("common.actions.save_changes") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VIcon from "@/components/VIcon.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VSelect from "@/components/VSelect.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import EmployeeSummary from "@/views/employees/components/EmployeeSummary.vue";
import { RELIGION_OPTIONS } from "@/views/employees/employee-config";
import { useAuthStore } from "@/stores/auth";
import { useEmployeesStore } from "@/stores/employees";
import { MODES, useThemeStore } from "@/stores/theme";
import { t } from "@/i18n";
import { useDate } from "@/composables/useDate";
import { roleName } from "@/utils/role-name";
import { getErrorMessage } from "@/utils/api-error";
import { isValidPhone, normalizePhone, phoneError } from "@/utils/phone";

const is_open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["reset-totp", "change-password"]);

const auth_store = useAuthStore();
const employees_store = useEmployeesStore();
const theme_store = useThemeStore();
const { formatDate } = useDate();

// odgovor 4.7 getMyProfile
const profile = computed(() => auth_store.profile);

// jedina polja koja korisnik sam menja (4.6 updateMyProfile)
const form = reactive({ phone_number: "", religion: null });
const initial = ref({ phone_number: "", religion: null });

const is_loading = ref(false);
const is_saving = ref(false);
const load_error = ref("");
const save_error = ref("");

// podatke učitava roditelj prije otvaranja, da se dijalog ne pojavi prazan
async function load() {
  load_error.value = "";
  is_loading.value = true;

  // 4.7 vraća samo id-jeve, imena čitamo iz liste zaposlenih (USER.MANAGE)
  const can_load_users =
    !employees_store.all_users.length && auth_store.user.permissions?.includes("USER.MANAGE");

  const [{ error }] = await Promise.all([
    auth_store.fetchMyProfile(),
    can_load_users && employees_store.fetchOptions()
  ]);

  is_loading.value = false;

  if (error) load_error.value = getErrorMessage(error);
}

// forma se uvijek puni iz store-a, nesačuvane izmjene se ne pamte
watch(is_open, (open) => {
  if (!open) return;

  save_error.value = "";
  initial.value = {
    phone_number: profile.value?.phone_number ?? "",
    religion: profile.value?.religion ?? null
  };
  Object.assign(form, initial.value);
});

defineExpose({ load });

const changes = computed(() =>
  Object.fromEntries(Object.entries(form).filter(([key, value]) => value !== initial.value[key]))
);

const is_dirty = computed(() => Object.keys(changes.value).length > 0);

// samo srpski brojevi, prazno je ok; greška tek kad korisnik promijeni broj
const phone_error = computed(() => {
  const phone = form.phone_number.trim();

  if (!phone || form.phone_number === initial.value.phone_number) return "";

  return isValidPhone(phone) ? "" : phoneError();
});

const theme_options = computed(() =>
  MODES.map((mode) => ({ value: mode, label: t(`common.theme.${mode}`) }))
);

const manager_name = computed(
  () => employees_store.all_users.find((user) => user.id === profile.value?.manager_id)?.name ?? ""
);

const info_items = computed(() => [
  { label: t("layout.profile.role"), icon: "badge", value: roleName(profile.value?.role?.name) },
  { label: t("layout.profile.email"), icon: "mail_outline", value: profile.value?.email },
  { label: t("layout.profile.manager"), icon: "manage_accounts", value: manager_name.value },
  {
    label: t("layout.profile.hire_date"),
    icon: "calendar_month",
    value: profile.value?.hire_date ? formatDate(profile.value.hire_date, { dateOnly: true }) : ""
  }
]);

async function save() {
  is_saving.value = true;
  save_error.value = "";

  // backendu uvijek isti zapis: 064 123 4567 -> +381641234567
  const payload = { ...changes.value };

  if ("phone_number" in payload) payload.phone_number = normalizePhone(payload.phone_number);

  const { error } = await auth_store.updateMyProfile(payload);

  is_saving.value = false;

  if (error) {
    save_error.value = getErrorMessage(error);
    return;
  }

  is_open.value = false;
}
</script>

<style scoped lang="scss">
.profile-settings {
  &__message {
    font-size: $text-14;
    color: $fg-body;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  &__info {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 14.375rem);
    gap: $space-16;
    padding: $space-24 $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__info-item {
    @include flex(flex-start, center, $space-10);
    min-width: 0;
  }

  &__info-icon {
    @include flex(center, center);
    flex-shrink: 0;
    padding: $space-4;
    color: $fg-action;
    background: $alpha-primary-5;
    border-radius: $radius-pill;
  }

  &__info-text {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
    font-size: $text-12;
    line-height: $leading-xs;

    dt {
      color: $fg-body;
    }

    dd {
      max-width: 100%;
      overflow-wrap: anywhere;
      color: $fg-heading;
    }
  }

  &__card {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__card-title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__text {
    margin-top: -$space-8;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-24;

    // manji label i polje, da telefon stoji u ravni sa VSelect-om
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

  &__password {
    margin-right: auto;
  }

  &__theme {
    align-self: flex-start;
  }

  @include respond-to("mobile") {
    &__info,
    &__row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
