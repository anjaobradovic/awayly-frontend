<template>
  <!-- rezultat uvoza (5.2): koliko je uvezeno i koji redovi su preskočeni -->
  <section class="import-result">
    <p class="import-result__title">
      <span class="import-result__icon" aria-hidden="true">
        <VIcon name="check_circle" :size="20" filled />
      </span>
      {{ $t("employees.import.result_imported", { count: result.imported }) }}
    </p>
    <p class="import-result__hint">{{ $t("employees.import.result_hint") }}</p>

    <template v-if="result.skipped?.length">
      <p class="import-result__skipped">
        {{ $t("employees.import.result_skipped", { count: result.skipped.length }) }}
      </p>
      <ul class="import-result__list">
        <li v-for="item in result.skipped" :key="`${item.row}-${item.email}`">
          {{ $t("employees.import.row") }} {{ item.row }}
          <template v-if="item.email">({{ item.email }})</template>
          — {{ reasonText(item.reason) }}
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";
import { t, te } from "@/i18n";

defineProps({
  // { imported, skipped: [{ row, email, reason }] }
  result: { type: Object, required: true }
});

const reasonText = (reason) =>
  te(`employees.import.errors.${reason}`) ? t(`employees.import.errors.${reason}`) : reason;
</script>

<style lang="scss" scoped>
.import-result {
  @include flex(flex-start, stretch, $space-8, column);
  padding: $space-16;
  background: $cold-25;
  border: 1px solid $cold-50;
  border-radius: $radius-sm;

  &__title {
    @include flex(flex-start, center, $space-8);
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__icon {
    display: inline-flex;
    color: $fg-success;
  }

  &__hint,
  &__list {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__skipped {
    margin-top: $space-8;
    font-size: $text-12;
    font-weight: $weight-semibold;
    color: $fg-error;
  }

  &__list {
    @include flex(flex-start, stretch, $space-4, column);
  }
}
</style>
