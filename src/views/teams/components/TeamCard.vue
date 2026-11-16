<template>
  <button
    type="button"
    :class="['team-card', { 'is-active': active }]"
    :aria-pressed="active"
    @click="emit('select', team.id)"
  >
    <!-- ime i vođa tima su grupa, broj članova ispod -->
    <span class="team-card__info">
      <span class="team-card__name">{{ team.name }}</span>

      <span v-if="team.lead_name" class="team-card__lead">
        <VIcon
          name="admin_panel_settings"
          :size="16"
          filled
          :color="active ? 'icon-action' : 'icon-default'"
        />
        {{ team.lead_name }}
      </span>
    </span>

    <span class="team-card__count">
      {{ $t("common.employees_count", { count: team.member_count }) }}
    </span>
  </button>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";

defineProps({
  team: { type: Object, required: true },
  active: { type: Boolean, default: false }
});

const emit = defineEmits(["select"]);
</script>

<style scoped lang="scss">
@layer components {
  .team-card {
    @include flex(flex-start, flex-start, $space-12, column);
    width: 100%;
    padding: $space-12;
    font-family: $font-family;
    text-align: left;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    cursor: pointer;
    transition: $transition;

    &:hover {
      background: $surface-default-hover;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }

    // izabrani tim ima crvenu ivicu lijevo, veći padding i senku
    &.is-active {
      gap: $space-16;
      padding: $space-16 $space-16 $space-12;
      background: $surface-default;
      border-color: transparent;
      border-left: 4px solid $border-action;
      box-shadow:
        0 8px 14px 2px rgba($black, 0.08),
        0 1px 4px 0 rgba($black, 0.2);
    }

    &__info {
      @include flex(flex-start, flex-start, $space-8, column);
    }

    &.is-active &__info {
      gap: $space-12;
    }

    &__name {
      font-size: $text-16;
      font-weight: $weight-semibold;
      line-height: $leading-sm;
      color: $fg-heading;
    }

    &__lead {
      @include flex(flex-start, center, $space-4);
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-heading;
    }

    // na izabranom timu ime vođe je podebljano
    &.is-active &__lead {
      font-weight: $weight-semibold;
      line-height: $leading-xs;
    }

    &__count {
      padding: $space-4;
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-heading;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-lg;
    }
  }
}
</style>
