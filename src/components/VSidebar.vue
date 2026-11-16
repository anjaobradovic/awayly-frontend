<template>
  <aside ref="sidebar_ref" class="sidebar" @keydown.esc="closeMenu">
    <router-link to="/home" class="sidebar__logo" :aria-label="$t('nav.home')">
      <VLogo mark-only :size="40" />
    </router-link>

    <nav class="sidebar__nav" :aria-label="$t('nav.main')">
      <template v-for="group in NAVIGATION" :key="group.label">
        <VSidebarItem
          v-if="!group.children"
          :icon="group.icon"
          :label="$t(group.label)"
          :active="active_item?.group === group"
          @click="openPage(group.to)"
        />

        <VSidebarItem
          v-else
          :icon="group.icon"
          :label="$t(group.label)"
          :active="active_item?.group === group"
          :open="open_group === group.label"
          @click="toggleMenu(group.label)"
        >
          <VMenu>
            <VMenuItem
              v-for="child in group.children"
              :key="child.label"
              :label="$t(child.label)"
              :to="child.to"
              :active="active_item?.child === child"
              @click="child.action && runAction(child.action)"
            />
          </VMenu>
        </VSidebarItem>
      </template>
    </nav>

    <p class="sidebar__version">v{{ APP_VERSION }}</p>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import VSidebarItem from "@/components/VSidebarItem.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import { useClickOutside } from "@/composables/useClickOutside";
import { NAVIGATION, findActiveItem } from "@/layouts/main-layout/navigation";
import VLogo from "@/components/VLogo.vue";
import { APP_VERSION } from "@/config";

const emit = defineEmits(["action"]);
const route = useRoute();
const router = useRouter();
const sidebar_ref = ref(null);

const open_group = ref(null);

const active_item = computed(() => findActiveItem(route.path));

function toggleMenu(label) {
  open_group.value = open_group.value === label ? null : label;
}

function openPage(to) {
  closeMenu();
  router.push(to);
}

function runAction(action) {
  closeMenu();
  emit("action", action);
}

function closeMenu() {
  open_group.value = null;
}

useClickOutside(sidebar_ref, closeMenu);
watch(() => route.path, closeMenu);
</script>

<style lang="scss" scoped>
.sidebar {
  position: relative;
  isolation: isolate;
  @include flex(flex-start, center, 0, column);
  height: 100%;
  padding: $space-4 $space-8 0;
  background: $sidebar-background;
  border-right: 1px solid $sidebar-border;

  &__logo {
    @include flex(center, center);
    width: 100%;
    height: 5rem;
    border-bottom: 1px solid $sidebar-border;
    border-radius: $radius-lg;
    transition: $transition;

    &:hover {
      transform: rotate(-4deg);
    }

    &:focus-visible {
      outline: 1px solid $white;
      outline-offset: -2px;
    }
  }
  &__nav {
    @include flex(flex-start, center, $space-12, column);
    width: 100%;
    padding-top: $space-12;
  }

  &__version {
    @include flex(center, center);
    width: 3.75rem;
    height: 5rem;
    margin-top: auto;
    border-top: 1px solid $sidebar-border;
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: alpha($white, 0.45);
    text-align: center;
  }
}
</style>
