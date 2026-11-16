<template>
  <!-- lista odeljaka: na desktopu lepljiva kolona levo, usko vodoravna traka sa čipovima -->
  <nav ref="nav_ref" class="policy-nav" :aria-label="$t('policy.nav.label')">
    <ul class="policy-nav__list">
      <li v-for="section in sections" :key="section.key">
        <a
          :href="`#policy-${section.key}`"
          :class="['policy-nav__item', { 'is-active': section.key === active }]"
          :style="{ '--section-accent': resolveColor(section.accent) }"
          :aria-current="section.key === active ? 'location' : undefined"
          :data-key="section.key"
          @click.prevent="$emit('select', section.key)"
        >
          <span class="policy-nav__icon" aria-hidden="true">
            <VIcon :name="section.icon" :size="16" />
          </span>
          <span class="policy-nav__label">{{ $t(section.title) }}</span>

          <span
            v-if="errors[section.key]"
            class="policy-nav__badge is-error"
            :title="$t('policy.nav.errors', { count: errors[section.key] })"
          >
            <VIcon name="error" :size="14" />
            <span class="policy-nav__sr">
              {{ $t("policy.nav.errors", { count: errors[section.key] }) }}
            </span>
          </span>
          <span
            v-else-if="changes[section.key]"
            class="policy-nav__badge"
            :title="$t('policy.nav.changes', { count: changes[section.key] })"
          >
            {{ changes[section.key] }}
            <span class="policy-nav__sr">
              {{ $t("policy.nav.changes", { count: changes[section.key] }) }}
            </span>
          </span>
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import VIcon from "@/components/VIcon.vue";
import { resolveColor } from "@/utils/color";

const props = defineProps({
  sections: { type: Array, required: true },
  // ključ odeljka koji se trenutno vidi
  active: { type: String, default: "" },
  // { [ključ odeljka]: broj }
  changes: { type: Object, default: () => ({}) },
  errors: { type: Object, default: () => ({}) }
});

defineEmits(["select"]);

const nav_ref = ref(null);

// u vodoravnoj traci aktivni čip uvijek ostaje vidljiv (samo bočno, stranica se ne pomera)
watch(
  () => props.active,
  async (key) => {
    await nextTick();
    const nav = nav_ref.value;
    const item = nav?.querySelector(`[data-key="${key}"]`);

    if (!nav || !item || nav.scrollWidth <= nav.clientWidth) return;

    const left = item.offsetLeft - (nav.clientWidth - item.offsetWidth) / 2;

    nav.scrollTo({ left: Math.max(left, 0), behavior: "smooth" });
  }
);
</script>

<style scoped lang="scss">
.policy-nav {
  // sticky računa od paddinga sadržaja (16px), pa je top 0 već sa razmakom
  position: sticky;
  top: 0;
  align-self: start;
  padding: $space-8;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;
  box-shadow: $shadow-small;

  &__list {
    @include flex(flex-start, stretch, $space-2, column);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    @include flex(flex-start, center, $space-10);
    position: relative;
    padding: $space-8 $space-10;
    font-size: $text-13;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-body;
    text-decoration: none;
    border-radius: $radius-md;
    transition: $transition;

    &:hover {
      color: $fg-heading;
      background: $surface-default-hover;
    }

    &:focus-visible {
      outline: 2px solid $border-action-focused;
      outline-offset: -2px;
    }

    &.is-active {
      color: $fg-heading;
      background: color-mix(in srgb, var(--section-accent) 10%, transparent);

      // traka u boji odeljka
      &::before {
        content: "";
        position: absolute;
        top: $space-8;
        bottom: $space-8;
        left: 0;
        width: 3px;
        background: var(--section-accent);
        border-radius: $radius-pill;
      }
    }
  }

  &__icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    color: var(--section-accent);
    background: color-mix(in srgb, var(--section-accent) 15%, transparent);
    border-radius: 50%;
  }

  &__label {
    flex: 1;
    min-width: 0;
  }

  &__badge {
    @include flex(center, center);
    flex-shrink: 0;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 $space-6;
    font-size: $text-11;
    font-weight: $weight-bold;
    color: $fg-on-action;
    background: $primary-500;
    border-radius: $radius-pill;

    &.is-error {
      padding: 0;
      color: $fg-error;
      background: transparent;
    }
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  // usko: vodoravna traka sa čipovima koja skroluje bočno
  @include respond-to("tablet") {
    // traka se lepi tik uz vrh, preko paddinga sadržaja
    top: -$space-16;
    z-index: 2;
    margin: 0 (-$space-16);
    padding: $space-8 $space-16;
    overflow-x: auto;
    background: alpha($surface-background, 0.92);
    border: none;
    border-bottom: 1px solid $border-default;
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: blur(8px);
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    &__list {
      flex-direction: row;
      gap: $space-8;
      width: max-content;
    }

    &__item {
      gap: $space-6;
      padding: $space-4 $space-12 $space-4 $space-4;
      white-space: nowrap;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-pill;

      &.is-active {
        border-color: color-mix(in srgb, var(--section-accent) 55%, transparent);

        &::before {
          display: none;
        }
      }
    }

    &__icon {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  @include respond-to("mobile") {
    top: -$space-12;
    margin: 0 (-$space-12);
    padding: $space-8 $space-12;
  }
}
</style>
