<template>
  <!-- kartica na vrhu panela sa inicijalima, imenom, timom i statusom -->
  <section class="employee-summary">
    <span class="employee-summary__avatar" aria-hidden="true">{{ initials }}</span>
    <div class="employee-summary__person">
      <p class="employee-summary__name">{{ full_name }}</p>
      <p v-if="team_name" class="employee-summary__team">{{ team_name }}</p>
    </div>
    <VChip v-if="status" :tone="status.tone" :icon="status.icon">{{ status.label }}</VChip>
  </section>
</template>

<script setup>
import { computed } from "vue";
import VChip from "@/components/VChip.vue";
import { useEmployeesStore } from "@/stores/employees";
import { STATUS_CHIPS } from "../employee-config";

// odgovor 4.3 getSingleUser
const props = defineProps({
  employee: { type: Object, required: true }
});

const employees_store = useEmployeesStore();

const full_name = computed(() =>
  [props.employee.first_name, props.employee.last_name].filter(Boolean).join(" ")
);

const initials = computed(() =>
  [props.employee.first_name, props.employee.last_name]
    .map((part) => part?.charAt(0) ?? "")
    .join("")
    .toUpperCase()
);

const team_name = computed(
  () =>
    employees_store.team_options.find((team) => team.value === props.employee.team_id)?.label ?? ""
);

const status = computed(() => STATUS_CHIPS[props.employee.status] ?? null);
</script>

<style lang="scss" scoped>
.employee-summary {
  @include flex(flex-start, center, $space-12);
  padding: $space-12 $space-16;
  background: $cold-25;
  border: 1px solid $cold-50;
  border-radius: $radius-sm;

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    font-size: $text-12;
    font-weight: $weight-semibold;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__person {
    flex: 1;
    min-width: 0;
  }

  &__name {
    @include truncate;
    font-size: $text-16;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__team {
    @include truncate;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }
}
</style>
