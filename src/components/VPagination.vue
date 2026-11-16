<template>
  <nav class="v-pagination" :aria-label="$t('ui.pagination.label')">
    <button
      type="button"
      class="v-pagination__button"
      :disabled="is_first"
      :aria-label="$t('ui.pagination.first')"
      @click="goTo(1)"
    >
      <VIcon name="first_page" :size="24" />
    </button>
    <button
      type="button"
      class="v-pagination__button"
      :disabled="is_first"
      :aria-label="$t('ui.pagination.previous')"
      @click="goTo(model - 1)"
    >
      <VIcon name="chevron_left" :size="24" />
    </button>

    <span class="v-pagination__text">{{ $t("ui.pagination.page") }}</span>
    <span class="v-pagination__current" aria-current="page">{{ model }}</span>
    <span class="v-pagination__text">{{ $t("ui.pagination.of", { total: totalPages }) }}</span>

    <button
      type="button"
      class="v-pagination__button"
      :disabled="is_last"
      :aria-label="$t('ui.pagination.next')"
      @click="goTo(model + 1)"
    >
      <VIcon name="chevron_right" :size="24" />
    </button>
    <button
      type="button"
      class="v-pagination__button"
      :disabled="is_last"
      :aria-label="$t('ui.pagination.last')"
      @click="goTo(totalPages)"
    >
      <VIcon name="last_page" :size="24" />
    </button>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";

const props = defineProps({
  totalPages: { type: Number, default: 1 }
});

// trenutna strana, roditelj je drži kroz v-model
const model = defineModel({ type: Number, default: 1 });

const is_first = computed(() => model.value <= 1);
const is_last = computed(() => model.value >= props.totalPages);

function goTo(page) {
  const next_page = Math.min(Math.max(page, 1), props.totalPages);
  if (next_page !== model.value) model.value = next_page;
}
</script>

<style scoped lang="scss">
@layer components {
  .v-pagination {
    @include flex(flex-start, center, $space-8);

    &__button {
      @include flex(center, center);
      padding: 0;
      color: $icon-default;
      background: transparent;
      border: none;
      border-radius: $radius-xs;
      cursor: pointer;
      transition: $transition;

      &:hover:not(:disabled) {
        color: $fg-heading;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    &__text {
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-heading;
      white-space: nowrap;
    }

    &__current {
      @include flex(center, center);
      width: 1.5rem;
      height: 1.5rem;
      font-size: $text-14;
      font-weight: $weight-semibold;
      color: $fg-heading;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-xs;
    }
  }
}
</style>
