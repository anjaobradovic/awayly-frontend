<template>
  <VDialog v-model:open="is_open" :title="$t('layout.reset_totp.title')">
    <form class="reset-totp__card" @submit.prevent="confirm">
      <VBaseInput
        v-model="password"
        type="password"
        appearance="outlined"
        :label="$t('layout.reset_totp.password')"
        :placeholder="$t('layout.change_password.current_placeholder')"
        autocomplete="current-password"
        :clearable="false"
        :status="error_message ? 'error' : 'default'"
        :supporting-text="error_message"
      />
    </form>

    <VNotice>{{ $t("layout.reset_totp.notice") }}</VNotice>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" :disabled="is_busy" @click="emit('back')">
        {{ $t("common.actions.back") }}
      </VBaseButton>
      <VBaseButton :disabled="!password || is_busy" @click="confirm">
        {{ is_busy ? $t("layout.reset_totp.busy") : $t("common.actions.confirm") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useAuthStore } from "@/stores/auth";
import { getPasswordErrorMessage } from "@/utils/api-error";

const is_open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["back"]);

const auth_store = useAuthStore();

const password = ref("");
const is_busy = ref(false);
const error_message = ref("");

// lozinka se nikad ne zadržava između otvaranja
watch(is_open, (open) => {
  if (!open) return;

  password.value = "";
  error_message.value = "";
});

async function confirm() {
  if (!password.value || is_busy.value) return;

  is_busy.value = true;
  error_message.value = "";

  const error = await auth_store.resetTotp(password.value);

  is_busy.value = false;

  if (error) error_message.value = getPasswordErrorMessage(error);
}
</script>

<style scoped lang="scss">
.reset-totp {
  &__card {
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }
}
</style>
