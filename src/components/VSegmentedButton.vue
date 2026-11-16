<template>
  <!-- aktivna opcija ima okvir, kvačicu i crveni tekst -->
  <div :class="['v-segmented', `v-segmented--${size}`]" role="radiogroup">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="option.value === model"
      :class="['v-segmented__option', { 'is-active': option.value === model }]"
      @click="model = option.value"
    >
      <VIcon v-if="option.value === model" name="check" :size="16" />
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  options: {
    type: Array,
    required: true,
    validator: (list) => list.every((option) => "value" in option && "label" in option)
  },
  // default u traci kalendara, header uz kontrole headera, small u naslovu kartice
  size: {
    type: String,
    default: "default",
    validator: (value) => ["default", "header", "small"].includes(value)
  }
});

const model = defineModel({ type: [String, Number], required: true });
</script>

<style scoped lang="scss">
@layer components {
  .v-segmented {
    @include flex(center, center, $space-4);
    padding: $space-4;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xs;

    &__option {
      @include flex(center, center, $space-4);
      height: 2rem;
      padding: 0 $space-8;
      font-family: inherit;
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-body;
      white-space: nowrap;
      background: transparent;
      border: 1px solid transparent;
      border-radius: $radius-sm;
      cursor: pointer;
      transition: $transition;

      &:hover:not(.is-active) {
        color: $fg-heading;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
        outline-offset: -1px;
      }

      &.is-active {
        color: $fg-action;
        background: $surface-default;
        border-color: $border-default;
        cursor: default;
      }
    }

    &--header &__option {
      height: $size-header;
    }

    &--small &__option {
      height: 1.5rem;
    }

    @media (prefers-reduced-motion: reduce) {
      &__option {
        transition: none;
      }
    }
  }
}
</style>
