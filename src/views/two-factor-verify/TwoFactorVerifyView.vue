<template>
  <VAuthCard
    :title="$t('auth.verify.title')"
    :description="$t('auth.verify.description')"
    description-size="small"
  >
    <form class="verify" novalidate @submit.prevent="onSubmit">
      <div class="verify__code">
        <VOtpInput v-model="code" :length="CODE_LENGTH" :error="Boolean(error)" autofocus />
        <p v-if="error" class="verify__error" role="alert">{{ error }}</p>
      </div>

      <div class="verify__actions">
        <VBaseButton type="submit" size="large" block :disabled="is_verifying">
          {{ $t("auth.verify.submit") }}
        </VBaseButton>
      </div>

      <div class="verify__footer">
        <span>{{ $t("auth.verify.other_account") }}</span>
        <VBaseButton appearance="text" @click="router.push({ name: 'login' })">
          {{ $t("auth.reset.back") }}
        </VBaseButton>
      </div>
    </form>
  </VAuthCard>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import VAuthCard from "@/components/VAuthCard.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VOtpInput from "@/components/VOtpInput.vue";
import { useAuthStore } from "@/stores/auth";
import { t } from "@/i18n";

const CODE_LENGTH = 6;

const route = useRoute();
const router = useRouter();
const auth_store = useAuthStore();

const code = ref("");
const error = ref("");
const is_verifying = ref(false);

// Čim korisnik krene da ispravlja, skloni staru grešku
watch(code, () => {
  error.value = "";
});

async function onSubmit() {
  if (is_verifying.value) return;

  if (code.value.length < CODE_LENGTH) {
    error.value = t("auth.verify.incomplete", { count: CODE_LENGTH });
    return;
  }

  const is_setup = Boolean(route.query.setup);

  is_verifying.value = true;
  try {
    const err = await auth_store.verifyTotp(code.value);

    if (err) {
      error.value = err.details ?? t("auth.verify.invalid");
      return;
    }

    // prvo podesavanje 2FA ide na rezervne kodove, inace u aplikaciju
    if (is_setup) await router.push({ name: "two-factor-backup-codes" });
    else await router.push("/home");
  } finally {
    is_verifying.value = false;
  }
}
</script>

<style scoped lang="scss">
.verify {
  @include flex(flex-start, stretch, $space-36, column);

  &__code {
    @include flex(flex-start, center, $space-8, column);
    padding: 0 $space-12;
  }

  &__error {
    font-size: $text-14;
    color: $fg-error;
  }

  &__actions {
    padding: $space-12;
  }

  &__footer {
    @include flex(center, center, $space-16);
    flex-wrap: wrap;
    font-size: $text-14;
    color: $fg-heading;
    text-align: center;
  }
}
</style>
