<template>
  <Teleport to="body">
    <Transition :name="`v-drawer-${transition}`">
      <div v-if="is_open" class="v-drawer" @keydown.esc="close">
        <div class="v-drawer__backdrop" @click="close" />

        <section
          ref="panel_ref"
          class="v-drawer__panel"
          tabindex="-1"
          :style="{ width }"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="v-drawer__header">
            <slot name="title">
              <h2 class="v-drawer__title">{{ title }}</h2>
            </slot>
            <div class="v-drawer__actions">
              <slot name="actions" />
              <button type="button" class="v-drawer__close" :aria-label="$t('common.actions.close')" @click="close">
                <VIcon :name="closeIcon" :size="24" />
              </button>
            </div>
          </header>

          <div class="v-drawer__body">
            <slot />

            <div v-if="illustration" class="v-drawer__illustration">
              <img :src="illustration" alt="" width="281" height="281" />
            </div>
          </div>

          <footer v-if="$slots.footer" class="v-drawer__footer">
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
  width: { type: String, default: "37.5rem" },
  illustration: { type: String, default: "" },
  closeIcon: { type: String, default: "close" },
  transition: {
    type: String,
    default: "slide",
    validator: (value) => ["slide", "dissolve"].includes(value)
  }
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
  .v-drawer {
    position: fixed;
    inset: 0;
    z-index: $z-modal;
    display: flex;
    justify-content: flex-end;

    &__backdrop {
      position: absolute;
      inset: 0;
      background: rgba($black, 0.4);
    }

    &__panel {
      position: relative;
      @include flex(flex-start, stretch, 0, column);
      max-width: 100vw;
      height: 100%;
      background: $surface-default;
      box-shadow:
        0 12px 47px rgba($black, 0.12),
        0 1px 2px rgba($black, 0.15);

      &:focus {
        outline: none;
      }
    }

    &__header {
      @include flex(space-between, center, $space-16);
      flex-shrink: 0;
      padding: $space-16;
    }

    &__title {
      font-size: $text-20;
      font-weight: $weight-semibold;
      line-height: $leading-24;
      color: $fg-heading;
    }

    &__actions {
      @include flex(flex-end, center, $space-24);
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
      @include flex(flex-start, stretch, $space-24, column);
      flex: 1;
      min-height: 0;
      padding: $space-16;
      // tanak skrol uz desnu ivicu, vidi se samo kad sadržaj ne staje
      @include thin-scrollbar;
      overflow-y: auto;
    }

    &__illustration {
      @include flex(center, center);
      flex: 1;
      pointer-events: none;
    }

    &__footer {
      @include flex(flex-end, center, $space-16);
      flex-shrink: 0;
      padding: $space-16;
      border-top: 1px solid $border-default;
    }
  }

  .v-drawer-slide-enter-active,
  .v-drawer-slide-leave-active {
    transition: opacity 0.25s ease-in-out;

    .v-drawer__panel {
      transition: transform 0.25s ease-in-out;
    }
  }

  .v-drawer-slide-enter-from,
  .v-drawer-slide-leave-to {
    opacity: 0;

    .v-drawer__panel {
      transform: translateX(100%);
    }
  }

  .v-drawer-dissolve-enter-active,
  .v-drawer-dissolve-leave-active {
    transition: opacity 0.3s ease-out;
  }

  .v-drawer-dissolve-enter-from,
  .v-drawer-dissolve-leave-to {
    opacity: 0;
  }
}
</style>
