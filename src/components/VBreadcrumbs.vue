<template>
  <nav class="v-breadcrumbs" :aria-label="$t('ui.breadcrumbs')">
    <ol class="v-breadcrumbs__list">
      <li v-for="(item, index) in items" :key="item.label" class="v-breadcrumbs__item">
        <span v-if="index > 0" class="v-breadcrumbs__separator" aria-hidden="true">/</span>

        <component
          :is="item.to ? RouterLink : 'span'"
          :to="item.to"
          class="v-breadcrumbs__link"
          :aria-current="index === items.length - 1 ? 'page' : undefined"
        >
          <span
            v-if="item.icon"
            class="v-breadcrumbs__icon material-icons-outlined"
            aria-hidden="true"
          >
            {{ item.icon }}
          </span>
          {{ item.label }}
        </component>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { RouterLink } from "vue-router";
defineProps({
  items: {
    type: Array,
    required: true,
    validator: (v) => v.every((item) => typeof item.label === "string")
  }
});
</script>

<style scoped lang="scss">
@layer components {
  .v-breadcrumbs {
    &__list,
    &__item,
    &__link {
      @include flex(flex-start, center, $space-8);
    }

    &__link,
    &__separator {
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-body;
      white-space: nowrap;
    }

    a.v-breadcrumbs__link:hover {
      color: $fg-heading;
    }

    &__icon {
      font-size: $text-18;
    }
  }
}
</style>
