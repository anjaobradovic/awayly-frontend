<template>
  <section class="dashboard-welcome">
    <!-- ukrasni krugovi u pozadini -->
    <span class="dashboard-welcome__orb is-large" aria-hidden="true" />
    <span class="dashboard-welcome__orb is-small" aria-hidden="true" />

    <div class="dashboard-welcome__text">
      <p class="dashboard-welcome__date">{{ today }}</p>

      <h2 class="dashboard-welcome__title">
        {{ greeting }} <span class="dashboard-welcome__name">{{ script(name) }}</span>
      </h2>

      <p class="dashboard-welcome__meta">
        <span>{{ script(company) }}</span>
        <template v-if="team">
          <span aria-hidden="true">·</span>
          <span>{{ script(team) }}</span>
        </template>
      </p>

      <p class="dashboard-welcome__summary">
        {{
          $t("dashboard.welcome.summary", {
            free_days: $t("dashboard.welcome.free_days", { count: freeDays }),
            pending: $t("dashboard.welcome.requests", { count: pending })
          })
        }}
      </p>

      <div class="dashboard-welcome__actions">
        <router-link :to="{ name: 'calendar' }" class="dashboard-welcome__action">
          <VIcon name="calendar_month" :size="18" />
          {{ $t("dashboard.welcome.open_calendar") }}
        </router-link>
        <button type="button" class="dashboard-welcome__action" @click="emit('requests')">
          <VIcon name="list_alt" :size="18" />
          {{ $t("dashboard.welcome.open_requests") }}
        </button>
      </div>
    </div>

    <!-- tri broja koja zaposlenog najviše zanimaju -->
    <dl class="dashboard-welcome__kpis">
      <div v-for="kpi in kpis" :key="kpi.key" :class="['dashboard-welcome__kpi', `is-${kpi.key}`]">
        <dt>
          <VIcon :name="kpi.icon" :size="18" />
          {{ kpi.label }}
        </dt>
        <dd>{{ kpi.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import { intlLocale, script, t } from "@/i18n";

const props = defineProps({
  name: { type: String, default: "" },
  company: { type: String, default: "" },
  team: { type: String, default: "" },
  // preostali dani godisnjeg i zahtjevi na cekanju / odobreni
  freeDays: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  approved: { type: Number, default: 0 }
});

const emit = defineEmits(["requests"]);

// pozdrav po dobu dana: do 12 jutro, do 18 dan, posle veče
const greeting = computed(() => {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return t(`dashboard.welcome.${part}`);
});

const today = computed(() =>
  new Intl.DateTimeFormat(intlLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date())
);

const kpis = computed(() => [
  {
    key: "free",
    icon: "beach_access",
    label: t("dashboard.welcome.kpi_free"),
    value: props.freeDays
  },
  {
    key: "pending",
    icon: "hourglass_top",
    label: t("dashboard.welcome.kpi_pending"),
    value: props.pending
  },
  {
    key: "approved",
    icon: "task_alt",
    label: t("dashboard.welcome.kpi_approved"),
    value: props.approved
  }
]);
</script>

<style scoped lang="scss">
.dashboard-welcome {
  position: relative;
  isolation: isolate;
  @include flex(space-between, center, $space-32);
  padding: $space-32;
  overflow: hidden;
  color: $white;
  background:
    radial-gradient(70% 120% at 100% 0%, alpha($white, 0.16) 0%, transparent 60%),
    linear-gradient(120deg, $primary-600 0%, $primary-500 55%, $primary-400 100%);
  border-radius: $radius-xl;
  box-shadow: 0 18px 40px -24px $primary-600;

  &__orb {
    position: absolute;
    z-index: -1;
    border: 1px solid alpha($white, 0.18);
    border-radius: 50%;
    pointer-events: none;

    &.is-large {
      top: -9rem;
      right: 18%;
      width: 22rem;
      height: 22rem;
    }

    &.is-small {
      right: -3rem;
      bottom: -6rem;
      width: 14rem;
      height: 14rem;
      background: alpha($white, 0.06);
    }
  }

  &__text {
    @include flex(flex-start, flex-start, $space-8, column);
    max-width: 34rem;
  }

  &__date {
    font-size: $text-12;
    font-weight: $weight-semibold;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: alpha($white, 0.7);
  }

  &__title {
    font-size: $text-30;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  &__name {
    color: alpha($white, 0.82);
  }

  &__meta {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    font-size: $text-13;
    color: alpha($white, 0.75);
  }

  &__summary {
    font-size: $text-14;
    line-height: $leading-sm;
    color: alpha($white, 0.9);
  }

  &__actions {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    margin-top: $space-8;
  }

  &__action {
    @include flex(center, center, $space-6);
    height: 2.25rem;
    padding: 0 $space-14;
    font-family: inherit;
    font-size: $text-13;
    font-weight: $weight-semibold;
    color: $white;
    text-decoration: none;
    background: alpha($white, 0.14);
    border: 1px solid alpha($white, 0.22);
    border-radius: $radius-pill;
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition: $transition;

    &:hover {
      background: alpha($white, 0.24);
    }

    &:focus-visible {
      outline: 2px solid $white;
      outline-offset: 2px;
    }
  }

  &__kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(7.5rem, 1fr));
    gap: $space-12;
    flex-shrink: 0;
    margin: 0;
  }

  &__kpi {
    @include flex(space-between, flex-start, $space-16, column);
    min-height: 7.5rem;
    padding: $space-16;
    background: alpha($white, 0.12);
    border: 1px solid alpha($white, 0.2);
    border-radius: $radius-lg;
    backdrop-filter: blur(8px);

    dt {
      @include flex(flex-start, center, $space-6);
      font-size: $text-12;
      font-weight: $weight-semibold;
      color: alpha($white, 0.8);
    }

    dd {
      margin: 0;
      font-size: $text-40;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.03em;
    }

    // prvi broj je najvažniji, puna bijela kartica
    &.is-free {
      color: $primary-600;
      background: $white;
      border-color: $white;

      dt {
        color: $primary-500;
      }
    }
  }

  @include respond-to("laptop-sm") {
    flex-direction: column;
    align-items: stretch;

    &__text {
      max-width: none;
    }
  }

  @include respond-to("mobile") {
    padding: $space-20;

    &__title {
      font-size: $text-24;
    }

    &__kpis {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: $space-8;
    }

    &__kpi {
      min-height: 0;
      padding: $space-12;

      dd {
        font-size: $text-28;
      }
    }
  }
}
</style>
