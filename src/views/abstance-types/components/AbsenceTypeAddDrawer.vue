<template>
  <VDrawer
    v-model:open="is_open"
    :title="$t(type ? 'absence_types.form.edit_title' : 'absence_types.form.add_title')"
    width="35rem"
    close-icon="arrow_back"
    :illustration="illustration"
  >
    <!-- sistemskom tipu se ime i uticaj na balans ne mogu mijenjati -->
    <template v-if="is_locked">
      <VBaseInput
        :model-value="type_name"
        :label="$t('absence_types.form.name')"
        appearance="outlined"
        :clearable="false"
        readonly
      />
      <VBaseInput
        :model-value="
          balance_options.find((option) => option.value === form.counts_against_balance)?.label
        "
        :label="$t('absence_types.form.balance')"
        appearance="outlined"
        :clearable="false"
        readonly
      />
    </template>

    <template v-else>
      <VBaseInput
        v-model="form.name"
        :label="$t('absence_types.form.name')"
        :placeholder="$t('absence_types.form.name_placeholder')"
        appearance="outlined"
      />

      <VSelect
        v-model="form.counts_against_balance"
        :label="$t('absence_types.form.balance')"
        :placeholder="$t('absence_types.form.balance_placeholder')"
        :options="balance_options"
      />
    </template>

    <VSelect
      v-model="form.requires_approval"
      :label="$t('absence_types.form.approval')"
      :placeholder="$t('absence_types.form.approval_placeholder')"
      :options="approval_options"
    />

    <VSelect
      v-model="form.requires_reason"
      :label="$t('absence_types.form.reason')"
      :placeholder="$t('absence_types.form.reason_placeholder')"
      :options="reason_options"
    />

    <VBaseInput
      v-model="form.min_advance_notice_days"
      :label="$t('absence_types.form.notice')"
      :placeholder="$t('absence_types.form.notice_placeholder')"
      type="number"
      appearance="outlined"
    />

    <VSelect
      v-model="form.allow_past_dates"
      :label="$t('absence_types.form.past_dates')"
      :placeholder="$t('absence_types.form.past_dates_placeholder')"
      :options="past_dates_options"
    />

    <p v-if="error_message" class="absence-type-add__error">{{ error_message }}</p>

    <template #footer>
      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!can_save || is_saving" @click="save">
        {{ $t(type ? "common.actions.save_changes" : "absence_types.form.submit") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VSelect from "@/components/VSelect.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useAbsenceTypesStore } from "@/stores/absence-types";
import { getErrorMessage } from "@/utils/api-error";
import { leaveTypeName } from "@/utils/leave-type-name";
import { t } from "@/i18n";
import illustration from "@/assets/images/absence-type-add.svg";

// da/ne biramo kao yes/no, u true/false tek pri slanju (toBody)
// tekst je u absence_types.<grupa>.yes / .no
const yesNoOptions = (group) =>
  ["yes", "no"].map((value) => ({ value, label: t(`absence_types.${group}.${value}`) }));

const balance_options = computed(() => yesNoOptions("balance_option"));
const approval_options = computed(() => yesNoOptions("approval"));
const reason_options = computed(() => yesNoOptions("reason"));
const past_dates_options = computed(() => yesNoOptions("past_dates"));

const is_open = defineModel("open", { type: Boolean, default: false });

// red iz tabele za izmjenu, null za novi tip
const props = defineProps({
  type: { type: Object, default: null }
});

const types_store = useAbsenceTypesStore();

const toOption = (value) => (value ? "yes" : "no");

// prazna forma za novi tip, popunjena za izmenu
const createForm = () =>
  props.type
    ? {
        name: props.type.api_name ?? props.type.name,
        counts_against_balance: toOption(props.type.reduces_balance),
        requires_approval: toOption(props.type.requires_approval),
        requires_reason: toOption(props.type.requires_reason),
        min_advance_notice_days: String(props.type.notice_days ?? 0),
        allow_past_dates: toOption(props.type.allow_past_dates)
      }
    : {
        name: "",
        counts_against_balance: null,
        requires_approval: null,
        requires_reason: null,
        min_advance_notice_days: "",
        allow_past_dates: null
      };

const is_locked = computed(() => Boolean(props.type?.is_system));

// sistemski naziv na trenutnom jeziku
const type_name = computed(() => leaveTypeName(props.type?.api_name ?? props.type?.name));

const form = ref(createForm());
const is_saving = ref(false);
const error_message = ref("");

watch(is_open, (open) => {
  if (!open) return;

  form.value = createForm();
  error_message.value = "";
});

// broj dana mora biti cijeli broj, 0 ili više
const notice_days = computed(() => Number(form.value.min_advance_notice_days));

const is_valid = computed(() => {
  const { name, counts_against_balance, requires_approval, requires_reason, allow_past_dates } =
    form.value;

  return Boolean(
    name.trim() &&
    counts_against_balance &&
    requires_approval &&
    requires_reason &&
    allow_past_dates &&
    form.value.min_advance_notice_days !== "" &&
    Number.isInteger(notice_days.value) &&
    notice_days.value >= 0
  );
});

// oblik koji traže 10.3 i 10.4
const toBody = (values) => ({
  name: values.name.trim(),
  counts_against_balance: values.counts_against_balance === "yes",
  requires_approval: values.requires_approval === "yes",
  requires_reason: values.requires_reason === "yes",
  min_advance_notice_days: Number(values.min_advance_notice_days),
  allow_past_dates: values.allow_past_dates === "yes"
});

// sistemskom tipu se ova polja nikad ne šalju (400.011.002)
const LOCKED_FIELDS = ["name", "counts_against_balance"];

// izmena šalje samo promenjena polja
const changes = computed(() => {
  const body = toBody(form.value);
  const initial = toBody(createForm());

  return Object.fromEntries(
    Object.entries(body).filter(
      ([key, value]) => value !== initial[key] && !(is_locked.value && LOCKED_FIELDS.includes(key))
    )
  );
});

const can_save = computed(
  () => is_valid.value && (!props.type || Object.keys(changes.value).length > 0)
);

async function save() {
  if (!can_save.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const error = props.type
      ? await types_store.updateType(props.type.id, changes.value)
      : await types_store.createType(toBody(form.value));

    // npr. 409, tip sa tim imenom već postoji
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
.absence-type-add {
  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
