<template>
  <VAuthCard :title="$t('auth.login.title')" :description="$t('auth.login.description')">
    <form class="login" novalidate @submit.prevent="onSubmit">
      <div class="login__fields">
        <VBaseInput
          v-model="email"
          :label="$t('auth.fields.email')"
          type="email"
          size="large"
          placeholder="example@example.com"
          autocomplete="email"
          :status="errors.email ? 'error' : 'default'"
          :supporting-text="errors.email"
        />

        <VBaseInput
          v-model="password"
          :label="$t('auth.fields.password')"
          type="password"
          size="large"
          placeholder="••••••••••"
          autocomplete="current-password"
          :status="errors.password ? 'error' : 'default'"
          :supporting-text="errors.password"
        />

        <VBaseButton
          appearance="text"
          color="neutral"
          class="login__link"
          @click="router.push({ name: 'reset' })"
        >
          {{ $t("auth.login.forgot") }}
        </VBaseButton>
      </div>

      <div class="login__actions">
        <VBaseButton type="submit" size="large" block :disabled="auth_store.is_loading">
          {{ $t("auth.login.submit") }}
        </VBaseButton>

        <!-- portfolio demo bez backenda, mock prihvata bilo koje podatke -->
        <VNotice tone="info">{{ $t("auth.login.demo_hint") }}</VNotice>
      </div>
    </form>
  </VAuthCard>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import VAuthCard from "@/components/VAuthCard.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VNotice from "@/components/VNotice.vue";
import { useAuthStore } from "@/stores/auth";
import { t } from "@/i18n";
import { getErrorCode, getErrorMessage } from "@/utils/api-error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const router = useRouter();
const auth_store = useAuthStore();

const email = ref("");
const password = ref("");

// poruke ispod polja, prazan string znači da nema greške
const errors = reactive({ email: "", password: "" });

function validate() {
  if (!email.value) errors.email = t("auth.validation.email_required");
  else if (!EMAIL_PATTERN.test(email.value)) errors.email = t("auth.validation.email_invalid");
  else errors.email = "";

  errors.password = password.value ? "" : t("auth.validation.password_required");

  return !errors.email && !errors.password;
}

// Poznate greške logina (API 1.2) prevodimo; za ostale prikazujemo poruku sa servera
function getLoginErrorMessage(error) {
  if (error.is_locked) {
    return t("auth.login.locked");
  }

  if (getErrorCode(error) === "401.002.002") return t("auth.login.wrong_credentials");

  return getErrorMessage(error, t("auth.login.wrong_credentials"));
}

// Store sam preusmeri na 2FA kada login uspije
async function onSubmit() {
  if (!validate()) return;

  const error = await auth_store.login({ email: email.value, password: password.value });
  if (!error) return;

  errors.password = getLoginErrorMessage(error);
}
</script>

<style scoped lang="scss">
.login {
  @include flex(flex-start, stretch, $space-36, column);

  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
    padding: 0 $space-12;
  }

  &__link {
    align-self: center;
  }

  &__actions {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-12;
  }
}
</style>
