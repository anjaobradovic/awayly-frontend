<template>
  <!-- vrh stranice: koja verzija se gleda, od kada važi i traka za zakazanu izmjenu -->
  <section :class="['policy-overview', `is-${view}`]" :aria-label="$t('policy.overview.stats.label')">
    <div class="policy-overview__hero">
      <span class="policy-overview__tile" aria-hidden="true">
        <VIcon :name="is_scheduled ? 'pending_actions' : 'verified_user'" :size="28" />
      </span>

      <div class="policy-overview__info">
        <span class="policy-overview__eyebrow">
          {{
            $t(is_scheduled ? "policy.overview.eyebrow_scheduled" : "policy.overview.eyebrow_current")
          }}
        </span>
        <h2 class="policy-overview__title">
          {{ $t("policy.overview.version", { version: source.version ?? "–" }) }}
          <VChip :tone="is_scheduled ? 'pending' : 'active'" :icon="is_scheduled ? 'access_time_filled' : 'check_circle'">
            {{ $t(is_scheduled ? "policy.status.pending" : "policy.status.active") }}
          </VChip>
        </h2>
        <p class="policy-overview__text">
          {{ $t(is_scheduled ? "policy.overview.pending_text" : "policy.overview.active_text") }}
        </p>
      </div>
    </div>

    <dl class="policy-overview__stats">
      <div v-for="stat in stats" :key="stat.key" :class="['policy-overview__stat', `is-${stat.key}`]">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>

    <!-- zakazana verzija postoji: obavještenje sa akcijama -->
    <div v-if="scheduled" class="policy-overview__banner" role="status">
      <span class="policy-overview__banner-icon" aria-hidden="true">
        <VIcon :name="is_scheduled ? 'visibility' : 'schedule'" :size="18" />
      </span>
      <div class="policy-overview__banner-text">
        <strong>
          {{
            is_scheduled
              ? $t("policy.overview.banner.viewing_title")
              : $t("policy.overview.banner.title", { version: scheduled.version ?? "" })
          }}
        </strong>
        <span>
          {{
            is_scheduled
              ? $t("policy.overview.banner.viewing_text", { date: scheduled_date })
              : $t("policy.overview.banner.text", { date: scheduled_date, relative })
          }}
        </span>
      </div>
      <div class="policy-overview__banner-actions">
        <VBaseButton
          size="small"
          appearance="outlined"
          color="neutral"
          :disabled="locked"
          @click="$emit('update:view', is_scheduled ? 'current' : 'scheduled')"
        >
          {{
            is_scheduled ? $t("policy.overview.banner.back") : $t("policy.overview.banner.view")
          }}
        </VBaseButton>
        <VBaseButton
          size="small"
          appearance="tonal"
          color="error"
          :disabled="locked"
          @click="$emit('cancel')"
        >
          {{ $t("policy.actions.cancel_scheduled") }}
        </VBaseButton>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import VChip from "@/components/VChip.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { formatFieldValue, ALL_FIELDS } from "../policy-config";
import { intlLocale, t } from "@/i18n";

const props = defineProps({
  // polisa koja se trenutno prikazuje (aktivna ili zakazana)
  source: { type: Object, required: true },
  scheduled: { type: Object, default: null },
  // "current" ili "scheduled"
  view: { type: String, default: "current" },
  // dok traje izmjena ne mijenja se prikaz
  locked: { type: Boolean, default: false }
});

defineEmits(["update:view", "cancel"]);

const is_scheduled = computed(() => props.view === "scheduled");

// 2027-01-01 u 01.01.2027. (ili 01/01/2027 na engleskom), u UTC da zona ne pomjeri dan
const formatDay = (value) =>
  value
    ? new Intl.DateTimeFormat(intlLocale(), {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC"
      }).format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`))
    : "";

const scheduled_date = computed(() => formatDay(props.scheduled?.effective_from));

// "za 45 dana" / "in 45 days"
const relative = computed(() => {
  const value = props.scheduled?.effective_from;

  if (!value) return "";

  const today = new Date();
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${String(value).slice(0, 10)}T00:00:00Z`).getTime();
  const days = Math.round((target - start) / 86400000);

  return new Intl.RelativeTimeFormat(intlLocale(), { numeric: "auto" }).format(days, "day");
});

const fieldOf = (key) => ALL_FIELDS.find((field) => field.key === key);

const stats = computed(() => [
  {
    key: "effective",
    label: t(
      is_scheduled.value
        ? "policy.overview.stats.effective_from"
        : "policy.overview.stats.effective_since"
    ),
    value: formatDay(props.source.effective_from) || "–"
  },
  {
    key: "next",
    label: t("policy.overview.stats.next_change"),
    value: is_scheduled.value
      ? relative.value
      : scheduled_date.value || t("policy.overview.stats.none")
  },
  {
    key: "annual",
    label: t("policy.overview.stats.annual"),
    value: formatFieldValue(fieldOf("annual_leave_days"), props.source)
  },
  {
    key: "wfh",
    label: t("policy.overview.stats.wfh"),
    value: formatFieldValue(fieldOf("work_from_home_monthly_limit"), props.source)
  }
]);
</script>

<style scoped lang="scss">
.policy-overview {
  --kind: #{$primary-500};

  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: $space-16 $space-24;
  position: relative;
  padding: $space-20 $space-24;
  overflow: hidden;
  background:
    radial-gradient(
      120% 120% at 100% 0%,
      color-mix(in srgb, var(--kind) 12%, transparent) 0%,
      transparent 60%
    ),
    $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;
  box-shadow: $shadow-small;

  // traka u boji statusa na vrhu
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: var(--kind);
  }

  &.is-scheduled {
    --kind: #{$fg-warning};
  }

  &__hero {
    @include flex(flex-start, center, $space-16);
    min-width: 0;
  }

  &__tile {
    @include flex(center, center);
    flex-shrink: 0;
    width: 3.5rem;
    height: 3.5rem;
    color: var(--kind);
    background: color-mix(in srgb, var(--kind) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--kind) 22%, transparent);
    border-radius: $radius-lg;
  }

  &__info {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
  }

  &__eyebrow {
    font-size: $text-11;
    font-weight: $weight-bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--kind);
  }

  &__title {
    @include flex(flex-start, center, $space-10);
    flex-wrap: wrap;
    font-size: $text-24;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: $fg-heading;
  }

  &__text {
    font-size: $text-13;
    line-height: $leading-sm;
    color: $fg-body;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-8;
    margin: 0;
  }

  &__stat {
    @include flex(center, flex-start, $space-2, column-reverse);
    position: relative;
    min-width: 0;
    padding: $space-10 $space-12 $space-10 $space-18;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;

    // crtica u boji
    &::before {
      content: "";
      position: absolute;
      top: $space-12;
      bottom: $space-12;
      left: $space-8;
      width: 3px;
      background: var(--kind);
      border-radius: $radius-pill;
    }

    &.is-annual::before,
    &.is-wfh::before {
      background: $absence-vacation;
    }

    &.is-next::before {
      background: $fg-warning;
    }

    dt {
      @include truncate;
      max-width: 100%;
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
    }

    dd {
      max-width: 100%;
      margin: 0;
      font-size: $text-16;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
      color: $fg-heading;
      overflow-wrap: anywhere;
    }
  }

  &__banner {
    @include flex(flex-start, center, $space-12);
    grid-column: 1 / -1;
    flex-wrap: wrap;
    padding: $space-12 $space-14;
    background: alpha($warning-500, 0.08);
    border: 1px solid $border-warning;
    border-radius: $radius-lg;
  }

  &.is-scheduled &__banner {
    background: $surface-sunken;
    border-color: $border-default;
  }

  &__banner-icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    color: $fg-warning;
    background: $surface-default;
    border-radius: 50%;
  }

  &__banner-text {
    @include flex(flex-start, flex-start, $space-2, column);
    flex: 1 1 18rem;
    min-width: 0;
    font-size: $text-13;
    line-height: $leading-sm;
    color: $fg-body;

    strong {
      font-size: $text-14;
      font-weight: $weight-bold;
      color: $fg-heading;
    }
  }

  &__banner-actions {
    @include flex(flex-end, center, $space-8);
    flex-wrap: wrap;
    margin-left: auto;
  }

  @include respond-to("laptop-sm") {
    grid-template-columns: minmax(0, 1fr);
  }

  @include respond-to("mobile") {
    padding: $space-16;

    &__hero {
      align-items: flex-start;
      gap: $space-12;
    }

    &__tile {
      width: 2.75rem;
      height: 2.75rem;
    }

    &__title {
      font-size: $text-20;
    }

    // usko: brojke kao lista, naziv levo a vrijednost desno
    &__stats {
      grid-template-columns: minmax(0, 1fr);
      gap: $space-6;
    }

    &__stat {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: $space-12;
      padding: $space-8 $space-12 $space-8 $space-18;

      &::before {
        top: $space-8;
        bottom: $space-8;
      }

      dt {
        white-space: normal;
      }

      dd {
        flex-shrink: 0;
        font-size: $text-14;
        white-space: nowrap;
      }
    }

    &__banner-actions {
      width: 100%;
      margin-left: 0;

      > * {
        flex: 1;
      }
    }
  }
}
</style>
