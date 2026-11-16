<template>
  <!-- jedan tip odsustva: ikonica u boji grupe, naziv, vrsta i pravila tipa -->
  <article
    :class="['absence-type-card', { 'is-system': type.is_system }]"
    :style="{ '--type-accent': accent }"
  >
    <header class="absence-type-card__top">
      <span class="absence-type-card__tile" aria-hidden="true">
        <VIcon :name="iconOf(type.api_name ?? type.name)" :size="26" />
      </span>

      <div class="absence-type-card__heading">
        <!-- klik na naziv otvara detalje, cijela kartica je klikabilna mišem -->
        <button
          type="button"
          class="absence-type-card__name"
          :title="type.name"
          :aria-label="$t('absence_types.card.open_details', { name: type.name })"
          @click="$emit('details', type)"
        >
          {{ type.name }}
        </button>

        <span :class="['absence-type-card__kind', { 'is-system': type.is_system }]">
          <VIcon :name="type.is_system ? 'lock' : 'tune'" :size="12" />
          {{ $t(type.is_system ? "absence_types.system" : "absence_types.custom") }}
        </span>
      </div>

      <!-- sistemski tipovi se ne mijenjaju ni ne brišu, samo Detalji -->
      <VDropdown
        class="absence-type-card__menu"
        :label="$t('absence_types.actions_for', { name: type.name })"
      >
        <VMenu>
          <VMenuItem :label="$t('common.actions.details')" @click="$emit('details', type)" />
          <template v-if="!type.is_system">
            <VMenuItem :label="$t('common.actions.edit')" @click="$emit('edit', type)" />
            <VMenuItem
              :label="$t('common.actions.delete')"
              danger
              @click="$emit('delete', type)"
            />
          </template>
        </VMenu>
      </VDropdown>
    </header>

    <!-- najava i uticaj na balans su najvažniji, idu krupnije -->
    <div class="absence-type-card__highlights">
      <div class="absence-type-card__highlight">
        <span class="absence-type-card__highlight-label">
          <VIcon name="schedule" :size="14" />
          {{ $t("absence_types.card.notice") }}
        </span>
        <strong>
          {{
            type.notice_days
              ? $t("common.days", { count: type.notice_days })
              : $t("absence_types.card.no_notice")
          }}
        </strong>
      </div>

      <div :class="['absence-type-card__highlight', { 'is-on': type.reduces_balance }]">
        <span class="absence-type-card__highlight-label">
          <VIcon name="account_balance_wallet" :size="14" />
          {{ $t("absence_types.card.balance") }}
        </span>
        <strong>
          {{
            $t(
              type.reduces_balance ? "absence_types.card.balance_yes" : "absence_types.card.balance_no"
            )
          }}
        </strong>
      </div>
    </div>

    <ul class="absence-type-card__specs">
      <li
        v-for="spec in specs"
        :key="spec.key"
        :class="['absence-type-card__spec', { 'is-on': spec.on }]"
      >
        <span class="absence-type-card__spec-label">
          <VIcon :name="spec.icon" :size="16" />
          {{ spec.label }}
        </span>
        <span class="absence-type-card__spec-value">
          <VIcon :name="spec.on ? 'check_circle' : 'remove_circle_outline'" :size="14" />
          {{ spec.value }}
        </span>
      </li>
    </ul>

    <footer v-if="type.is_system" class="absence-type-card__footer">
      <VIcon name="info" :size="14" />
      <span>{{ $t("absence_types.card.locked") }}</span>
    </footer>
  </article>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import { iconOf } from "@/views/requests/request-config";
import { resolveColor } from "@/utils/color";
import { t } from "@/i18n";

const props = defineProps({
  // red iz absence-types store-a (rows)
  type: { type: Object, required: true },
  // boja grupe, npr. absence-vacation
  accent: { type: String, default: "" }
});

defineEmits(["details", "edit", "delete"]);

const accent = computed(() => resolveColor(props.accent) ?? "var(--c-primary-500)");

const yesNo = (group, value) => t(`absence_types.${group}.${value ? "yes" : "no"}`);

// ostala pravila tipa, isti tekstovi kao u panelu za dodavanje
const specs = computed(() => [
  {
    key: "approval",
    icon: "how_to_reg",
    label: t("absence_types.card.approval"),
    value: yesNo("approval", props.type.requires_approval),
    on: props.type.requires_approval
  },
  {
    key: "reason",
    icon: "notes",
    label: t("absence_types.card.reason"),
    value: yesNo("reason", props.type.requires_reason),
    on: props.type.requires_reason
  },
  {
    key: "past_dates",
    icon: "history",
    label: t("absence_types.card.past_dates"),
    value: yesNo("past_dates", props.type.allow_past_dates),
    on: props.type.allow_past_dates
  }
]);
</script>

<style scoped lang="scss">
.absence-type-card {
  @include flex(flex-start, stretch, $space-14, column);
  position: relative;
  min-width: 0;
  padding: $space-16;
  overflow: hidden;
  background:
    radial-gradient(
      120% 80% at 100% 0%,
      color-mix(in srgb, var(--type-accent) 9%, transparent) 0%,
      transparent 55%
    ),
    $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;
  box-shadow: $shadow-small;
  transition: $transition;

  &:hover {
    border-color: color-mix(in srgb, var(--type-accent) 35%, transparent);
    box-shadow: 0 12px 28px -18px var(--type-accent);
  }

  &:focus-within {
    border-color: color-mix(in srgb, var(--type-accent) 50%, transparent);
  }

  &__top {
    @include flex(flex-start, flex-start, $space-12);
  }

  // velika ikonica u boji grupe
  &__tile {
    @include flex(center, center);
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    color: var(--type-accent);
    background: color-mix(in srgb, var(--type-accent) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--type-accent) 22%, transparent);
    border-radius: $radius-lg;
  }

  &__heading {
    @include flex(flex-start, flex-start, $space-6, column);
    flex: 1;
    min-width: 0;
    padding-top: $space-2;
  }

  &__name {
    @include truncate;
    max-width: 100%;
    padding: 0;
    font-family: inherit;
    font-size: $text-16;
    font-weight: $weight-bold;
    line-height: $leading-sm;
    letter-spacing: -0.01em;
    text-align: left;
    color: $fg-heading;
    background: none;
    border: none;
    cursor: pointer;

    // cijela kartica reaguje na klik
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      border-radius: inherit;
    }

    &:focus-visible {
      outline: none;

      &::after {
        outline: 2px solid var(--type-accent);
        outline-offset: -2px;
      }
    }
  }

  &__kind {
    @include flex(flex-start, center, $space-4);
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
    background: $surface-sunken;
    border: 1px solid $border-default;
    border-radius: $radius-pill;

    &.is-system {
      color: $fg-action;
      background: $alpha-primary-10;
      border-color: transparent;
    }
  }

  // meni iznad sloja za klik
  &__menu {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    margin: -$space-4 (-$space-6) 0 0;
  }

  &__highlights {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-8;
  }

  &__highlight {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
    padding: $space-10 $space-12;
    background: $surface-sunken;
    border-radius: $radius-md;

    strong {
      @include truncate;
      max-width: 100%;
      font-size: $text-14;
      font-weight: $weight-bold;
      color: $fg-heading;
    }

    &.is-on strong {
      color: var(--type-accent);
    }
  }

  &__highlight-label {
    @include flex(flex-start, center, $space-4);
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $fg-muted;
  }

  &__specs {
    @include flex(flex-start, stretch, $space-8, column);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__spec {
    @include flex(space-between, center, $space-8);
    min-width: 0;
    font-size: $text-12;
    line-height: $leading-xs;
  }

  &__spec-label {
    @include flex(flex-start, center, $space-6);
    min-width: 0;
    color: $fg-body;

    :deep(.v-icon),
    i {
      color: $fg-muted;
    }
  }

  &__spec-value {
    @include flex(flex-start, center, $space-4);
    flex-shrink: 0;
    font-weight: $weight-semibold;
    color: $fg-muted;
  }

  &__spec.is-on &__spec-value {
    color: $fg-heading;

    > :first-child {
      color: $fg-success;
    }
  }

  &__footer {
    @include flex(flex-start, center, $space-6);
    text-align: left;
    margin-top: auto;
    padding-top: $space-10;
    font-size: $text-11;
    line-height: $leading-xs;
    color: $fg-muted;
    border-top: 1px dashed $border-default;
  }
}
</style>
