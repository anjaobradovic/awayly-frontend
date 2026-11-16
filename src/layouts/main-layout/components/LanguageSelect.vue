<template>
  <!-- zastavica i oznaka jezika, klik otvara listu -->
  <VDropdown class="language-select" :label="`${$t('common.language')}: ${current.label} ${current.hint}`">
    <template #trigger>
      <span class="language-select__trigger">
        <VFlag :country="current.flag" />
        <span class="language-select__code">{{ current.code }}</span>
        <VIcon name="expand_more" :size="20" color="icon-default" />
      </span>
    </template>

    <ul class="language-select__list" role="menu">
      <li v-for="language in LANGUAGES" :key="language.value" role="none">
        <button
          type="button"
          :class="['language-select__option', { 'is-selected': language.value === current.value }]"
          role="menuitemradio"
          :aria-checked="language.value === current.value"
          :lang="language.value"
          @click="locale_store.setLanguage(language.value)"
        >
          <span class="language-select__name">
            <VFlag :country="language.flag" />
            <span class="language-select__label">{{ language.label }}</span>
            <span class="language-select__hint">{{ language.hint }}</span>
          </span>

          <span v-if="language.value === current.value" class="language-select__check">
            <VIcon name="check" :size="18" color="fg-action" />
          </span>
        </button>
      </li>
    </ul>
  </VDropdown>
</template>

<script setup>
import { computed } from "vue";
import VDropdown from "@/components/VDropdown.vue";
import VFlag from "@/components/VFlag.vue";
import VIcon from "@/components/VIcon.vue";
import { LANGUAGES, useLocaleStore } from "@/stores/locale";

const locale_store = useLocaleStore();

const current = computed(() => locale_store.current);
</script>

<style lang="scss" scoped>
.language-select {
  // na hover pozadina i okvir
  :deep(.v-dropdown__trigger) {
    height: 2.25rem;
    padding: $space-8;
    border: 1px solid transparent;
    border-radius: $radius-lg;

    &:hover {
      background: $surface-default-hover;
      border-color: $border-default;
    }
  }

  &__trigger {
    @include flex(center, center, $space-4);
  }

  &__code {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
  }

  // telefon: samo zastavica
  @include respond-to("mobile") {
    &__code {
      display: none;
    }
  }

  &__list {
    width: 16.5625rem;
    max-width: calc(100vw - #{$space-32});
    margin: 0;
    padding: 0;
    overflow: hidden;
    list-style: none;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    box-shadow: $shadow-menu;
  }

  &__option {
    @include flex(space-between, center, $space-8);
    width: 100%;
    height: 2.625rem;
    padding: $space-12;
    font-family: inherit;
    text-align: left;
    background: transparent;
    border: none;
    border-bottom: 1px solid $border-default;
    border-radius: $radius-xs;
    cursor: pointer;
    transition: $transition;

    &:hover {
      background: $surface-default-hover;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: -1px;
    }
  }

  li:last-child &__option {
    border-bottom: none;
  }

  &__name {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
    white-space: nowrap;
  }

  &__label {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
  }

  &__hint {
    margin-left: -$space-4; // manji razmak izmedju naziva i napomene
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__option.is-selected &__label {
    font-weight: $weight-semibold;
  }

  &__check {
    @include flex(center, center);
    width: 1.5rem;
    height: 1.5rem;
  }
}
</style>
