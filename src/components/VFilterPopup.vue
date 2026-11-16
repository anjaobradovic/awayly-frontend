<template>
  <div ref="root_ref" class="v-filter-popup" @keydown.esc="close">
    <slot name="trigger" :toggle="toggle" :open="is_open" />

    <!-- crveni krug sa brojem primijenjenih filtera -->
    <span v-if="count > 0" class="v-filter-popup__count" aria-hidden="true">{{ count }}</span>

    <Transition name="fade2x">
      <section
        v-if="is_open"
        ref="panel_ref"
        class="v-filter-popup__panel"
        :style="panel_style"
        role="dialog"
        :aria-label="title"
      >
        <header class="v-filter-popup__header">
          <h2 class="v-filter-popup__title">{{ title }}</h2>
          <button type="button" class="v-filter-popup__close" :aria-label="$t('common.actions.close')" @click="close">
            <VIcon name="close" :size="24" />
          </button>
        </header>

        <div class="v-filter-popup__body">
          <slot />
        </div>

        <footer class="v-filter-popup__footer">
          <VBaseButton
            appearance="tonal"
            color="error"
            :disabled="!canClear"
            @click="emit('clear')"
          >
            {{ clearLabel || $t("ui.filter.clear") }}
          </VBaseButton>

          <div class="v-filter-popup__actions">
            <VBaseButton appearance="tonal" color="neutral" @click="close">
              {{ $t("common.actions.cancel") }}
            </VBaseButton>
            <VBaseButton @click="emit('apply')">{{ applyLabel || $t("ui.filter.apply") }}</VBaseButton>
          </div>
        </footer>
      </section>
    </Transition>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import VIcon from "@/components/VIcon.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useClickOutside } from "@/composables/useClickOutside";

defineProps({
  title: { type: String, required: true },
  canClear: { type: Boolean, default: false },
  clearLabel: { type: String, default: "" },
  applyLabel: { type: String, default: "" },
  // broj primijenjenih filtera, 0 = bez broja
  count: { type: Number, default: 0 }
});

const is_open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["apply", "clear"]);

const root_ref = ref(null);
const panel_ref = ref(null);
const panel_style = ref({});

// razmak panela od ivice vidljivog dela strane
const GUTTER = 16;
const PANEL_WIDTH = 500;

// prvi roditelj koji siječe sadržaj, panel ne smije preko njega
function clipBounds() {
  let element = root_ref.value?.parentElement;

  while (element && element !== document.body) {
    if (getComputedStyle(element).overflowX !== "visible") return element.getBoundingClientRect();
    element = element.parentElement;
  }

  return { left: 0, right: window.innerWidth };
}

// panel je uz desnu ivicu dugmeta, na uskom ekranu se pomjera i sužava
// visina se ne siječe jer su liste i kalendar unutar panela
function place() {
  if (!root_ref.value || !panel_ref.value) return;

  const bounds = clipBounds();
  const left = Math.max(bounds.left, 0) + GUTTER;
  const right = Math.min(bounds.right, window.innerWidth) - GUTTER;
  const root = root_ref.value.getBoundingClientRect();
  const width = Math.min(PANEL_WIDTH, right - left);
  const panel_right = Math.min(Math.max(root.right, left + width), right);

  panel_style.value = {
    width: `${width}px`,
    right: `${root.right - panel_right}px`
  };
}

watch(is_open, async (open) => {
  if (!open) return;

  panel_style.value = {};
  await nextTick();
  place();
});

window.addEventListener("resize", place);
onBeforeUnmount(() => window.removeEventListener("resize", place));

const close = () => (is_open.value = false);
const toggle = () => (is_open.value = !is_open.value);

useClickOutside(root_ref, close);
</script>

<style scoped lang="scss">
@layer components {
  .v-filter-popup {
    position: relative;

    &__count {
      position: absolute;
      top: -0.5625rem;
      right: -0.5625rem;
      z-index: 1;
      @include flex(center, center);
      min-width: 1.375rem;
      height: 1.375rem;
      padding: 0 $space-4;
      font-size: $text-12;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-on-action;
      background: $icon-action;
      border-radius: $radius-xl;
      pointer-events: none;
    }

    &__panel {
      position: absolute;
      top: calc(100% + #{$space-8});
      right: 0;
      z-index: $z-dropdown;
      @include flex(flex-start, stretch, 0, column);
      // tačnu širinu, pomjeraj i visinu postavlja place()
      width: 31.25rem;
      max-width: calc(100vw - #{$space-32});
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-sm;
      box-shadow: $shadow-menu;
    }

    &__header {
      @include flex(space-between, center, $space-16);
      padding: $space-16;
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
      border-radius: $radius-xs;
      cursor: pointer;

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }

    &__body {
      @include flex(flex-start, stretch, $space-24, column);
      padding: 0 $space-16 $space-24;
    }

    &__footer {
      @include flex(space-between, center, $space-16);
      flex-wrap: wrap;
      padding: $space-16;
      border-top: 1px solid $border-default;
    }

    &__actions {
      @include flex(flex-end, center, $space-16);
    }
  }
}
</style>
