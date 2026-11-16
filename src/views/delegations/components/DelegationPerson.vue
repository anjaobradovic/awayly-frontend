<template>
  <!-- avatar sa inicijalima, ime i uloga u delegaciji -->
  <span :class="['delegation-person', `delegation-person--${size}`, { 'is-end': align === 'end' }]">
    <span
      class="delegation-person__avatar"
      :style="{ '--avatar-hue': hue(name) }"
      aria-hidden="true"
    >
      {{ initials(name) }}
    </span>
    <span class="delegation-person__text">
      <span class="delegation-person__role">
        {{ role }}
        <span v-if="isMe" class="delegation-person__me">{{ $t("delegations.card.you") }}</span>
      </span>
      <span class="delegation-person__name" :title="script(name)">{{ script(name) }}</span>
    </span>
  </span>
</template>

<script setup>
import { script } from "@/i18n";
import { hue, initials } from "../delegation-dates";

defineProps({
  name: { type: String, required: true },
  role: { type: String, default: "" },
  isMe: { type: Boolean, default: false },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["medium", "large"].includes(value)
  },
  align: { type: String, default: "start" }
});
</script>

<style scoped lang="scss">
.delegation-person {
  @include flex(flex-start, center, $space-10);
  min-width: 0;

  &.is-end {
    flex-direction: row-reverse;
    text-align: right;

    .delegation-person__text {
      align-items: flex-end;
    }
  }

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    font-size: $text-12;
    font-weight: $weight-bold;
    letter-spacing: 0.02em;
    color: hsl(var(--avatar-hue) 55% 32%);
    background: hsl(var(--avatar-hue) 70% 89%);
    border-radius: 50%;
    box-shadow: 0 0 0 2px $surface-default;
  }

  &__text {
    @include flex(center, flex-start, $space-2, column);
    min-width: 0;
  }

  &__role {
    @include flex(flex-start, center, $space-4);
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xxs;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $fg-muted;
  }

  &__me {
    padding: 0 $space-6;
    font-size: $text-10;
    letter-spacing: 0.02em;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__name {
    @include truncate;
    max-width: 100%;
    font-size: $text-14;
    font-weight: $weight-bold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &--large {
    gap: $space-12;

    .delegation-person__avatar {
      width: 3.25rem;
      height: 3.25rem;
      font-size: $text-16;
      box-shadow: 0 0 0 3px $surface-default;
    }

    .delegation-person__name {
      font-size: $text-16;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
  }

  // dark tema: tamniji avatari
  :root[data-theme="dark"] &__avatar {
    color: hsl(var(--avatar-hue) 70% 85%);
    background: hsl(var(--avatar-hue) 35% 28%);
  }
}
</style>
