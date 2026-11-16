<template>
  <Teleport to="body">
    <Transition name="v-dialog">
      <div v-if="is_open" class="v-dialog" @keydown.esc="close">
        <div class="v-dialog__backdrop" @click="close" />

        <section
          ref="panel_ref"
          class="v-dialog__panel"
          tabindex="-1"
          :style="{ width }"
          role="alertdialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="v-dialog__header">
            <h2 class="v-dialog__title">{{ title }}</h2>
            <button type="button" class="v-dialog__close" :aria-label="$t('common.actions.close')" @click="close">
              <VIcon name="close" :size="24" />
            </button>
          </header>

          <div :class="['v-dialog__body', { 'is-overflow-visible': overflowVisible }]">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="v-dialog__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import VIcon from "@/components/VIcon.vue";

defineProps({
  title: { type: String, required: true },
  width: { type: String, default: "35.1875rem" },
  overflowVisible: { type: Boolean, default: false }
});

const is_open = defineModel("open", { type: Boolean, default: false });

const panel_ref = ref(null);

const close = () => (is_open.value = false);

watch(is_open, async (open) => {
  if (!open) return;

  await nextTick();
  panel_ref.value?.focus();
});
</script>

<style scoped lang="scss">
@layer components {
  .v-dialog {
    position: fixed;
    inset: 0;
    z-index: $z-popup;
    @include flex(center, center);
    padding: $space-16;

    &__backdrop {
      position: absolute;
      inset: 0;
      background: rgba($black, 0.4);
    }

    &__panel {
      position: relative;
      @include flex(flex-start, stretch, $space-16, column);
      max-width: 100%;
      max-height: 100%;
      background: $surface-default;
      border-radius: $radius-lg;
      filter: drop-shadow(0 0 3.25px rgba($black, 0.15));

      &:focus {
        outline: none;
      }
    }

    &__header {
      @include flex(space-between, center, $space-16);
      padding: $space-16 $space-16 0;
    }

    &__title {
      font-size: $text-20;
      font-weight: $weight-semibold;
      line-height: $leading-24;
      color: $fg-heading;
    }

    &__close {
      @include flex(center, center);
      padding: 0;
      color: $fg-heading;
      background: transparent;
      border: none;
      border-radius: $radius-sm;
      cursor: pointer;

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }

    &__body {
      @include flex(flex-start, stretch, $space-12, column);
      min-height: 0;
      padding: $space-8 $space-16 0;
      overflow-y: auto;

      &.is-overflow-visible {
        overflow: visible;
      }
    }

    &__footer {
      @include flex(flex-end, center, $space-16);
      padding: $space-16;
      border-top: 1px solid $border-default;
    }
  }

  .v-dialog-enter-active,
  .v-dialog-leave-active {
    transition: opacity 0.2s ease-in-out;

    .v-dialog__panel {
      transition: transform 0.2s ease-in-out;
    }
  }

  .v-dialog-enter-from,
  .v-dialog-leave-to {
    opacity: 0;

    .v-dialog__panel {
      transform: scale(0.96);
    }
  }
}
</style>
