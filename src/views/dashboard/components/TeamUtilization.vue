<template>
  <!-- iskorišćenost godišnjeg po članu tima (15.6) -->
  <DashboardCard class="team-utilization" :title="$t('dashboard.utilization.title')">
    <template #actions>
      <ul class="team-utilization__legend" aria-hidden="true">
        <li>
          <span class="team-utilization__swatch is-used" />{{ $t("dashboard.utilization.used") }}
        </li>
        <li>
          <span class="team-utilization__swatch is-total" />{{ $t("dashboard.utilization.total") }}
        </li>
      </ul>
    </template>

    <ul v-if="items.length" class="team-utilization__list">
      <li
        v-for="item in items"
        :key="item.id"
        class="team-utilization__item"
        @mouseenter="showTip($event, item)"
        @mouseleave="tip = null"
      >
        <span class="team-utilization__row">
          <span class="team-utilization__name">{{ script(item.name) }}</span>
          <span class="team-utilization__days">
            <strong v-if="item.percent !== undefined">{{ item.percent }}%</strong>
            <template v-else>
              <strong>{{ item.used }}</strong>&nbsp;<span class="team-utilization__slash">/</span>&nbsp;{{ item.entitled }}
            </template>
          </span>
        </span>

        <span
          class="team-utilization__bar"
          role="img"
          :aria-label="$t('dashboard.utilization.aria', { name: item.name, value: label(item) })"
        >
          <span
            class="team-utilization__fill"
            :style="{ width: `${share(item)}%` }"
          />
        </span>
      </li>
    </ul>

    <p v-else class="team-utilization__empty">{{ $t("dashboard.utilization.empty") }}</p>

    <Teleport to="body">
      <div
        v-if="tip"
        ref="tip_ref"
        class="team-utilization__tip"
        role="tooltip"
        :style="{ left: `${tip.left}px`, top: `${tip.top}px` }"
      >
        {{ tip.text }}
      </div>
    </Teleport>
  </DashboardCard>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import DashboardCard from "./DashboardCard.vue";
import { t, script } from "@/i18n";

defineProps({
  // percent umjesto used/entitled kad se prikazuju timovi
  items: { type: Array, default: () => [] }
});

const share = (item) => {
  if (item.percent !== undefined) return Math.min(100, item.percent);
  return item.entitled ? Math.min(100, (item.used / item.entitled) * 100) : 0;
};

const EDGE = 8;

const tip = ref(null);
const tip_ref = ref(null);
const hideTip = () => (tip.value = null);

// uvijek unutar ekrana
async function showTip(event, item) {
  const bar = event.currentTarget.querySelector(".team-utilization__bar").getBoundingClientRect();

  tip.value = {
    text:
      item.percent !== undefined
        ? t("dashboard.utilization.percent_used", { percent: item.percent })
        : t("dashboard.utilization.used_remaining", {
            used: item.used,
            remaining: Math.max(0, item.entitled - item.used)
          }),
    left: bar.left + (bar.width * share(item)) / 100,
    top: bar.top
  };

  await nextTick();

  const half = (tip_ref.value?.offsetWidth ?? 0) / 2;

  if (tip.value) {
    tip.value.left = Math.min(
      Math.max(EDGE + half, tip.value.left),
      window.innerWidth - EDGE - half
    );
  }
}

onMounted(() => window.addEventListener("scroll", hideTip, true));
onBeforeUnmount(() => window.removeEventListener("scroll", hideTip, true));

const label = (item) =>
  item.percent !== undefined
    ? `${item.percent}%`
    : t("dashboard.utilization.of_days", { used: item.used, count: item.entitled });
</script>

<style scoped lang="scss">
.team-utilization {
  min-height: 0;
  padding-bottom: 0;

  &__legend {
    @include flex(flex-start, center, $space-16);
    flex-shrink: 0;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    list-style: none;

    li {
      @include flex(flex-start, center, $space-8);
    }
  }

  &__swatch {
    width: 8px;
    height: 8px;
    border-radius: $radius-xs;

    &.is-used {
      background: $primary-400;
    }

    &.is-total {
      background: $cold-300;
    }
  }

  &__list {
    @include flex(flex-start, stretch, $space-16, column);
    flex: 1;
    min-height: 0;
    padding: 0 $space-4 $space-12 0;
    overflow-y: auto;
    list-style: none;
    @include thin-scrollbar($cold-225);
  }

  &__item {
    @include flex(flex-start, stretch, $space-4, column);
    flex-shrink: 0;
  }

  &__row {
    @include flex(space-between, center, $space-8);
  }

  &__name {
    @include truncate;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
  }

  &__days {
    flex-shrink: 0;
    padding: $space-4 0;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    white-space: nowrap;

    strong {
      font-weight: $weight-semibold;
    }
  }

  &__slash {
    font-size: $text-10;
  }

  &__bar {
    position: relative;
    height: 6px;
    overflow: hidden;
    background: $cold-100;
    border-radius: $radius-sm;
  }

  &__fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: $primary-350;
    border-radius: $radius-sm;
  }

  &__tip {
    position: fixed;
    z-index: $z-tooltip;
    padding: $space-8;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    white-space: nowrap;
    background: $surface-default;
    border-radius: $radius-sm;
    box-shadow: $shadow-header;
    transform: translate(-50%, calc(-100% - #{$space-8}));
    pointer-events: none;
  }

  &__empty {
    padding: $space-24 0;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
    text-align: center;
  }
}
</style>
