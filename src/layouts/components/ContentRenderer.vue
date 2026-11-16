<template>
  <main class="content-renderer">
    <!-- promjena jezika ponovo crta stranicu, pa i podatke prevedene pri učitavanju -->
    <router-view :key="locale_store.language" />
  </main>
</template>

<script setup>
import { useLocaleStore } from "@/stores/locale";

const locale_store = useLocaleStore();
</script>

<style lang="scss" scoped>
.content-renderer {
  min-height: 0;
}
</style>
