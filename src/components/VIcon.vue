<template>
  <span
    :class="['v-icon', filled ? 'material-icons' : 'material-icons-outlined']"
    :style="icon_style"
    aria-hidden="true"
  >
    {{ name }}
  </span>
</template>

<script setup>
import { computed } from "vue";
import { resolveColor } from "@/utils/color";

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  color: { type: String, default: "" },
  filled: { type: Boolean, default: false }
});

const icon_style = computed(() => ({
  "--v-icon-size": typeof props.size === "number" ? `${props.size}px` : props.size,
  "--v-icon-color": resolveColor(props.color)
}));
</script>

<style scoped lang="scss">
@layer components {
  .v-icon {
    display: inline-flex;
    flex-shrink: 0;
    font-size: var(--v-icon-size, 20px);
    line-height: 1;
    color: var(--v-icon-color, currentColor);
    user-select: none;
  }
}
</style>
