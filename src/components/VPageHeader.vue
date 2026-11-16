<template>
  <header class="v-page-header">
    <div class="v-page-header__titles">
      <h1 class="v-page-header__title">{{ title }}</h1>

      <template v-if="description">
        <span class="v-page-header__dot" aria-hidden="true">·</span>
        <p class="v-page-header__description">{{ description }}</p>
      </template>
    </div>

    <!-- desna strana: pretraga, dugmad, šta roditelj ubaci -->
    <div v-if="$slots.actions" class="v-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" }
});
</script>

<style scoped lang="scss">
@layer components {
  .v-page-header {
    @include flex(space-between, center, $space-16);
    flex-wrap: wrap;
    padding: $space-12;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-lg;

    &__titles {
      @include flex(flex-start, center, $space-12);
      flex-wrap: wrap;
      min-width: 0;
    }

    &__title {
      font-size: $text-24;
      font-weight: $weight-semibold;
      line-height: $leading-md;
      color: $fg-heading;
    }

    &__dot {
      font-size: $text-32;
      line-height: $leading-xl;
      color: $fg-heading;
    }

    &__description {
      font-size: $text-16;
      line-height: $leading-sm;
      color: $fg-body;
    }

    &__actions {
      @include flex(flex-end, center, $space-16);
      flex-wrap: wrap;
    }

    // na užem ekranu naslov i akcije idu jedno ispod drugog
    @include respond-to("laptop-sm") {
      align-items: stretch;
      flex-direction: column;

      &__actions {
        justify-content: flex-start;
      }
    }

    // telefon: opis ispod naslova, bez tačke, manji naslov
    @include respond-to("mobile") {
      gap: $space-12;
      padding: $space-10 $space-12;

      &__titles {
        flex-direction: column;
        align-items: flex-start;
        gap: $space-2;
      }

      &__title {
        font-size: $text-20;
      }

      &__dot {
        display: none;
      }

      &__description {
        font-size: $text-13;
      }

      &__actions {
        gap: $space-8;
      }
    }
  }
}
</style>
