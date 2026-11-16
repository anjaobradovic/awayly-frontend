<template>
  <!-- detalji tipa odsustva, samo pregled -->
  <VDrawer
    v-model:open="is_open"
    :title="$t('absence_types.form.details_title')"
    width="35rem"
    :illustration="illustration"
  >
    <template v-if="type">
      <section class="absence-type-details__card absence-type-details__summary">
        <div class="absence-type-details__heading">
          <p class="absence-type-details__name">{{ type_name }}</p>
          <p v-if="group" class="absence-type-details__group">{{ group }}</p>
        </div>
        <VChip :tone="type.is_system ? 'action' : 'default'">
          {{ $t(type.is_system ? "absence_types.system" : "absence_types.custom") }}
        </VChip>
      </section>

      <!-- ista polja kao kod dodavanja, ali se ne mijenjaju -->
      <section class="absence-type-details__card absence-type-details__fields">
        <VBaseInput
          v-for="field in fields"
          :key="field.key"
          :model-value="field.value"
          :label="field.label"
          appearance="outlined"
          :clearable="false"
          readonly
        />
      </section>
    </template>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.close") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VChip from "@/components/VChip.vue";
import { leaveTypeName } from "@/utils/leave-type-name";
import { t } from "@/i18n";
import illustration from "@/assets/images/absence-type-details.svg";

const is_open = defineModel("open", { type: Boolean, default: false });

// red iz tabele, svi podaci već stižu kroz 10.1
const props = defineProps({
  type: { type: Object, default: null },
  group: { type: String, default: "" }
});

// sistemski naziv na trenutnom jeziku
const type_name = computed(() => leaveTypeName(props.type?.api_name ?? props.type?.name));

const yesNo = (group, value) => t(`absence_types.${group}.${value ? "yes" : "no"}`);

// tekstovi su isti kao opcije kod dodavanja
const fields = computed(() => {
  const type = props.type;

  return [
    { key: "name", label: t("absence_types.form.name"), value: type_name.value },
    {
      key: "balance",
      label: t("absence_types.form.balance"),
      value: yesNo("balance_option", type.reduces_balance)
    },
    {
      key: "approval",
      label: t("absence_types.form.approval"),
      value: yesNo("approval", type.requires_approval)
    },
    {
      key: "reason",
      label: t("absence_types.form.reason"),
      value: yesNo("reason", type.requires_reason)
    },
    {
      key: "notice",
      label: t("absence_types.form.notice"),
      value: t("common.days", { count: type.notice_days ?? 0 })
    },
    {
      key: "past_dates",
      label: t("absence_types.form.past_dates"),
      value: yesNo("past_dates", type.allow_past_dates)
    }
  ];
});
</script>

<style lang="scss" scoped>
.absence-type-details {
  // svaka cjelina je svijetlo siva kutija sa okvirom
  &__card {
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__summary {
    @include flex(space-between, center, $space-16);
  }

  &__heading {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
  }

  &__name {
    @include truncate;
    max-width: 100%;
    font-size: $text-16;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__group {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__fields {
    @include flex(flex-start, stretch, $space-16, column);
  }

  &__fields :deep(.v-input) {
    gap: $space-4;
  }

  &__fields :deep(.v-input__label) {
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
  }

  // polje sa okvirom na svijetlo sivoj pozadini
  &__fields :deep(.v-input__field) {
    padding-left: $space-8;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
  }

  &__fields :deep(.v-input__control) {
    color: $fg-heading;
    cursor: default;
  }
}
</style>
