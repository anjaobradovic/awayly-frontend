<template>
  <section class="dashboard-welcome">
    <!-- meki prelaz u boji akcenta -->
    <div class="dashboard-welcome__glow" aria-hidden="true" />

    <div class="dashboard-welcome__content">
      <div class="dashboard-welcome__text">
        <h2 class="dashboard-welcome__title">
          {{ greeting }}
          <span class="dashboard-welcome__name">{{ name }}</span>
        </h2>

        <p class="dashboard-welcome__meta">
          <span>{{ script(company) }}</span>
          <template v-if="team">
            <span class="dashboard-welcome__dot" aria-hidden="true">·</span>
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
      </div>

      <span class="dashboard-welcome__illustration">
        <img :src="illustration" alt="" />
      </span>
    </div>
  </section>
</template>

<script setup>
import illustration from "@/assets/images/dashboard/welcome-calendar-clock.svg";
import { computed } from "vue";
import { t, script } from "@/i18n";

defineProps({
  name: { type: String, default: "" },
  company: { type: String, default: "" },
  team: { type: String, default: "" },
  // preostali dani godisnjeg i zahtjevi na cekanju
  freeDays: { type: Number, default: 0 },
  pending: { type: Number, default: 0 }
});

// pozdrav po dobu dana: do 12 jutro, do 18 dan, posle veče
const greeting = computed(() => {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return t(`dashboard.welcome.${part}`);
});
</script>

<style scoped lang="scss">
.dashboard-welcome {
  position: relative;
  @include flex(center, stretch, 0, column);
  min-height: 14.5rem;
  padding: $space-36 $space-24;
  overflow: hidden;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;

  &__glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 140% at 100% 0%, alpha($primary-500, 0.22) 0%, transparent 55%),
      radial-gradient(90% 120% at 0% 100%, alpha($primary-350, 0.16) 0%, transparent 60%);
    pointer-events: none;
  }

  &__content {
    position: relative;
    @include flex(space-between, center, $space-16);
  }

  &__text {
    @include flex(center, flex-start, $space-8, column);
    max-width: 20.5rem;
    min-height: 8.75rem;
  }

  &__title {
    @include flex(flex-start, flex-start, $space-8);
    flex-wrap: wrap;
    font-size: $text-24;
    font-weight: $weight-semibold;
    line-height: $leading-md;
    color: $fg-heading;
  }

  &__name {
    color: $fg-action;
  }

  &__meta {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__dot {
    font-size: $text-20;
    font-weight: $weight-semibold;
    line-height: $leading-24;
  }

  &__summary {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__illustration {
    flex-shrink: 0;
    width: 12.1875rem;
    height: 9.125rem;

    img {
      display: block;
      margin-top: -1px;
    }
  }

  @include respond-to("tablet-sm") {
    padding: $space-24 $space-16;

    &__illustration {
      display: none;
    }
  }
}
</style>
