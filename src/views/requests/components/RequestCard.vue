<template>
  <!-- klik na karticu otvara panel sa detaljima (RequestDetailsDrawer) -->
  <article
    :class="[
      'request-card',
      { 'is-decided': request.is_decided, 'has-actions': can_decide || can_cancel }
    ]"
    tabindex="0"
    :aria-label="$t('requests.card.details_for', { name: request.employee || request.leave_type })"
    @click="emit('open', request)"
    @keydown.enter.self="emit('open', request)"
  >
    <header class="request-card__top">
      <span class="request-card__type">
        <VIcon :name="iconOf(request.leave_type)" :size="16" />
        {{ script(request.leave_type) }}
      </span>

      <span class="request-card__meta">
        <!-- ikona kad zahtjev nije dodijeljen tebi, vidis ga jer odobravas sve -->
        <span
          v-if="!request.is_my_assignment"
          class="request-card__assignment"
          :title="$t('requests.card.not_assigned')"
        >
          <VIcon name="how_to_reg" :size="16" />
        </span>
        {{ $t("requests.card.submitted_on", { date: formatDate(request.created_at, { dateOnly: true }) }) }}
      </span>
    </header>

    <div class="request-card__bottom">
      <div class="request-card__info">
        <p v-if="request.employee" class="request-card__person">
          <strong>{{ script(request.employee) }}</strong>
          <template v-if="request.team">
            <span aria-hidden="true">|</span>
            {{ script(request.team) }}
          </template>
        </p>
        <p class="request-card__dates">
          <VIcon name="calendar_month" :size="16" />
          {{ formatDateRange(request.start_date, request.end_date) }}
        </p>
      </div>

      <VChip v-if="chip" class="request-card__chip" :tone="chip.tone" :icon="chip.icon">
        {{ chip.label }}
      </VChip>

      <!-- dugmad se pojave na hover, stop da klik ne otvori karticu -->
      <div v-if="can_decide" class="request-card__actions" @click.stop>
        <VBaseButton appearance="tonal" color="primary" @click="emit('reject', request)">
          {{ $t("requests.card.reject") }}
        </VBaseButton>
        <VBaseButton @click="emit('approve', request)">{{ $t("requests.card.approve") }}</VBaseButton>
      </div>

      <div v-else-if="can_cancel" class="request-card__actions" @click.stop>
        <VBaseButton appearance="tonal" color="primary" @click="emit('cancel', request)">
          {{ $t("requests.card.cancel") }}
        </VBaseButton>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import VChip from "@/components/VChip.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useDate } from "@/composables/useDate";
import { script } from "@/i18n";
import { formatDateRange } from "@/utils/date-range";
import { CHANGE_LABELS, STATUS_CHIPS, canCancel, iconOf } from "@/views/requests/request-config";

const props = defineProps({
  request: { type: Object, required: true },
  approving: { type: Boolean, default: false }
});

const emit = defineEmits(["approve", "reject", "open", "cancel"]);
const { formatDate } = useDate();

const can_decide = computed(() => props.approving && !props.request.is_decided);

// moj zahtjev na cekanju ili odobren a jos nije poceo
const can_cancel = computed(() => !props.approving && canCancel(props.request));

const chip = computed(() => {
  const { status, change_type, is_decided } = props.request;

  if (!props.approving || is_decided) return STATUS_CHIPS[status] ?? null;
  if (status === "PENDING_CANCELLATION") return STATUS_CHIPS.PENDING_CANCELLATION;
  if (CHANGE_LABELS[change_type]) return { label: CHANGE_LABELS[change_type], tone: "default" };

  return null;
});
</script>

<style scoped lang="scss">
.request-card {
  @include flex(flex-start, stretch, $space-16, column);
  flex-shrink: 0;
  padding: $space-12;
  background-color: $surface-default;
  background-image: linear-gradient(
    90deg,
    color-mix(in srgb, var(--request-accent) 3%, transparent) 0%,
    transparent 100%
  );
  border: 1px solid transparent;
  border-radius: $radius-sm;
  box-shadow:
    0 1px 0.5px rgba($black, 0.05),
    0 2px 5px rgba($black, 0.1);
  cursor: pointer;

  &:focus-visible {
    outline: 1px solid $border-action-focused;
  }

  &.is-decided {
    background-color: $cold-25;
    border-color: $border-default;
  }

  &__top,
  &__bottom {
    @include flex(space-between, center, $space-12);
  }

  &__bottom {
    align-items: flex-end;
  }

  &__type {
    @include flex(flex-start, center, $space-4);
    font-size: $text-12;
    line-height: $leading-xs;
    color: var(--request-accent);
  }

  &__meta {
    @include flex(flex-end, center, $space-16);
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    white-space: nowrap;
  }

  &__assignment {
    @include flex(center, center);
    padding: $space-2;
    color: $icon-default;
    border: 1px solid $border-action-disabled;
    border-radius: $radius-pill;
  }

  &__info {
    @include flex(flex-start, stretch, $space-12, column);
    min-width: 0;
  }

  &__person {
    @include truncate;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;

    strong {
      font-size: $text-14;
      font-weight: $weight-semibold;
    }

    span {
      margin: 0 $space-4;
    }
  }

  &__dates {
    @include flex(flex-start, center, $space-4);
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
  }

  &__chip {
    flex-shrink: 0;
  }

  &__actions {
    display: none;
    flex-shrink: 0;
    gap: $space-12;
  }

  &.has-actions:hover,
  &.has-actions:focus-within {
    .request-card__actions {
      display: flex;
    }

    .request-card__chip {
      display: none;
    }
  }

  // na touch ekranu nema hovera pa su dugmad uvijek vidljiva
  @media (hover: none) {
    &.has-actions .request-card__actions {
      display: flex;
    }
  }
}
</style>
