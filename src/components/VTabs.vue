<template>
  <div class="v-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="tab.value === model"
      :class="['v-tabs__tab', { 'is-active': tab.value === model }]"
      @click="model = tab.value"
    >
      <VIcon v-if="tab.icon" :name="tab.icon" :size="20" />
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  tabs: {
    type: Array,
    required: true,
    validator: (list) => list.every((tab) => "value" in tab && "label" in tab)
  }
});

const model = defineModel({ type: [String, Number], required: true });
</script>

<style scoped lang="scss">
@layer components {
  .v-tabs {
    @include flex(flex-start, flex-end, $space-12);
    padding: $space-12 $space-24 0 $space-16;
    // previše tabova za širinu: skrol vodoravno, bez scrollbara
    overflow-x: auto;
    scrollbar-width: none;
    background: $surface-default;
    border-bottom: 1px solid $border-default;

    &::-webkit-scrollbar {
      display: none;
    }

    @include respond-to("mobile") {
      gap: $space-4;
      padding: $space-8 $space-8 0;
    }

    &__tab {
      position: relative;
      @include flex(center, center, $space-8);
      margin-bottom: -1px;
      height: 3rem;
      padding: $space-8 $space-16;
      font-family: inherit;
      font-size: $text-16;
      font-weight: $weight-semibold;
      line-height: $leading-sm;
      color: $fg-body;
      white-space: nowrap;
      background: transparent;
      border: 1px solid transparent;
      border-radius: $radius-sm $radius-sm 0 0;
      cursor: pointer;
      transition: $transition;

      &:hover {
        color: $fg-heading;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
        outline-offset: -1px;
      }

      // crvena linija ispod aktivnog taba
      &::after {
        content: "";
        position: absolute;
        right: $space-16;
        bottom: 0;
        left: $space-16;
        height: 2px;
        background: $surface-action;
        opacity: 0;
        transition: $transition;
      }

      @include respond-to("mobile") {
        flex-shrink: 0;
        padding: $space-8 $space-12;
        font-size: $text-14;
      }

      &.is-active {
        color: $fg-heading;
        background: $cold-50;
        border-color: $border-default;
        border-bottom-color: $cold-50;

        &::after {
          opacity: 1;
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      &__tab,
      &__tab::after {
        transition: none;
      }
    }
  }
}
</style>
