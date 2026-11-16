<template>
  <VAuthCard :title="$t('auth.reset.title')" :description="$t('auth.reset.description')">
    <form class="reset" novalidate @submit.prevent="onSubmit">
      <div class="reset__fields">
        <VBaseInput
          v-model="email"
          :label="$t('auth.fields.email')"
          type="email"
          size="large"
          placeholder="example@example.com"
          autocomplete="email"
          :status="field_status"
          :supporting-text="error || success"
        />

        <VBaseButton
          appearance="text"
          color="neutral"
          class="reset__link"
          @click="router.push({ name: 'login' })"
        >
          {{ $t("auth.reset.back") }}
        </VBaseButton>
      </div>

      <div class="reset__actions">
        <VBaseButton type="submit" size="large" block :disabled="is_sending">
          {{ $t("auth.reset.submit") }}
        </VBaseButton>
      </div>
    </form>
  </VAuthCard>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import VAuthCard from "@/components/VAuthCard.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useAuthStore } from "@/stores/auth";
import { t } from "@/i18n";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const router = useRouter();
const auth_store = useAuthStore();

const email = ref("");
const error = ref("");
const success = ref("");
const is_sending = ref(false);

const field_status = computed(() => {
  if (error.value) return "error";
  if (success.value) return "success";
  return "default";
});

// nova adresa, stara poruka više ne važi
watch(email, () => {
  success.value = "";
});

async function onSubmit() {
  if (!email.value) error.value = t("auth.validation.email_required");
  else if (!EMAIL_PATTERN.test(email.value)) error.value = t("auth.validation.email_invalid");
  else error.value = "";

  if (error.value) return;

  is_sending.value = true;
  try {
    const err = await auth_store.requestPasswordReset(email.value);

    if (err) {
      error.value = err.details ?? t("auth.reset.failed");
      return;
    }

    success.value = t("auth.reset.sent");
  } finally {
    is_sending.value = false;
  }
}
</script>

<style scoped lang="scss">
.reset {
  @include flex(flex-start, stretch, $space-36, column);

  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
    padding: 0 $space-12;
  }

  &__link {
    align-self: center;
  }

  &__actions {
    padding: $space-12;
  }
}
</style>
