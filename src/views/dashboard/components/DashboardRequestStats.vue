<template>
  <DashboardCard class="dashboard-stats" :title="title ?? $t('dashboard.stats.requests_title')">
    <div class="dashboard-stats__body">
      <template v-for="(stat, index) in stats" :key="stat.label">
        <span v-if="index" class="dashboard-stats__divider" aria-hidden="true" />

        <div class="dashboard-stats__item">
          <span class="dashboard-stats__label">
            <span :class="['dashboard-stats__icon', `dashboard-stats__icon--${stat.tone}`]">
              <VIcon :name="stat.icon" :size="16" />
            </span>
            {{ stat.label }}
          </span>

          <strong class="dashboard-stats__number">{{ stat.count }}</strong>

          <button type="button" class="dashboard-stats__link" @click="emit('details', stat.key)">
            {{ $t("dashboard.view_details") }}
            <VIcon name="arrow_forward" :size="14" />
          </button>
        </div>
      </template>
    </div>
  </DashboardCard>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import DashboardCard from "./DashboardCard.vue";
import { t } from "@/i18n";

const props = defineProps({
  // bez naslova i oznaka koriste se prevodi za zahteve
  title: { type: String, default: null },
  pending: { type: Number, default: 0 },
  approved: { type: Number, default: 0 },
  pendingLabel: { type: String, default: null },
  approvedLabel: { type: String, default: null }
});

const emit = defineEmits(["details"]);

const stats = computed(() => [
  {
    key: "pending",
    label: props.pendingLabel ?? t("dashboard.stats.pending"),
    icon: "watch_later",
    tone: "pending",
    count: props.pending
  },
  {
    key: "approved",
    label: props.approvedLabel ?? t("dashboard.stats.approved"),
    icon: "check",
    tone: "approved",
    count: props.approved
  }
]);
</script>

<style scoped lang="scss">
.dashboard-stats {
  &__body {
    @include flex(center, stretch, $space-40);
    flex: 1;
    padding: $space-24 0;
  }

  &__divider {
    flex-shrink: 0;
    width: 2px;
    background: $cold-75;
  }

  &__item {
    @include flex(space-between, center, $space-8, column);
    flex: 1;
    min-width: 0;
  }

  &__label {
    @include flex(center, center, $space-8);
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    text-align: center;
  }

  &__icon {
    @include flex(center, center);
    flex-shrink: 0;
    padding: $space-4;
    border-radius: $radius-xl;

    &--pending {
      color: $icon-warning;
      background: $alpha-orange;
    }

    &--approved {
      color: $icon-success;
      background: $alpha-green;
    }
  }

  &__number {
    font-size: $text-40;
    font-weight: $weight-semibold;
    line-height: $leading-xl;
    color: $fg-heading;
  }

  &__link {
    @include flex(center, center, $space-2);
    padding: 0;
    font-family: inherit;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    background: none;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:hover {
      color: $fg-heading;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 2px;
    }
  }
}
</style>
