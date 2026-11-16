<template>
  <div ref="dropdown_ref" class="v-dropdown" @keydown.esc="close">
    <button
      type="button"
      class="v-dropdown__trigger"
      :aria-label="label || $t('ui.dropdown.more')"
      :aria-expanded="is_open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <slot name="trigger">
        <VIcon name="more_vert" :size="18" />
      </slot>
    </button>

    <Teleport to="body">
      <Transition name="fade2x">
        <div
          v-if="is_open"
          ref="panel_ref"
          class="v-dropdown__panel"
          :style="position"
          @click="close"
          @keydown.esc="close"
        >
          <slot />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { nextTick, onUnmounted, ref } from "vue";
import VIcon from "@/components/VIcon.vue";
import { useClickOutside } from "@/composables/useClickOutside";

const props = defineProps({
  label: { type: String, default: "" },
  align: {
    type: String,
    default: "end",
    validator: (value) => ["start", "end"].includes(value)
  }
});

// open, npr. da roditelj učita sadržaj tek kad se otvori
const emit = defineEmits(["open"]);

const GAP = 4;
const EDGE = 8;

const dropdown_ref = ref(null);
const panel_ref = ref(null);
const is_open = ref(false);
const position = ref({});

async function open() {
  is_open.value = true;
  emit("open");
  await nextTick();

  const trigger = dropdown_ref.value?.getBoundingClientRect();
  const panel = panel_ref.value?.getBoundingClientRect();

  if (!trigger || !panel) return;

  const fits_below = trigger.bottom + GAP + panel.height <= window.innerHeight - EDGE;
  const top = fits_below ? trigger.bottom + GAP : trigger.top - GAP - panel.height;

  const left =
    props.align === "end"
      ? Math.max(EDGE, trigger.right - panel.width)
      : Math.min(trigger.left, window.innerWidth - panel.width - EDGE);

  position.value = { top: `${Math.max(EDGE, top)}px`, left: `${left}px` };
}

const close = () => (is_open.value = false);
const toggle = () => (is_open.value ? close() : open());

useClickOutside(dropdown_ref, (event) => {
  if (!panel_ref.value?.contains(event.target)) close();
});

// skrol stranice zatvara panel, ali ne i skrol unutar panela
const onViewportChange = (event) => {
  if (!is_open.value) return;
  if (event?.type === "scroll" && panel_ref.value?.contains(event.target)) return;

  close();
};

window.addEventListener("scroll", onViewportChange, true);
window.addEventListener("resize", onViewportChange);

onUnmounted(() => {
  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange);
});
</script>

<style scoped lang="scss">
@layer components {
  .v-dropdown {
    position: relative;

    &__trigger {
      @include flex(center, center);
      padding: $space-4;
      color: $icon-default;
      background: transparent;
      border: none;
      border-radius: $radius-sm;
      cursor: pointer;
      transition: $transition;

      &:hover {
        color: $fg-heading;
        background: $surface-default-hover;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }
  }

  .v-dropdown__panel {
    position: fixed;
    z-index: $z-tooltip;
  }
}
</style>
