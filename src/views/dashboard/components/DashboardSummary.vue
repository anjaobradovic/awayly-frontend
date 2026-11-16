<template>
  <!-- pregled na vrhu timskog i kompanijskog panela: naslov, avatari i brojevi -->
  <section class="dashboard-summary">
    <div class="dashboard-summary__intro">
      <span class="dashboard-summary__icon" aria-hidden="true">
        <VIcon :name="icon" :size="26" />
      </span>

      <div class="dashboard-summary__heading">
        <p class="dashboard-summary__eyebrow">{{ eyebrow }}</p>
        <h2 class="dashboard-summary__title">{{ script(title) }}</h2>

        <!-- prvih nekoliko ljudi, ostatak kao +N -->
        <ul v-if="people.length" class="dashboard-summary__avatars" :aria-label="peopleLabel">
          <li
            v-for="(person, index) in people.slice(0, MAX_AVATARS)"
            :key="person.id ?? index"
            class="dashboard-summary__avatar"
            :title="script(person.name)"
            :style="{ '--avatar-hue': hue(person.name) }"
          >
            {{ initials(person.name) }}
          </li>
          <li v-if="people.length > MAX_AVATARS" class="dashboard-summary__avatar is-more">
            +{{ people.length - MAX_AVATARS }}
          </li>
        </ul>
      </div>
    </div>

    <dl class="dashboard-summary__stats">
      <component
        :is="stat.to ? 'router-link' : 'div'"
        v-for="stat in stats"
        :key="stat.key"
        :to="stat.to"
        :class="['dashboard-summary__stat', `is-${stat.tone ?? 'default'}`]"
      >
        <dt>
          <VIcon :name="stat.icon" :size="16" />
          {{ stat.label }}
        </dt>
        <dd>
          {{ stat.value }}
          <small v-if="stat.suffix">{{ stat.suffix }}</small>
        </dd>
        <span v-if="stat.percent !== undefined" class="dashboard-summary__meter" aria-hidden="true">
          <span :style="{ width: `${Math.min(100, stat.percent)}%` }" />
        </span>
      </component>
    </dl>
  </section>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";
import { script } from "@/i18n";

defineProps({
  icon: { type: String, default: "groups" },
  eyebrow: { type: String, default: "" },
  title: { type: String, default: "" },
  // [{ id, name }]
  people: { type: Array, default: () => [] },
  peopleLabel: { type: String, default: "" },
  // [{ key, icon, label, value, suffix?, percent?, tone?: default|warning|success, to? }]
  stats: { type: Array, default: () => [] }
});

const MAX_AVATARS = 6;

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

// ista osoba uvijek dobije istu nijansu
const hue = (name = "") => [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
</script>

<style scoped lang="scss">
.dashboard-summary {
  @include flex(space-between, center, $space-24);
  padding: $space-20 $space-24;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;
  box-shadow: $shadow-small;

  &__intro {
    @include flex(flex-start, center, $space-16);
    min-width: 0;
  }

  &__icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 3.5rem;
    height: 3.5rem;
    color: $white;
    background: linear-gradient(140deg, $primary-400, $primary-600);
    border-radius: $radius-lg;
    box-shadow: 0 10px 20px -12px $primary-500;
  }

  &__heading {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
  }

  &__eyebrow {
    font-size: $text-11;
    font-weight: $weight-bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: $fg-action;
  }

  &__title {
    @include truncate;
    max-width: 100%;
    font-size: $text-22;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: $fg-heading;
  }

  &__avatars {
    display: flex;
    margin: $space-4 0 0;
    padding: 0 0 0 $space-6;
    list-style: none;
  }

  &__avatar {
    @include flex(center, center);
    width: 1.875rem;
    height: 1.875rem;
    margin-left: -$space-6;
    font-size: $text-10;
    font-weight: $weight-bold;
    color: hsl(var(--avatar-hue) 55% 35%);
    background: hsl(var(--avatar-hue) 70% 88%);
    border: 2px solid $surface-default;
    border-radius: 50%;

    &.is-more {
      color: $fg-body;
      background: $cold-75;
    }
  }

  &__stats {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(8.5rem, 1fr);
    gap: $space-12;
    margin: 0;
  }

  &__stat {
    @include flex(space-between, flex-start, $space-8, column);
    min-height: 6.5rem;
    padding: $space-14 $space-16;
    color: inherit;
    text-decoration: none;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
    transition: $transition;

    dt {
      @include flex(flex-start, center, $space-6);
      font-size: $text-12;
      font-weight: $weight-semibold;
      color: $fg-body;
    }

    dd {
      margin: 0;
      font-size: $text-30;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.02em;
      color: $fg-heading;

      small {
        margin-left: $space-2;
        font-size: $text-14;
        font-weight: $weight-semibold;
        color: $fg-body;
      }
    }

    &.is-warning dt {
      color: $fg-warning;
    }

    &.is-success dt {
      color: $fg-success;
    }

    &:is(a):hover {
      border-color: $primary-500;
      background: $alpha-primary-5;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
  }

  &__meter {
    width: 100%;
    height: 4px;
    overflow: hidden;
    background: $cold-100;
    border-radius: $radius-pill;

    span {
      display: block;
      height: 100%;
      background: $primary-500;
      border-radius: inherit;
    }
  }

  // dark tema: avatari tamniji
  :root[data-theme="dark"] &__avatar:not(.is-more) {
    color: hsl(var(--avatar-hue) 70% 85%);
    background: hsl(var(--avatar-hue) 35% 28%);
  }

  @include respond-to("laptop-sm") {
    flex-direction: column;
    align-items: stretch;
  }

  @include respond-to("tablet-sm") {
    padding: $space-16;

    &__stats {
      grid-auto-flow: row;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
}
</style>
