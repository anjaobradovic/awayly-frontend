<template>
  <div class="v-menu" role="menu">
    <slot />
  </div>
</template>

<style scoped lang="scss">
@layer components {
  .v-menu {
    @include flex(flex-start, stretch, 0, column);
    min-width: 10rem;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    box-shadow: $shadow-menu;
    overflow: hidden;
  }
}
</style>
