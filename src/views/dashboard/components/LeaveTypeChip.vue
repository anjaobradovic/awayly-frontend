<template>
  <!-- bijeli chip sa ikonicom i nazivom tipa, u boji kolone tipa -->
  <span :class="['leave-type-chip', { 'is-plain': plain }]" :style="{ '--chip-accent': accent }">
    <VIcon :name="iconOf(type)" :size="16" />
    {{ leaveTypeLabel(type) }}
  </span>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import { REQUEST_GROUPS, groupKeyOf, iconOf } from "@/views/requests/request-config";
import { resolveColor } from "@/utils/color";
import { leaveTypeLabel } from "@/utils/dashboard-data";

const props = defineProps({
  // srpski naziv tipa (ključ za ikonicu i boju), prikazuje se preveden
  type: { type: String, required: true },
  plain: { type: Boolean, default: false }
});

const accent = computed(() =>
  resolveColor(
    REQUEST_GROUPS.find((group) => group.key === groupKeyOf(props.type))?.accent ?? "absence-other"
  )
);
</script>

<style scoped lang="scss">
.leave-type-chip {
  @include flex(center, center, $space-4);
  flex-shrink: 0;
  padding: $space-4 $space-8;
  font-size: $text-12;
  line-height: $leading-xs;
  color: var(--chip-accent);
  white-space: nowrap;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;

  &.is-plain {
    padding: 0;
    background: none;
    border: none;
  }
}
</style>
