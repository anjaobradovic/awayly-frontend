<template>
  <article class="policy-settings">
    <section
      v-for="(section, index) in SETTINGS_SECTIONS"
      :key="index"
      class="policy-settings__section"
    >
      <VSwitch
        v-if="section.toggle"
        :model-value="form[section.toggle]"
        class="policy-settings__switch"
        @update:model-value="set(section.toggle, $event)"
      >
        {{ $t(section.label) }}
      </VSwitch>

      <template v-if="!section.toggle || form[section.toggle]">
        <PolicyField
          v-for="field in section.fields"
          :key="field.key"
          :model-value="form[field.key]"
          :field="field"
          :form="form"
          @update:model-value="set(field.key, $event)"
        />
      </template>
    </section>

    <section class="policy-settings__section">
      <VDateInput
        v-model="carryover_date"
        :label="$t('policy.fields.carryover_date')"
        icon="today"
      />
    </section>

    <section class="policy-settings__section">
      <VSwitch
        :model-value="form.include_weekends_in_calendar"
        class="policy-settings__switch"
        @update:model-value="set('include_weekends_in_calendar', $event)"
      >
        {{ $t("policy.fields.include_weekends_in_calendar") }}
      </VSwitch>
    </section>
  </article>
</template>

<script setup>
import { computed } from "vue";
import VSwitch from "@/components/VSwitch.vue";
import VDateInput from "@/components/VDateInput.vue";
import PolicyField from "./PolicyField.vue";
import { SETTINGS_SECTIONS } from "../policy-config";

const form = defineModel("form", { type: Object, required: true });

const set = (key, value) => (form.value = { ...form.value, [key]: value });

const pad = (value) => String(value).padStart(2, "0");

const carryover_date = computed({
  get: () => {
    const { carryover_deadline_month: month, carryover_deadline_day: day } = form.value;

    if (!month || !day) return "";

    return `${new Date().getFullYear()}-${pad(month)}-${pad(day)}`;
  },
  set: (value) => {
    const [, month, day] = value ? value.split("-").map(Number) : [];

    form.value = {
      ...form.value,
      carryover_deadline_month: month ?? null,
      carryover_deadline_day: day ?? null
    };
  }
});
</script>

<style scoped lang="scss">
.policy-settings {
  @include flex(flex-start, stretch, $space-12, column);
  flex-shrink: 0;
  padding: $space-12;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xs;
  box-shadow:
    0 2px 5px rgba($black, 0.1),
    0 1px 0.5px rgba($black, 0.05);

  &__section {
    @include flex(flex-start, stretch, $space-8, column);
    padding: $space-8 $space-16 $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;

    &:has(> .policy-settings__switch:only-child) {
      padding-bottom: $space-8;
    }

    &:not(:has(.policy-settings__switch)) {
      padding-top: $space-16;
    }
  }

  &__switch {
    padding: $space-8 0;
  }
}
</style>
