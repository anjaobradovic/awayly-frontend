<template>
  <div class="v-auth-card">
    <div class="v-auth-card__panel">
      <div class="v-auth-card__brand">
        <VLogo class="v-auth-card__logo" :size="44" inverse />

        <div class="v-auth-card__pitch">
          <p class="v-auth-card__tagline">{{ $t("auth.brand.tagline") }}</p>
          <p class="v-auth-card__subline">{{ $t("auth.brand.subline") }}</p>
        </div>

        <!-- ukrasni "kalendar" od kvadratića -->
        <div class="v-auth-card__grid" aria-hidden="true">
          <span
            v-for="cell in 28"
            :key="cell"
            :class="['v-auth-card__cell', { 'is-marked': [4, 5, 6, 12, 19, 20].includes(cell) }]"
          />
        </div>
      </div>

      <div class="v-auth-card__content">
        <header v-if="title || description" class="v-auth-card__header">
          <h1 v-if="title" class="v-auth-card__title">{{ title }}</h1>
          <p
            v-if="description"
            :class="['v-auth-card__description', `v-auth-card__description--${descriptionSize}`]"
          >
            {{ description }}
          </p>
        </header>

        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import VLogo from "@/components/VLogo.vue";

defineProps({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  descriptionSize: {
    type: String,
    default: "medium",
    validator: (v) => ["medium", "small"].includes(v)
  }
});
</script>

<style lang="scss" scoped>
$card-max-width: 67.5rem;
$card-min-height: 40rem;

@layer components {
  .v-auth-card {
    @include flex(center, center);
    min-height: 100vh;
    min-height: 100dvh;
    padding: $space-24;
    background:
      radial-gradient(60% 50% at 15% 10%, alpha($primary-500, 0.14) 0%, transparent 70%),
      radial-gradient(50% 50% at 90% 90%, alpha($primary-350, 0.12) 0%, transparent 70%),
      $surface-background;

    &__panel {
      display: grid;
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
      width: 100%;
      max-width: $card-max-width;
      min-height: $card-min-height;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-xl;
      box-shadow: $shadow-card;
      overflow: hidden;
    }

    // lijeva strana, logo i poruka na podlozi u boji akcenta
    &__brand {
      @include flex(space-between, flex-start, $space-32, column);
      position: relative;
      padding: $space-48;
      overflow: hidden;
      color: $white;
      background:
        radial-gradient(80% 60% at 100% 0%, alpha($white, 0.18) 0%, transparent 60%),
        linear-gradient(155deg, $primary-500 0%, $primary-700 100%);
    }

    &__logo {
      position: relative;
    }

    &__pitch {
      @include flex(flex-start, flex-start, $space-12, column);
      position: relative;
      max-width: 22rem;
    }

    &__tagline {
      font-size: $text-30;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
    }

    &__subline {
      font-size: $text-14;
      line-height: $leading-sm;
      color: alpha($white, 0.78);
    }

    &__grid {
      display: grid;
      grid-template-columns: repeat(7, 1.75rem);
      gap: $space-6;
      opacity: 0.9;
    }

    &__cell {
      aspect-ratio: 1;
      background: alpha($white, 0.12);
      border-radius: $radius-sm;

      &.is-marked {
        background: alpha($white, 0.75);
      }
    }

    // desna strana, sadržaj ekrana
    &__content {
      @include flex(center, stretch, $space-36, column);
      padding: $space-36 $space-64;
      border-left: 1px solid $border-default;
    }

    &__header {
      @include flex(center, center, $space-16, column);
      padding: $space-12 $space-12 $space-8;
      text-align: center;
    }

    &__title {
      font-size: $text-32;
      font-weight: $weight-semibold;
      line-height: $leading-xl;
      color: $fg-heading;
      white-space: nowrap;
    }

    &__description {
      color: $fg-body;
      line-height: $leading-sm;

      &--medium {
        font-size: $text-16;
      }
      &--small {
        font-size: $text-14;
      }
    }

    // manji ekrani, logo iznad sadržaja
    @include respond-to("tablet") {
      &__panel {
        grid-template-columns: minmax(0, 1fr);
        max-width: 34rem;
        min-height: 0;
      }

      &__brand {
        padding: $space-24;
      }

      &__pitch,
      &__grid {
        display: none;
      }

      &__content {
        border-left: none;
        border-top: 1px solid $border-default;
        padding: $space-32 $space-24;
      }
    }

    @include respond-to("mobile") {
      padding: $space-16;

      &__content {
        padding: $space-24 $space-16;
      }

      &__title {
        font-size: $text-24;
        line-height: $leading-lg;
        white-space: normal;
      }
    }
  }
}
</style>
