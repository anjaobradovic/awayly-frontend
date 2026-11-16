<template>
  <!-- klik prebacuje svijetlu/tamnu temu, izbor se pamti -->
  <button
    type="button"
    class="theme-toggle"
    :aria-label="theme_store.is_dark ? $t('common.theme.to_light') : $t('common.theme.to_dark')"
    :title="theme_store.is_dark ? $t('common.theme.to_light') : $t('common.theme.to_dark')"
    @click="theme_store.toggleMode()"
  >
    <Transition name="theme-toggle" mode="out-in">
      <VIcon :key="icon" :name="icon" :size="22" color="icon-default" />
    </Transition>
  </button>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import { useThemeStore } from "@/stores/theme";

const theme_store = useThemeStore();

const icon = computed(() => (theme_store.is_dark ? "light_mode" : "dark_mode"));
</script>

<style lang="scss" scoped>
.theme-toggle {
  @include flex(center, center);
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: $transition;

  &:hover {
    background: $surface-default-hover;
    border-color: $border-default;
  }

  &:focus-visible {
    outline: 1px solid $border-action-focused;
    outline-offset: 1px;
  }
}

.theme-toggle-enter-active,
.theme-toggle-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.theme-toggle-enter-from {
  opacity: 0;
  transform: rotate(-90deg);
}

.theme-toggle-leave-to {
  opacity: 0;
  transform: rotate(90deg);
}
</style>
