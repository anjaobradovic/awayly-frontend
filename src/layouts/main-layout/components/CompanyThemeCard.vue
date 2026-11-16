<template>
  <button
    type="button"
    role="radio"
    :aria-checked="selected"
    :class="['theme-card', { 'is-selected': selected }]"
    :style="{ '--theme-accent': accent }"
    @click="emit('select')"
  >
    <span class="theme-card__frame">
      <span class="theme-card__preview" aria-hidden="true">
        <span class="theme-card__header">
          <span class="theme-card__pills">
            <span class="theme-card__pill is-accent" />
            <span class="theme-card__pill" />
          </span>
          <span class="theme-card__action" />
        </span>

        <span class="theme-card__tiles">
          <span v-for="tile in TILES" :key="tile" :class="['theme-card__tile', `is-${tile}`]">
            <span class="theme-card__line is-short" />
            <span class="theme-card__line" />
          </span>
        </span>
      </span>

      <img
        v-if="selected"
        class="theme-card__radio"
        :src="radio_selected"
        alt=""
        width="37"
        height="37"
      />
    </span>

    <span class="theme-card__label">
      <strong>{{ label }}</strong>
      <span v-if="isDefault" class="theme-card__default">
        ({{ $t("layout.company_profile.default") }})
      </span>
    </span>
  </button>
</template>

<script setup>
import radio_selected from "@/assets/images/company-profile/theme-radio-selected.svg";

defineProps({
  label: { type: String, required: true },
  accent: { type: String, required: true },
  selected: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false }
});

const emit = defineEmits(["select"]);

const TILES = ["blue", "orange", "teal", "gray"];
</script>

<style scoped lang="scss">
.theme-card {
  @include flex(flex-start, stretch, $space-8, column);
  padding: 0;
  font-family: inherit;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;

  &__frame {
    position: relative;
    display: block;
    padding: $space-2;
    border: 1px solid transparent;
    border-radius: $radius-lg;
    transition: $transition;
  }

  &:hover &__frame {
    border-color: $cold-300;
    box-shadow: $shadow-small;
  }

  // senka umjesto debljeg okvira, da se kartica ne pomjera
  &.is-selected &__frame {
    border-color: $icon-action;
    box-shadow: 0 0 0 1px $icon-action;
  }

  &:focus-visible {
    outline: none;

    .theme-card__frame {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }
  }

  &__preview {
    @include flex(flex-start, stretch, 0, column);
    height: 8.75rem;
    overflow: hidden;
    background: $surface-default;
    border: 1px solid $cold-200;
    border-left: 12px solid var(--theme-accent);
    border-radius: $radius-lg;
  }

  &__header {
    @include flex(space-between, center);
    flex-shrink: 0;
    height: 1.8125rem;
    padding: 0 $space-8 0 $space-4;
    background: $cold-100;
  }

  &__pills {
    @include flex(flex-start, center, $space-4);
  }

  &__pill {
    width: 1.9375rem;
    height: 0.5rem;
    background: $cold-200;
    border-radius: 47px;

    &.is-accent {
      width: 1.25rem;
      background: var(--theme-accent);
    }
  }

  &__action {
    width: 1.9375rem;
    height: 0.5rem;
    background: var(--theme-accent);
    border-radius: 1px;
  }

  &__tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-8;
    flex: 1;
    padding: $space-10 $space-12 $space-10 $space-8;
  }

  &__tile {
    @include flex(flex-end, flex-start, $space-4, column);
    padding: 0 $space-4 $space-8;
    border: 1px solid $cold-50;
    border-radius: $radius-xs;

    &.is-blue {
      background: linear-gradient(90deg, rgba(2, 132, 199, 0.08), rgba(2, 132, 199, 0)),
        $surface-default;
    }

    &.is-orange {
      background: linear-gradient(90deg, rgba(255, 145, 10, 0.08), rgba(255, 145, 10, 0.008)),
        $surface-default;
    }

    &.is-teal {
      background: linear-gradient(90deg, rgba(14, 155, 160, 0.08), rgba(14, 155, 160, 0.008)),
        $surface-default;
    }

    &.is-gray {
      background: linear-gradient(90deg, rgba(102, 102, 102, 0.08), rgba(102, 102, 102, 0.008)),
        $surface-default;
    }
  }

  &__line {
    width: 100%;
    height: 6px;
    background: $cold-200;
    border-radius: 47px;
    opacity: 0.5;

    &.is-short {
      width: 2.75rem;
    }
  }

  &__radio {
    position: absolute;
    right: 0;
    bottom: 0;
  }

  &__label {
    @include flex(flex-start, center, $space-4);
    padding: 0 $space-4;
    white-space: nowrap;

    strong {
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }
  }

  &__default {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }
}
</style>
