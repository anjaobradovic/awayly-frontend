<template>
  <!-- logo kompanije; viewBox odsijeca prazan prostor oko slike -->
  <svg
    v-if="src"
    class="v-company-logo"
    :viewBox="viewBox"
    preserveAspectRatio="xMinYMid meet"
    :style="{ height: `${height}px` }"
    role="img"
    :aria-label="name"
  >
    <title>{{ name }}</title>
    <image :href="src" :width="width" :height="imageHeight" />
  </svg>
  <span v-else class="v-company-logo__name">{{ name }}</span>
</template>

<script setup>
defineProps({
  src: { type: String, default: "" },
  name: { type: String, default: "" },
  height: { type: Number, default: 28 },
  // dio slike koji se prikazuje: "x y širina visina"
  viewBox: { type: String, default: "0 0 100 100" },
  width: { type: Number, default: 100 },
  imageHeight: { type: Number, default: 100 }
});
</script>

<style scoped lang="scss">
@layer components {
  .v-company-logo {
    display: block;
    width: auto;
    max-width: 100%;

    &__name {
      font-size: $text-20;
      font-weight: $weight-semibold;
      color: $fg-action;
    }
  }

  // tamni logo na tamnoj podlozi: crno postaje bijelo, plava ostaje plava
  :root[data-theme="dark"] .v-company-logo {
    filter: invert(1) hue-rotate(180deg);
  }
}
</style>
