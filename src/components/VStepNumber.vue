<script setup>
defineProps({
  number: {
    type: [Number, String],
    required: true
  },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value)
  }
});
</script>

<template>
  <span class="v-step-number" :class="`v-step-number--${size}`">
    {{ number }}
  </span>
</template>

<style lang="scss" scoped>
.v-step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background-color: $alpha-primary-5;
  color: $fg-action;
  font-family: $font-family;
  font-weight: $weight-bold;
  line-height: 1;
  flex-shrink: 0;

  &--small {
    width: $space-32;
    height: $space-32;
    font-size: $text-14;
  }

  &--medium {
    width: $space-48;
    height: $space-48;
    font-size: $text-20;
  }

  &--large {
    width: $space-56;
    height: $space-56;
    font-size: $text-28;
  }
}
</style>
