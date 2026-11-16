<template>
  <section class="request-group" :style="{ '--request-accent': resolveColor(accent) }">
    <header class="request-group__header">
      <div class="request-group__heading">
        <h2 class="request-group__title">{{ title }}</h2>
        <span class="request-group__dot" aria-hidden="true">·</span>
        <span class="request-group__count">{{ $t("requests.count", { count }) }}</span>
      </div>

      <VDropdown v-if="approvable" :label="$t('requests.group.actions_for', { title })">
        <VMenu>
          <VMenuItem :label="$t('requests.group.approve_all')" @click="emit('approve-all')" />
        </VMenu>
      </VDropdown>
    </header>
    <div class="request-group__list">
      <slot />
      <p v-if="!count" class="request-group__empty">{{ $t("requests.group.empty") }}</p>
    </div>
  </section>
</template>

<script setup>
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import { resolveColor } from "@/utils/color";

defineProps({
  title: { type: String, required: true },
  accent: { type: String, required: true },
  count: { type: Number, default: 0 },
  // true kad ima zahtjeva o kojima korisnik odlučuje, tad se vidi Odobri sve
  approvable: { type: Boolean, default: false }
});

const emit = defineEmits(["approve-all"]);
</script>

<style scoped lang="scss">
.request-group {
  @include flex(flex-start, stretch, $space-12, column);
  min-height: 0;
  padding: $space-16 $space-12 0;

  &__header {
    @include flex(space-between, center, $space-8);
    flex-shrink: 0;
    padding: $space-12;
    background-color: $surface-default;
    background-image: linear-gradient(
      90deg,
      color-mix(in srgb, var(--request-accent) 3%, transparent) 0%,
      transparent 100%
    );
    border-left: 2px solid var(--request-accent);
    border-radius: $radius-xs;
    box-shadow:
      0 1px 0.5px rgba($black, 0.05),
      0 2px 5px rgba($black, 0.1);
  }

  &__heading {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
  }

  &__title {
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__dot {
    font-size: $text-16;
    color: $fg-heading;
  }

  &__count {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    white-space: nowrap;
  }

  &__list {
    @include flex(flex-start, stretch, $space-12, column);
    flex: 1;
    min-height: 0;
    padding-right: $space-8;
    padding-bottom: $space-12;
    // uzak skrol sa crvenom ručicom, isto kao Timovi i Polise
    @include thin-scrollbar($primary);
  }

  &__empty {
    padding: $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }
}
</style>
