<template>
  <!-- traka na dnu dok traje izmjena: broj izmjena, datum, poruka i dugmad -->
  <footer class="policy-bar" :aria-label="$t('policy.bar.label')">
    <VNotice v-if="notice" :tone="notice.tone" class="policy-bar__notice">
      {{ notice.text }}
    </VNotice>

    <div class="policy-bar__row">
      <div class="policy-bar__summary">
        <span :class="['policy-bar__count', { 'is-empty': !changes }]">
          <VIcon :name="changes ? 'edit_note' : 'edit'" :size="16" />
          {{ changes ? $t("policy.bar.changes", { count: changes }) : $t("policy.bar.no_changes") }}
        </span>
        <span v-if="errors" class="policy-bar__errors">
          <VIcon name="error" :size="16" />
          {{ $t("policy.bar.errors", { count: errors }) }}
        </span>

        <!-- datum se bira samo za novu izmjenu, zakazana polisa zadržava svoj -->
        <div v-if="view === 'current'" class="policy-bar__date">
          <span :id="date_label_id" class="policy-bar__date-label">
            {{ $t("policy.bar.effective_from") }}
          </span>
          <VDateInput
            v-model="effective_from"
            class="policy-bar__date-input"
            :min="min"
            :aria-labelledby="date_label_id"
          />
        </div>
      </div>

      <div class="policy-bar__actions">
        <VBaseButton
          v-if="view === 'current'"
          appearance="text"
          color="neutral"
          class="policy-bar__defaults"
          :disabled="defaultsApplied"
          :title="$t('policy.actions.reset_defaults')"
          @click="$emit('reset-defaults')"
        >
          <VIcon name="restart_alt" :size="16" />
          <span class="policy-bar__defaults-text">{{ $t("policy.actions.reset_defaults") }}</span>
        </VBaseButton>
        <VBaseButton appearance="outlined" color="neutral" @click="$emit('cancel')">
          {{ $t("common.actions.cancel") }}
        </VBaseButton>
        <!-- nova izmjena se zakazuje, a postojeća zakazana se samo mijenja -->
        <VBaseButton :disabled="!canSave" @click="$emit('save')">
          <VIcon :name="view === 'current' ? 'event_available' : 'check'" :size="16" />
          {{ view === "current" ? $t("policy.actions.schedule") : $t("common.actions.save_changes") }}
        </VBaseButton>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useId } from "vue";
import VIcon from "@/components/VIcon.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VDateInput from "@/components/VDateInput.vue";

defineProps({
  view: { type: String, default: "current" },
  changes: { type: Number, default: 0 },
  errors: { type: Number, default: 0 },
  // { tone, text } ili null
  notice: { type: Object, default: null },
  min: { type: String, default: "" },
  canSave: { type: Boolean, default: false },
  defaultsApplied: { type: Boolean, default: false }
});

defineEmits(["reset-defaults", "cancel", "save"]);

const effective_from = defineModel("effectiveFrom", { type: String, default: "" });

const date_label_id = `${useId()}-date`;
</script>

<style scoped lang="scss">
.policy-bar {
  @include flex(flex-start, stretch, $space-10, column);
  position: relative;
  z-index: 3;
  padding: $space-12 $space-24;
  background: $surface-default;
  border-top: 1px solid $border-default;
  box-shadow: 0 -8px 24px -16px $alpha-black;

  &__notice {
    align-self: flex-start;
    max-width: 100%;
  }

  &__row {
    @include flex(space-between, center, $space-12 $space-16);
    flex-wrap: wrap;
  }

  &__summary {
    @include flex(flex-start, center, $space-8 $space-16);
    flex-wrap: wrap;
    min-width: 0;
  }

  &__count,
  &__errors {
    @include flex(flex-start, center, $space-6);
    padding: $space-4 $space-12;
    font-size: $text-13;
    font-weight: $weight-bold;
    line-height: $leading-xs;
    white-space: nowrap;
    border-radius: $radius-pill;
  }

  &__count {
    color: $fg-action;
    background: $alpha-primary-10;

    &.is-empty {
      font-weight: $weight-semibold;
      color: $fg-body;
      background: $surface-sunken;
    }
  }

  &__errors {
    color: $fg-error;
    background: alpha($error-500, 0.1);
  }

  &__date {
    @include flex(flex-start, center, $space-8);
  }

  &__date-label {
    font-size: $text-13;
    font-weight: $weight-semibold;
    color: $fg-heading;
    white-space: nowrap;
  }

  &__date-input {
    width: 11rem;
  }

  &__actions {
    @include flex(flex-end, center, $space-8);
    flex-wrap: wrap;
    margin-left: auto;
  }

  // usko: broj izmjena i datum u jednom redu, podrazumevana samo kao ikonica
  @include respond-to("mobile") {
    gap: $space-8;
    padding: $space-10 $space-12;

    &__summary {
      flex-wrap: nowrap;
      width: 100%;
    }

    &__errors {
      display: none;
    }

    &__date {
      flex: 1;
      min-width: 0;
    }

    &__date-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }

    &__date-input {
      flex: 1;
      width: auto;
      min-width: 0;
    }

    &__actions {
      flex-wrap: nowrap;
      justify-content: flex-start;
      gap: $space-6;
      width: 100%;

      > :not(.policy-bar__defaults) {
        flex: 1;
        min-width: 0;
        padding-inline: $space-8;

        // bez ikonice, da tekst stane
        :deep(.v-icon) {
          display: none;
        }
      }
    }

    &__defaults {
      flex-shrink: 0;
      gap: 0;
      padding-inline: $space-8;
    }

    &__defaults-text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
}
</style>
