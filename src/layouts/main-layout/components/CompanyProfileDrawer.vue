<template>
  <VDrawer v-model:open="is_open" :title="$t('layout.company_profile.title')" width="35rem">
    <p v-if="company_store.is_loading" class="company-profile__message">
      {{ $t("common.states.loading") }}
    </p>

    <template v-else>
      <section class="company-profile__card company-profile__fields">
        <div class="company-profile__heading">
          <h3 class="company-profile__title">{{ $t("layout.company_profile.basics_title") }}</h3>
          <p class="company-profile__text">{{ $t("layout.company_profile.basics_text") }}</p>
        </div>

        <VBaseInput
          v-model="form.name"
          :label="$t('layout.company_profile.name')"
          appearance="outlined"
          :clearable="false"
        />
        <VBaseInput
          v-model="form.address"
          :label="$t('layout.company_profile.address')"
          appearance="outlined"
          :clearable="false"
        />
        <VBaseInput
          v-model="form.contact"
          type="email"
          :label="$t('layout.company_profile.contact')"
          appearance="outlined"
          :clearable="false"
        />
      </section>

      <section class="company-profile__card">
        <div class="company-profile__heading">
          <h3 class="company-profile__title">{{ $t("layout.company_profile.identity_title") }}</h3>
          <p class="company-profile__text">{{ $t("layout.company_profile.identity_text") }}</p>
        </div>

        <!-- izbor se odmah vidi, a pamti tek na Sačuvaj -->
        <div
          class="company-profile__themes"
          role="radiogroup"
          :aria-label="$t('layout.company_profile.accent')"
        >
          <CompanyThemeCard
            v-for="theme in ACCENTS"
            :key="theme.value"
            :label="$t(`layout.company_profile.themes.${theme.value}`)"
            :accent="theme.accent"
            :is-default="theme.value === DEFAULT_ACCENT"
            :selected="selected_theme === theme.value"
            @select="selected_theme = theme.value"
          />
        </div>
      </section>
    </template>

    <p v-if="error_message" class="company-profile__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton
        class="company-profile__save"
        :disabled="!has_changes || is_saving"
        @click="save"
      >
        {{ $t("common.actions.save_changes") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import CompanyThemeCard from "./CompanyThemeCard.vue";
import { useCompanyStore } from "@/stores/company";
import { t } from "@/i18n";
import { getErrorMessage } from "@/utils/api-error";
import { ACCENTS, DEFAULT_ACCENT, useThemeStore } from "@/stores/theme";

const is_open = defineModel("open", { type: Boolean, default: false });


const FIELDS = ["name", "address", "contact"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const company_store = useCompanyStore();
const theme_store = useThemeStore();

const createForm = () =>
  Object.fromEntries(FIELDS.map((key) => [key, company_store.company?.[key] ?? ""]));

const form = ref(createForm());
const initial = ref(createForm());
const selected_theme = ref(theme_store.accent);
const is_saving = ref(false);
const error_message = ref("");

// pregled boje uživo, bez čuvanja
watch(selected_theme, (accent) => {
  document.documentElement.dataset.accent = accent;
});

watch(is_open, async (open) => {
  // zatvaranje bez čuvanja vraća sačuvanu boju
  if (!open) {
    theme_store.apply();
    return;
  }

  error_message.value = "";
  selected_theme.value = theme_store.accent;

  const error = await company_store.fetchCompany();

  if (error) error_message.value = getErrorMessage(error);

  form.value = createForm();
  initial.value = createForm();
});

const changes = computed(() =>
  Object.fromEntries(
    FIELDS.filter((key) => form.value[key].trim() !== initial.value[key]).map((key) => [
      key,
      form.value[key].trim()
    ])
  )
);

const theme_changed = computed(() => selected_theme.value !== theme_store.accent);

const has_changes = computed(() => Object.keys(changes.value).length > 0 || theme_changed.value);

function validate() {
  if (FIELDS.some((key) => !form.value[key].trim())) return t("layout.company_profile.fill_all");
  if (!EMAIL.test(form.value.contact.trim())) return t("layout.validation.email");
  return "";
}

async function save() {
  error_message.value = validate();

  if (error_message.value) return;

  is_saving.value = true;

  const payload = { ...changes.value };

  if (theme_changed.value) payload.theme = selected_theme.value;

  const error = await company_store.updateCompany(payload);

  is_saving.value = false;

  if (error) {
    error_message.value = getErrorMessage(error);
    return;
  }

  theme_store.setAccent(selected_theme.value);

  is_open.value = false;
}
</script>

<style lang="scss" scoped>
.company-profile {
  &__card {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
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

  // neaktivno dugme kao u integracijama
  &__save.v-btn:disabled {
    color: $cold-350;
    background: $cold-50;
    border-color: $cold-50;
  }

  &__themes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-24 $space-36;
    padding-top: $space-8;
  }

  &__message {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__error {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-error;
  }

  @include respond-to("tablet-sm") {
    &__themes {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
