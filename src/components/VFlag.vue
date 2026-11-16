<template>
  <span class="v-flag" aria-hidden="true">
    <img class="v-flag__layer" :src="layers.background" alt="" />
    <img
      :class="['v-flag__layer', { 'v-flag__layer--uk': country === 'uk' }]"
      :src="layers.emblem"
      alt=""
    />
  </span>
</template>

<script setup>
import { computed } from "vue";
import rsBackground from "@/assets/images/flags/rs-background.svg";
import rsEmblem from "@/assets/images/flags/rs.svg";
import ukBackground from "@/assets/images/flags/uk-background.svg";
import ukEmblem from "@/assets/images/flags/uk.svg";

const FLAGS = {
  rs: { background: rsBackground, emblem: rsEmblem },
  uk: { background: ukBackground, emblem: ukEmblem }
};

const props = defineProps({
  country: {
    type: String,
    required: true,
    validator: (value) => ["rs", "uk"].includes(value)
  }
});

const layers = computed(() => FLAGS[props.country]);
</script>

<style scoped lang="scss">
@layer components {
  .v-flag {
    position: relative;
    display: inline-block;
    flex-shrink: 0;
    width: 21.333px;
    height: 16px;
    box-sizing: content-box;
    overflow: hidden;
    border: 1px solid $border-default;
    border-radius: $radius-xs;

    &__layer {
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      max-width: none;

      &--uk {
        top: -1.45px;
        left: -2.82px;
      }
    }
  }
}
</style>
