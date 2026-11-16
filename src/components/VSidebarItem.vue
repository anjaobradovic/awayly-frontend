<template>
  <div :class="['v-sidebar-item', { 'is-active': active, 'is-open': open }]">
    <button
      type="button"
      class="v-sidebar-item__button"
      :aria-expanded="$slots.default ? open : undefined"
      :aria-haspopup="$slots.default ? 'menu' : undefined"
      @click="emit('click', $event)"
    >
      <span class="v-sidebar-item__icon material-icons-outlined" aria-hidden="true">
        {{ icon }}
      </span>
      <span class="v-sidebar-item__label">{{ label }}</span>
    </button>

    <!-- Dropdown: roditelj ubacuje <VMenu> kroz default slot -->
    <Transition name="fade2x">
      <div v-if="$slots.default && open" class="v-sidebar-item__menu">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  active: { type: Boolean, default: false },
  open: { type: Boolean, default: false }
});

const emit = defineEmits(["click"]);
</script>

<style scoped lang="scss">
@layer components {
  .v-sidebar-item {
    position: relative;
    width: 100%;

    &__button {
      @include flex(center, center, $space-4, column);
      width: 100%;
      aspect-ratio: 1;
      padding: $space-4;
      color: alpha($white, 0.62);
      background: transparent;
      border: none;
      border-radius: $radius-lg;
      cursor: pointer;
      transition: $transition;

      &:hover {
        color: $white;
        background: $alpha-white;
      }

      &:active {
        background: alpha($white, 0.16);
      }

      &:focus-visible {
        outline: 1px solid $white;
        outline-offset: -1px;
      }
    }

    &__icon {
      padding: $space-4;
      font-size: $text-24;
    }

    &__label {
      font-size: $text-12;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      text-align: center;
    }

    &.is-open &__button {
      color: $white;
      background: $alpha-white;
    }

    // aktivna grupa: boja akcenta + tanka linija lijevo
    &.is-active &__button {
      color: $white;
      background: $surface-action;
      box-shadow: 0 6px 16px -6px $primary-500;
    }

    &__menu {
      position: absolute;
      top: 0;
      left: calc(100% + #{$space-16});
      z-index: $z-dropdown;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .v-sidebar-item__button {
      transition: none;
    }
  }
}
</style>
