<template>
  <article :class="['chain-card', { 'is-inactive': !chain.is_active, 'is-readonly': readonly }]">
    <header class="chain-card__header">
      <button
        v-if="!readonly"
        type="button"
        class="chain-card__name chain-card__name--button"
        @click="emit('edit', chain)"
      >
        {{ chain.name }}
      </button>
      <h3 v-else class="chain-card__name">{{ chain.name }}</h3>

      <div class="chain-card__controls">
        <VSwitch
          :model-value="chain.is_active"
          :label="$t('approval_chains.card.active')"
          :disabled="readonly || busy"
          @update:model-value="emit('toggle', chain, $event)"
        />
        <VDropdown
          v-if="!readonly"
          :label="$t('approval_chains.card.actions', { name: chain.name })"
        >
          <VMenu>
            <VMenuItem :label="$t('common.actions.edit')" @click="emit('edit', chain)" />
            <VMenuItem :label="$t('common.actions.delete')" danger @click="emit('delete', chain)" />
          </VMenu>
        </VDropdown>
      </div>
    </header>

    <div class="chain-card__section">
      <span class="chain-card__label">{{ $t("approval_chains.card.applies_to") }}</span>
      <div class="chain-card__scope">
        <VChip v-if="chain.applies_to_all" tone="action" icon="groups">
          {{ $t("approval_chains.card.all_employees") }}
        </VChip>
        <template v-else>
          <VChip v-for="team in chain.teams" :key="team.id">{{ script(team.name) }}</VChip>
        </template>
      </div>
    </div>

    <div class="chain-card__section">
      <span class="chain-card__label">{{ $t("approval_chains.card.steps") }}</span>
      <ol class="chain-card__steps">
        <li v-for="(step, index) in chain.steps" :key="index" class="chain-card__step">
          <VStepNumber :number="index + 1" size="small" />
          <span class="chain-card__step-text">
            <strong>{{ stepLabel(step) }}</strong>
            <span>
              <VIcon :name="APPROVER_ICONS[step.approver_type]" :size="14" />
              {{
                step.approver_type === "TEAM_LEAD"
                  ? $t("approval_chains.card.team_lead_short")
                  : $t(`approval_chains.approver.${step.approver_type}`)
              }}
            </span>
          </span>
          <VIcon
            v-if="index < chain.steps.length - 1"
            class="chain-card__arrow"
            name="arrow_forward"
            :size="16"
          />
        </li>
      </ol>
    </div>

    <footer v-if="chain.updated_at" class="chain-card__footer">
      {{ $t("approval_chains.card.updated", { date: formatDate(chain.updated_at) }) }}
    </footer>
  </article>
</template>

<script setup>
import VChip from "@/components/VChip.vue";
import VDropdown from "@/components/VDropdown.vue";
import VIcon from "@/components/VIcon.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import VStepNumber from "@/components/VStepNumber.vue";
import VSwitch from "@/components/VSwitch.vue";
import { intlLocale, script } from "@/i18n";
import { APPROVER_ICONS, stepLabel } from "../approval-chain-config";

defineProps({
  // lanac iz approval-chains store-a
  chain: { type: Object, required: true },
  // dok su prilagođeni lanci isključeni, kartica se samo gleda
  readonly: { type: Boolean, default: false },
  busy: { type: Boolean, default: false }
});

const emit = defineEmits(["edit", "delete", "toggle"]);

const formatDate = (value) =>
  new Date(value).toLocaleDateString(intlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
</script>

<style scoped lang="scss">
.chain-card {
  @include flex(flex-start, stretch, $space-16, column);
  padding: $space-16;
  background: $surface-default;
  border: 1px solid $border-default;
  border-left: 4px solid $border-action;
  border-radius: $radius-xs;
  box-shadow: $shadow-small;
  transition: $transition;

  &.is-inactive {
    border-left-color: $border-default;
  }

  &.is-readonly {
    opacity: 0.7;
  }

  &__header {
    @include flex(space-between, flex-start, $space-12);
  }

  &__name {
    min-width: 0;
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
    overflow-wrap: anywhere;

    &--button {
      padding: 0;
      font-family: $font-family;
      text-align: left;
      background: none;
      border: 0;
      cursor: pointer;

      &:hover {
        color: $fg-action;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }
  }

  &__controls {
    @include flex(flex-end, center, $space-8);
    flex-shrink: 0;
  }

  &__section {
    @include flex(flex-start, stretch, $space-8, column);
  }

  &__label {
    font-size: $text-12;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__scope {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
  }

  &__steps {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
  }

  &__step {
    @include flex(flex-start, center, $space-8);
  }

  &__step-text {
    @include flex(flex-start, flex-start, 0, column);
    min-width: 0;

    strong {
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    span {
      @include flex(flex-start, center, $space-2);
      font-size: $text-11;
      line-height: $leading-xs;
      color: $fg-body;
    }
  }

  &__arrow {
    color: $fg-muted;
  }

  &__footer {
    padding-top: $space-12;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    border-top: 1px solid $border-default;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chain-card {
    transition: none;
  }
}
</style>
