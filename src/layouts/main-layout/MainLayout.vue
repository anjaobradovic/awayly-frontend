<template>
  <div class="main-layout">
    <VSidebar class="main-layout__sidebar" @action="runAction" />

    <navbar class="main-layout__navbar" />

    <content-renderer class="main-layout__content" />

    <AdSettingsDrawer v-model:open="is_ad_settings_open" />
    <CompanyProfileDrawer v-model:open="is_company_profile_open" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import VSidebar from "@/components/VSidebar.vue";
import Navbar from "./components/Navbar.vue";
import ContentRenderer from "../components/ContentRenderer.vue";
import AdSettingsDrawer from "./components/AdSettingsDrawer.vue";
import CompanyProfileDrawer from "./components/CompanyProfileDrawer.vue";

// Podešavanja > Integracije otvara panel preko bilo koje stranice
const is_ad_settings_open = ref(false);
const is_company_profile_open = ref(false);

function runAction(action) {
  if (action === "integrations") is_ad_settings_open.value = true;
  if (action === "company-profile") is_company_profile_open.value = true;
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: grid;
  // sidebar drži punu visinu lijevo, navbar i sadržaj idu u desnu kolonu
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    "sidebar navbar"
    "sidebar content";
  // visina ekrana, skroluje samo sadržaj
  height: 100vh;
  height: 100dvh;

  &__sidebar {
    grid-area: sidebar;
    width: 6rem; // da stanu Organizacija i Podešavanja
    // sidebar ima isolation, pa ga dižemo iznad sadržaja zbog menija
    z-index: $z-dropdown;
  }

  &__navbar {
    grid-area: navbar;
  }

  &__content {
    grid-area: content;
    overflow-x: hidden;
    // stranice duže od ekrana skroluju unutar ove oblasti, navbar i sidebar ostaju
    overflow-y: auto;
  }
}
</style>
