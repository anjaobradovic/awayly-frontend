<template>
  <!-- isti panel za dodavanje, pregled i izmjenu praznika -->
  <VDrawer v-model:open="is_open" :title="title" :illustration="illustration">
    <div class="holiday-drawer__fields">
      <VBaseInput
        v-model="form.name"
        :label="$t('holidays.drawer.name')"
        :placeholder="$t('holidays.drawer.name_placeholder')"
        appearance="outlined"
        :clearable="!is_readonly"
        :readonly="is_readonly"
      />

      <VBaseInput
        v-if="is_state"
        :model-value="holidayKindLabel(holiday.kind)"
        :label="$t('holidays.drawer.kind')"
        appearance="outlined"
        :clearable="false"
        readonly
      />

      <VDateInput
        v-model="form.date"
        :label="$t('holidays.drawer.date')"
        icon="today"
        :readonly="is_readonly"
      />
    </div>

    <p v-if="error_message" class="holiday-drawer__error" role="alert">{{ error_message }}</p>

    <template #footer>
      <VBaseButton
        v-if="mode === 'edit'"
        class="holiday-drawer__delete"
        appearance="tonal"
        color="error"
        :disabled="is_saving"
        @click="emit('delete', holiday)"
      >
        {{ $t("holidays.remove") }}
      </VBaseButton>

      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t(is_readonly ? "common.actions.close" : "common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton v-if="!is_readonly" :disabled="!can_save || is_saving" @click="save">
        {{ $t(mode === "edit" ? "common.actions.save" : "holidays.add") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VDateInput from "@/components/VDateInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { holidayKindLabel, useHolidaysStore } from "@/stores/holidays";
import { t } from "@/i18n";
import { getErrorMessage } from "@/utils/api-error";
import add_illustration from "@/assets/images/holiday-add.svg";
import details_illustration from "@/assets/images/holiday-details.svg";

const props = defineProps({
  // red iz tabele ({ id, name, date, kind, scope }) ili null za novi praznik
  holiday: { type: Object, default: null },
  mode: {
    type: String,
    default: "add",
    validator: (value) => ["add", "details", "edit"].includes(value)
  }
});

// ukloni praznik otvara isti dijalog kao brisanje iz menija
const emit = defineEmits(["delete"]);

const is_open = defineModel("open", { type: Boolean, default: false });

const holidays_store = useHolidaysStore();

const is_state = computed(() => props.holiday?.scope === "state");
// drzavni praznici su uvijek samo za citanje
const is_readonly = computed(() => props.mode === "details" || is_state.value);

const title = computed(() =>
  t(props.mode === "add" ? "holidays.add" : "holidays.drawer.details_title")
);
const illustration = computed(() =>
  props.mode === "add" ? add_illustration : details_illustration
);

// input type date ocekuje samo datum, bez vremena
const createForm = () => ({
  name: props.mode === "add" ? "" : (props.holiday?.name ?? ""),
  date: props.mode === "add" ? "" : (props.holiday?.date?.slice(0, 10) ?? "")
});

const form = ref(createForm());
const is_saving = ref(false);
const error_message = ref("");

// svako otvaranje krece od izabranog reda ili prazne forme
watch(is_open, (open) => {
  if (!open) return;

  form.value = createForm();
  error_message.value = "";
});

const is_valid = computed(() => Boolean(form.value.name.trim() && form.value.date));

// sacuvaj ima smisla tek kad se nesto promijeni
const is_changed = computed(() => {
  const initial = createForm();

  return form.value.name.trim() !== initial.name || form.value.date !== initial.date;
});

const can_save = computed(() => is_valid.value && (props.mode !== "edit" || is_changed.value));

// create i update primaju isto { date, name }
async function save() {
  if (!can_save.value) return;

  const body = { name: form.value.name.trim(), date: form.value.date };

  is_saving.value = true;
  error_message.value = "";

  try {
    const error =
      props.mode === "edit"
        ? await holidays_store.updateCompanyHoliday(props.holiday.id, body)
        : await holidays_store.createCompanyHoliday(body);

    // panel ostaje otvoren sa porukom ako server vrati grešku
    if (error) {
      error_message.value = getErrorMessage(error, t("common.states.error"));
      return;
    }

    is_open.value = false;
  } finally {
    is_saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.holiday-drawer {
  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;

    // VBaseInput je veci zbog logina, ovdje ga smanjujemo kao VDateInput
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

  // ukloni praznik lijevo, ostala dugmad desno
  &__delete {
    margin-right: auto;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
