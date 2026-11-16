<template>
  <!-- okidač: hover i fokus (tastatura) otvaraju tooltip -->
  <span
    ref="trigger_ref"
    class="v-tooltip__trigger"
    tabindex="0"
    :aria-describedby="is_open ? tooltip_id : undefined"
    @mouseenter="open"
    @mouseleave="close"
    @focus="open"
    @blur="close"
    @keydown.esc="close"
  >
    <slot />
  </span>

  <Teleport to="body">
    <Transition name="fade2x">
      <div
        v-if="is_open"
        :id="tooltip_id"
        ref="tooltip_ref"
        role="tooltip"
        :class="['v-tooltip', `v-tooltip--${placement}`]"
        :style="position"
      >
        <p v-if="title" class="v-tooltip__title">{{ title }}</p>
        <p v-if="text" class="v-tooltip__text">{{ text }}</p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, useId } from "vue";

defineProps({
  title: { type: String, default: "" },
  text: { type: String, default: "" }
});

const ARROW_OFFSET = 26;
const GAP = 10;

const tooltip_id = useId();
const trigger_ref = ref(null);
const tooltip_ref = ref(null);
const is_open = ref(false);
const placement = ref("top");
const position = ref({});

async function open() {
  is_open.value = true;
  await nextTick();

  const trigger = trigger_ref.value?.getBoundingClientRect();
  const tooltip = tooltip_ref.value?.getBoundingClientRect();

  if (!trigger || !tooltip) return;


  const center = trigger.left + trigger.width / 2;
  const left = Math.max(8, center - (tooltip.width - ARROW_OFFSET));


  placement.value = trigger.top - tooltip.height - GAP < 8 ? "bottom" : "top";

  const top = placement.value === "top" ? trigger.top - tooltip.height - GAP : trigger.bottom + GAP;

  position.value = {
    left: `${left}px`,
    top: `${top}px`,
    "--v-tooltip-arrow": `${center - left}px`
  };
}

function close() {
  is_open.value = false;
}
</script>

<style scoped lang="scss">
@layer components {
  .v-tooltip__trigger {
    display: inline-flex;
    border-radius: $radius-xl;

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 1px;
    }
  }

  .v-tooltip {
    position: fixed;
    z-index: $z-tooltip;
    @include flex(flex-start, flex-start, $space-8, column);
    width: 17.9375rem;
    max-width: calc(100vw - #{$space-16});
    padding: $space-16;
    background: $surface-default;
    border-radius: $radius-sm;
    filter: drop-shadow(0 0 6px rgba($black, 0.06)) drop-shadow(0 2px 2px rgba($black, 0.25));
    pointer-events: none;


    &::after {
      content: "";
      position: absolute;
      left: var(--v-tooltip-arrow);
      width: 0.875rem;
      height: 0.875rem;
      background: $surface-default;
      transform: translateX(-50%) rotate(45deg);
    }

    &--top::after {
      bottom: -0.4375rem;
    }

    &--bottom::after {
      top: -0.4375rem;
    }

    &__title {
      font-size: $text-16;
      font-weight: $weight-semibold;
      line-height: $leading-sm;
      color: $fg-heading;
    }

    &__text {
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
    }
  }
}
</style>
