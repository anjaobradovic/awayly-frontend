<template>
  <!-- promjena sopstvene lozinke -->
  <VDialog v-model:open="is_open" :title="$t('layout.change_password.title')">
    <form class="change-password__card" novalidate @submit.prevent="confirm">
      <VBaseInput
        v-model="form.current_password"
        type="password"
        appearance="outlined"
        :label="$t('layout.change_password.current')"
        :placeholder="$t('layout.change_password.current_placeholder')"
        autocomplete="current-password"
        :clearable="false"
        :status="error_message ? 'error' : 'default'"
        :supporting-text="error_message"
      />
      <VBaseInput
        v-model="form.new_password"
        type="password"
        appearance="outlined"
        :label="$t('layout.change_password.new')"
        :placeholder="$t('layout.change_password.new_placeholder')"
        autocomplete="new-password"
        :clearable="false"
        :status="new_password_error ? 'error' : 'default'"
        :supporting-text="new_password_error"
      />
      <VBaseInput
        v-model="form.confirmed_new_password"
        type="password"
        appearance="outlined"
        :label="$t('layout.change_password.confirm')"
        :placeholder="$t('layout.change_password.confirm_placeholder')"
        autocomplete="new-password"
        :clearable="false"
        :status="confirm_error ? 'error' : 'default'"
        :supporting-text="confirm_error"
      />
      <!-- Enter u bilo kom polju šalje formu -->
      <button type="submit" hidden />
    </form>

    <VNotice>{{ $t("layout.change_password.notice") }}</VNotice>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" :disabled="is_busy" @click="emit('back')">
        {{ $t("common.actions.back") }}
      </VBaseButton>
      <VBaseButton :disabled="!can_submit" @click="confirm">
        {{ is_busy ? $t("common.states.saving") : $t("layout.change_password.submit") }}
      </VBaseButton>
    </template>
  </VDialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import VDialog from "@/components/VDialog.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useAuthStore } from "@/stores/auth";
import { t } from "@/i18n";
import { getPasswordErrorMessage } from "@/utils/api-error";

// isto pravilo kao backend: 8 do 50 znakova, slova, cifra i znak
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,50}$/;

const is_open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["back"]);

const auth_store = useAuthStore();

// ključevi su tačno polja iz tela 1.7 changePassword
const createEmptyForm = () => ({
  current_password: "",
  new_password: "",
  confirmed_new_password: ""
});

const form = reactive(createEmptyForm());
const is_busy = ref(false);
const error_message = ref("");

// lozinke se nikad ne zadržavaju između otvaranja
watch(is_open, (open) => {
  if (!open) return;

  Object.assign(form, createEmptyForm());
  error_message.value = "";
});

// greške se prikazuju tek kad je u polje nešto upisano, ne odmah na praznoj formi
const new_password_error = computed(() =>
  form.new_password && !PASSWORD_RULE.test(form.new_password)
    ? t("auth.password.rule")
    : ""
);

const confirm_error = computed(() =>
  form.confirmed_new_password && form.confirmed_new_password !== form.new_password
    ? t("auth.password.mismatch")
    : ""
);

const can_submit = computed(
  () =>
    Boolean(form.current_password && form.new_password && form.confirmed_new_password) &&
    !new_password_error.value &&
    !confirm_error.value &&
    !is_busy.value
);

async function confirm() {
  if (!can_submit.value) return;

  is_busy.value = true;
  error_message.value = "";

  // uspeh: store sam radi logout -> /login
  const error = await auth_store.changePassword({ ...form });

  is_busy.value = false;

  if (error) error_message.value = getPasswordErrorMessage(error);
}
</script>

<style scoped lang="scss">
.change-password {
  &__card {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }
}
</style>
