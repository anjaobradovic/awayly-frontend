<template>
  <!-- aktivna delegacija trenutnog korisnika, istaknuta na vrhu -->
  <section class="delegation-hero" :aria-label="eyebrow">
    <div class="delegation-hero__head">
      <span class="delegation-hero__icon" aria-hidden="true">
        <VIcon :name="is_outgoing ? 'forward_to_inbox' : 'how_to_reg'" :size="24" />
      </span>
      <div class="delegation-hero__heading">
        <p class="delegation-hero__eyebrow">{{ eyebrow }}</p>
        <h2 class="delegation-hero__title">
          {{
            $t(is_outgoing ? "delegations.hero.title_outgoing" : "delegations.hero.title_incoming")
          }}
        </h2>
      </div>

      <div class="delegation-hero__actions">
        <VBaseButton appearance="outlined" size="small" @click="emit('edit', delegation)">
          <VIcon name="edit" :size="16" />
          {{ $t("common.actions.edit") }}
        </VBaseButton>
        <VBaseButton
          appearance="tonal"
          color="error"
          size="small"
          @click="emit('deactivate', delegation)"
        >
          <VIcon name="block" :size="16" />
          {{ $t("delegations.deactivate") }}
        </VBaseButton>
      </div>
    </div>

    <div class="delegation-hero__body">
      <div class="delegation-hero__people">
        <DelegationPerson
          size="large"
          :name="delegation.delegated_by"
          :role="$t('delegations.card.from')"
          :is-me="is_outgoing"
        />
        <span class="delegation-hero__arrow" :title="$t('delegations.card.arrow')">
          <VIcon name="arrow_forward" :size="20" />
        </span>
        <DelegationPerson
          size="large"
          :name="delegation.delegated_to"
          :role="$t('delegations.card.to')"
          :is-me="!is_outgoing"
        />
      </div>

      <div class="delegation-hero__period">
        <div class="delegation-hero__period-row">
          <span class="delegation-hero__dates">
            <VIcon name="date_range" :size="18" />
            {{ periodLabel(delegation.start_date, delegation.end_date) }}
          </span>
          <span class="delegation-hero__left">
            <VIcon name="schedule" :size="14" />
            {{
              delegation.days_left > 0
                ? $t("delegations.card.days_left", { count: delegation.days_left })
                : $t("delegations.card.ends_today")
            }}
          </span>
        </div>

        <span
          class="delegation-hero__meter"
          role="progressbar"
          :aria-valuenow="delegation.elapsed_days"
          aria-valuemin="0"
          :aria-valuemax="delegation.total_days"
          :aria-label="$t('delegations.hero.progress_label')"
        >
          <span :style="{ width: `${percent}%` }" />
        </span>

        <div class="delegation-hero__period-row is-meta">
          <span>
            {{
              $t("delegations.hero.progress", {
                day: delegation.elapsed_days,
                total: delegation.total_days
              })
            }}
          </span>
          <span class="delegation-hero__scope">
            <VIcon name="verified_user" :size="14" />
            {{ $t("delegations.card.scope") }}:
            <strong>{{ $t("delegations.card.scope_value") }}</strong>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import DelegationPerson from "./DelegationPerson.vue";
import { periodLabel } from "../delegation-dates";
import { t } from "@/i18n";

const props = defineProps({
  delegation: { type: Object, required: true },
  currentUserId: { type: Number, default: null }
});

const emit = defineEmits(["edit", "deactivate"]);

// korisnik je delegirao svoja odobravanja (ili je on zamjenik)
const is_outgoing = computed(() => props.delegation.delegator_id === props.currentUserId);

const eyebrow = computed(() =>
  t(is_outgoing.value ? "delegations.hero.eyebrow_outgoing" : "delegations.hero.eyebrow_incoming")
);

const percent = computed(() => (props.delegation.elapsed_days / props.delegation.total_days) * 100);
</script>

<style scoped lang="scss">
.delegation-hero {
  position: relative;
  display: grid;
  gap: $space-18;
  padding: $space-20 $space-24;
  overflow: hidden;
  background:
    radial-gradient(
      120% 140% at 100% 0%,
      color-mix(in srgb, #{$success-500} 12%, transparent) 0%,
      transparent 55%
    ),
    $surface-default;
  border: 1px solid color-mix(in srgb, #{$success-500} 35%, #{$border-default});
  border-radius: $radius-xl;
  box-shadow: $shadow-small;

  // traka u boji statusa na vrhu
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: $success-500;
  }

  &__head {
    @include flex(flex-start, center, $space-14);
  }

  &__icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    color: $white;
    background: linear-gradient(140deg, $primary-400, $primary-600);
    border-radius: $radius-lg;
    box-shadow: 0 10px 20px -12px $primary-500;
  }

  &__heading {
    flex: 1;
    min-width: 0;
  }

  &__eyebrow {
    @include flex(flex-start, center, $space-6);
    font-size: $text-11;
    font-weight: $weight-bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: $fg-success;

    &::before {
      content: "";
      width: 0.5rem;
      height: 0.5rem;
      background: $success-500;
      border-radius: 50%;
      box-shadow: 0 0 0 3px color-mix(in srgb, #{$success-500} 22%, transparent);
    }
  }

  &__title {
    margin-top: $space-2;
    font-size: $text-20;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.02em;
    color: $fg-heading;
  }

  &__actions {
    @include flex(flex-end, center, $space-8);
    flex-shrink: 0;
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    gap: $space-24;
  }

  &__people {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: $space-12;
    padding: $space-14 $space-16;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__arrow {
    @include flex(center, center);
    width: 2.25rem;
    height: 2.25rem;
    color: $white;
    background: $success-500;
    border-radius: 50%;
    box-shadow: 0 6px 14px -8px $success-500;
  }

  &__period {
    display: grid;
    gap: $space-8;
    min-width: 0;
  }

  &__period-row {
    @include flex(space-between, center, $space-8);
    flex-wrap: wrap;

    &.is-meta {
      font-size: $text-12;
      color: $fg-body;
    }
  }

  &__dates {
    @include flex(flex-start, center, $space-6);
    font-size: $text-16;
    font-weight: $weight-bold;
    color: $fg-heading;

    :deep(.v-icon) {
      color: $icon-default;
    }
  }

  &__left {
    @include flex(flex-start, center, $space-4);
    padding: $space-4 $space-10;
    font-size: $text-12;
    font-weight: $weight-bold;
    line-height: $leading-xs;
    color: $white;
    background: $success-500;
    border-radius: $radius-pill;
  }

  &__meter {
    display: block;
    height: 8px;
    overflow: hidden;
    background: color-mix(in srgb, #{$success-500} 14%, transparent);
    border-radius: $radius-pill;

    span {
      display: block;
      height: 100%;
      background: linear-gradient(
        90deg,
        color-mix(in srgb, #{$success-500} 70%, transparent),
        $success-500
      );
      border-radius: inherit;
      transition: width 0.3s ease;
    }
  }

  &__scope {
    @include flex(flex-start, center, $space-4);
    flex-wrap: wrap;

    strong {
      font-weight: $weight-semibold;
      color: $fg-heading;
    }
  }

  @include respond-to("laptop-sm") {
    &__body {
      grid-template-columns: minmax(0, 1fr);
      gap: $space-16;
    }
  }

  @include respond-to("tablet-sm") {
    padding: $space-16;

    &__head {
      flex-wrap: wrap;
    }

    &__actions {
      width: 100%;

      .v-btn {
        flex: 1;
      }
    }
  }

  @include respond-to("mobile") {
    &__icon {
      display: none;
    }

    &__title {
      font-size: $text-16;
    }

    &__people {
      grid-template-columns: minmax(0, 1fr);
      justify-items: start;
      gap: $space-8;
    }

    &__arrow {
      width: 1.75rem;
      height: 1.75rem;
      margin-left: $space-12;
      transform: rotate(90deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &__meter span {
      transition: none;
    }
  }
}
</style>
