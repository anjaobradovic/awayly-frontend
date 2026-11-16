<template>
  <!-- meni za telefon: panel sa lijeve strane, grupe se otvaraju na klik -->
  <Teleport to="body">
    <Transition name="mobile-nav">
      <div v-if="open" class="mobile-nav" @keydown.esc="close">
        <div class="mobile-nav__backdrop" @click="close" />

        <aside
          ref="panel_ref"
          class="mobile-nav__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="$t('nav.main')"
        >
          <header class="mobile-nav__header">
            <VLogo :size="34" />
            <button
              type="button"
              class="mobile-nav__close"
              :aria-label="$t('common.actions.close')"
              @click="close"
            >
              <VIcon name="close" :size="22" />
            </button>
          </header>

          <nav class="mobile-nav__list">
            <div v-for="group in NAVIGATION" :key="group.label" class="mobile-nav__group">
              <button
                type="button"
                :class="['mobile-nav__item', { 'is-active': active_item?.group === group }]"
                :aria-expanded="group.children ? expanded === group.label : undefined"
                @click="group.children ? toggle(group.label) : go(group.to)"
              >
                <VIcon :name="group.icon" :size="22" />
                <span>{{ $t(group.label) }}</span>
                <VIcon
                  v-if="group.children"
                  class="mobile-nav__chevron"
                  name="expand_more"
                  :size="20"
                />
              </button>

              <ul v-if="group.children && expanded === group.label" class="mobile-nav__children">
                <li v-for="child in group.children" :key="child.label">
                  <button
                    type="button"
                    :class="['mobile-nav__child', { 'is-active': active_item?.child === child }]"
                    @click="child.action ? runAction(child.action) : go(child.to)"
                  >
                    {{ $t(child.label) }}
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          <p class="mobile-nav__version">v{{ APP_VERSION }}</p>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import VIcon from "@/components/VIcon.vue";
import VLogo from "@/components/VLogo.vue";
import { APP_VERSION } from "@/config";
import { NAVIGATION, findActiveItem } from "../navigation";

const open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["action"]);

const route = useRoute();
const router = useRouter();
const panel_ref = ref(null);

const active_item = computed(() => findActiveItem(route.path));

// otvorena je grupa trenutne stranice
const expanded = ref(null);

watch(open, async (value) => {
  if (!value) return;

  expanded.value = active_item.value?.group.label ?? null;
  await nextTick();
  panel_ref.value?.querySelector("button")?.focus();
});

// promjena stranice zatvara meni
watch(() => route.path, () => (open.value = false));

function toggle(label) {
  expanded.value = expanded.value === label ? null : label;
}

function go(to) {
  open.value = false;
  router.push(to);
}

function runAction(action) {
  open.value = false;
  emit("action", action);
}

function close() {
  open.value = false;
}
</script>

<style lang="scss" scoped>
.mobile-nav {
  position: fixed;
  inset: 0;
  z-index: $z-modal;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: alpha($black, 0.4);
    backdrop-filter: blur(2px);
  }

  &__panel {
    position: absolute;
    inset: 0 auto 0 0;
    @include flex(flex-start, stretch, 0, column);
    width: min(19rem, 85vw);
    padding: $space-16 $space-12;
    overflow-y: auto;
    background: $surface-default;
    box-shadow: $shadow-menu;
  }

  &__header {
    @include flex(space-between, center);
    padding: 0 $space-4 $space-16;
    border-bottom: 1px solid $border-default;
  }

  &__close {
    @include flex(center, center);
    width: 2.25rem;
    height: 2.25rem;
    color: $icon-default;
    background: transparent;
    border: none;
    border-radius: $radius-lg;
    cursor: pointer;

    &:hover {
      background: $surface-default-hover;
    }
  }

  &__list {
    @include flex(flex-start, stretch, $space-4, column);
    padding: $space-12 0;
  }

  &__item,
  &__child {
    width: 100%;
    font-family: inherit;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: $radius-lg;
    cursor: pointer;
    transition: $transition;

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: -1px;
    }
  }

  &__item {
    @include flex(flex-start, center, $space-12);
    height: 2.875rem;
    padding: 0 $space-12;
    font-size: $text-14;
    font-weight: $weight-semibold;
    color: $fg-heading;

    :deep(.v-icon) {
      color: $icon-default;
    }

    &:hover {
      background: $alpha-primary-5;
    }

    &.is-active {
      color: $fg-action;
      background: $alpha-primary-10;

      :deep(.v-icon) {
        color: $fg-action;
      }
    }
  }

  &__chevron {
    margin-left: auto;
    transition: transform 0.2s ease;
  }

  &__item[aria-expanded="true"] &__chevron {
    transform: rotate(180deg);
  }

  &__children {
    margin: $space-2 0 $space-8 $space-24;
    padding: 0 0 0 $space-12;
    list-style: none;
    border-left: 1px solid $border-default;
  }

  &__child {
    display: block;
    padding: $space-10 $space-12;
    font-size: $text-14;
    color: $fg-body;

    &:hover {
      color: $fg-heading;
      background: $surface-default-hover;
    }

    &.is-active {
      font-weight: $weight-semibold;
      color: $fg-action;
    }
  }

  &__version {
    margin-top: auto;
    padding: $space-12 $space-12 0;
    font-size: $text-12;
    color: $cold-350;
  }
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition: opacity 0.2s ease;

  .mobile-nav__panel {
    transition: transform 0.25s ease;
  }
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;

  .mobile-nav__panel {
    transform: translateX(-100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-enter-active,
  .mobile-nav-leave-active,
  .mobile-nav-enter-active .mobile-nav__panel,
  .mobile-nav-leave-active .mobile-nav__panel {
    transition: none;
  }
}
</style>
