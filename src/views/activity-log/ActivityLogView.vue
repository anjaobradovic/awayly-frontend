<template>
  <div class="activity-log">
    <div class="activity-log__header">
      <VPageHeader :title="$t('activity_log.title')" :description="$t('activity_log.description')">
        <template #actions>
          <VBaseInput
            v-model="search"
            class="activity-log__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('activity_log.search_placeholder')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>

          <VFilterPopup
            v-model:open="is_filter_open"
            :title="$t('activity_log.filters.title')"
            :clear-label="$t('activity_log.filters.clear')"
            :apply-label="$t('activity_log.filters.apply')"
            :can-clear="activity_store.has_filters"
            :count="activity_store.filter_count"
            @apply="applyFilters"
            @clear="clearFilters"
          >
            <template #trigger="{ toggle, open }">
              <VBaseButton
                class="activity-log__filters"
                appearance="outlined"
                size="header"
                :aria-expanded="open"
                aria-haspopup="dialog"
                @click="toggle"
              >
                {{ $t("common.actions.filter") }}
                <VIcon name="tune" :size="16" />
              </VBaseButton>
            </template>

            <VSelect
              v-model="draft_filters.audit_type"
              :label="$t('activity_log.filters.audit_type')"
              appearance="underlined"
              :placeholder="$t('activity_log.filters.audit_type_placeholder')"
              :options="activity_store.audit_type_options"
            />
            <VDateInput
              v-model="draft_filters.date_from"
              :label="$t('activity_log.filters.date_from')"
              :max="draft_filters.date_to"
            />
            <VDateInput
              v-model="draft_filters.date_to"
              :label="$t('activity_log.filters.date_to')"
              :min="draft_filters.date_from"
            />
          </VFilterPopup>
        </template>
      </VPageHeader>
    </div>

    <div class="activity-log__body">
      <div class="activity-log__inner">
        <p v-if="has_items" class="activity-log__count" aria-live="polite">
          {{ $t("activity_log.shown") }}
          <strong>{{ activity_store.visible_items.length }}</strong>
          {{ $t("activity_log.count_of", { count: activity_store.total_count }) }}
        </p>

        <!-- prvo učitavanje: kostur od četiri zapisa -->
        <div v-if="is_initial_loading" class="activity-log__skeleton" aria-hidden="true">
          <div v-for="index in 4" :key="index" class="activity-log__skeleton-row">
            <span class="activity-log__skeleton-dot" />
            <span class="activity-log__skeleton-card">
              <span class="activity-log__skeleton-bar is-short" />
              <span class="activity-log__skeleton-bar" />
              <span class="activity-log__skeleton-bar is-tiny" />
            </span>
          </div>
          <span class="visually-hidden">{{ $t("common.states.loading") }}</span>
        </div>

        <!-- greška bez ijednog zapisa -->
        <div v-else-if="activity_store.error && !has_items" class="activity-log__state is-error">
          <span class="activity-log__state-icon">
            <VIcon name="error_outline" :size="28" />
          </span>
          <p class="activity-log__state-title">{{ error_text }}</p>
          <VBaseButton appearance="outlined" size="small" @click="activity_store.fetchEntries()">
            {{ $t("activity_log.retry") }}
          </VBaseButton>
        </div>

        <div v-else-if="!activity_store.visible_items.length" class="activity-log__state">
          <span class="activity-log__state-icon">
            <VIcon :name="is_filtered ? 'search_off' : 'history'" :size="28" />
          </span>
          <p class="activity-log__state-title">
            {{ is_filtered ? $t("activity_log.empty_filtered") : $t("activity_log.empty") }}
          </p>
          <p class="activity-log__state-hint">
            {{ is_filtered ? $t("activity_log.empty_filtered_hint") : $t("activity_log.empty_hint") }}
          </p>
          <VBaseButton
            v-if="activity_store.has_filters"
            appearance="outlined"
            size="small"
            @click="clearFilters"
          >
            {{ $t("activity_log.filters.clear") }}
          </VBaseButton>
        </div>

        <ol
          v-else
          :class="['activity-log__days', { 'is-refreshing': activity_store.is_loading }]"
          :aria-label="$t('activity_log.timeline_label')"
          :aria-busy="activity_store.is_loading"
        >
          <li v-for="day in days" :key="day.key" class="activity-log__day">
            <h3 class="activity-log__day-header">
              <span class="activity-log__day-title">{{ day.title }}</span>
              <span v-if="day.subtitle" class="activity-log__day-date">{{ day.subtitle }}</span>
              <span class="activity-log__day-count">
                {{ $t("activity_log.day_count", { count: day.entries.length }) }}
              </span>
            </h3>

            <ol class="activity-log__entries">
              <li
                v-for="entry in day.entries"
                :key="entry.id"
                :class="['activity-log__entry', `is-${entry.tone}`]"
              >
                <span class="activity-log__dot" aria-hidden="true">
                  <VIcon :name="entry.icon" :size="14" />
                </span>

                <article class="activity-log__card">
                  <div class="activity-log__top">
                    <time class="activity-log__time" :datetime="entry.created_at">
                      {{ formatTime(entry.created_at) }}
                    </time>
                    <h4 class="activity-log__title">{{ entry.audit_label }}</h4>
                    <span v-if="entry.entity" class="activity-log__entity">
                      <VIcon :name="entry.entity.icon" :size="14" />
                      {{ entry.entity.label }}
                    </span>
                  </div>

                  <p
                    v-if="entry.details.length && !isExpanded(entry.id)"
                    class="activity-log__summary"
                    :title="summary(entry)"
                  >
                    {{ summary(entry) }}
                  </p>

                  <div class="activity-log__meta">
                    <span class="activity-log__actor">
                      <span
                        :class="['activity-log__avatar', { 'is-system': entry.is_system }]"
                        :style="{ '--avatar-hue': hue(entry.actor_name) }"
                        aria-hidden="true"
                      >
                        <VIcon v-if="entry.is_system" name="smart_toy" :size="14" />
                        <template v-else>{{ entry.actor_initials }}</template>
                      </span>
                      <span class="activity-log__actor-name" :title="entry.actor_name">
                        {{ entry.actor_name }}
                      </span>
                      <span v-if="!entry.is_system" class="activity-log__actor-type">
                        {{ entry.actor_type }}
                      </span>
                    </span>

                    <button
                      v-if="entry.details.length"
                      type="button"
                      :class="['activity-log__toggle', { 'is-open': isExpanded(entry.id) }]"
                      :aria-expanded="isExpanded(entry.id)"
                      :aria-controls="`activity-details-${entry.id}`"
                      @click="toggle(entry.id)"
                    >
                      {{ $t("activity_log.details_toggle") }}
                      <VIcon name="expand_more" :size="16" />
                    </button>
                  </div>

                  <dl
                    v-if="entry.details.length && isExpanded(entry.id)"
                    :id="`activity-details-${entry.id}`"
                    class="activity-log__details"
                  >
                    <div v-for="item in entry.details" :key="item.key" class="activity-log__detail">
                      <dt>{{ item.label }}</dt>
                      <dd>{{ item.value }}</dd>
                    </div>
                  </dl>
                </article>
              </li>
            </ol>
          </li>
        </ol>

        <footer v-if="has_items && !is_initial_loading" class="activity-log__footer">
          <p v-if="activity_store.error && has_items" class="activity-log__footer-error">
            {{ error_text }}
          </p>

          <VBaseButton
            v-if="activity_store.has_more"
            class="activity-log__more"
            appearance="outlined"
            size="medium"
            :disabled="activity_store.is_loading_more"
            @click="activity_store.loadMore()"
          >
            <VIcon
              :name="activity_store.is_loading_more ? 'progress_activity' : 'expand_more'"
              :size="18"
              :class="{ 'is-spinning': activity_store.is_loading_more }"
            />
            {{
              activity_store.is_loading_more
                ? $t("activity_log.loading_more")
                : $t("activity_log.load_more")
            }}
          </VBaseButton>

          <p v-else class="activity-log__end">
            <VIcon name="check_circle" :size="16" />
            {{ $t("activity_log.all_loaded") }}
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VFilterPopup from "@/components/VFilterPopup.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import { useActivityLogStore } from "@/stores/activity-log";
import { useDate } from "@/composables/useDate";
import { getErrorMessage } from "@/utils/api-error";
import { intlLocale, t } from "@/i18n";

const activity_store = useActivityLogStore();
const { timezone } = useDate();

const is_filter_open = ref(false);
const draft_filters = ref({ ...activity_store.filters });

// svako otvaranje kreće od trenutno primenjenih filtera (Odustani ih ne menja)
watch(is_filter_open, (open) => {
  if (open) draft_filters.value = { ...activity_store.filters };
});

function applyFilters() {
  activity_store.setFilters(draft_filters.value);
  is_filter_open.value = false;
}

function clearFilters() {
  activity_store.clearFilters();
  is_filter_open.value = false;
}

const search = computed({
  get: () => activity_store.search,
  set: (value) => activity_store.setSearch(value)
});

const has_items = computed(() => activity_store.items.length > 0);

const is_initial_loading = computed(() => activity_store.is_loading && !has_items.value);

const is_filtered = computed(() => activity_store.has_filters || !!activity_store.search.trim());

const error_text = computed(() =>
  getErrorMessage(activity_store.error, t("common.states.error"))
);

// dan u zoni organizacije, "2026-11-16" (en-CA daje ISO redoslijed)
const dayKey = (value) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone.value,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));

const formatTime = (value) =>
  new Intl.DateTimeFormat(intlLocale(), {
    timeZone: timezone.value,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(new Date(value));

// ključ dana -> "ponedeljak, 9. novembar", godina samo ako nije tekuća
const formatDay = (key, with_weekday = true) => {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return new Intl.DateTimeFormat(intlLocale(), {
    timeZone: "UTC",
    ...(with_weekday && { weekday: "long" }),
    day: "numeric",
    month: "long",
    ...(year !== new Date().getFullYear() && { year: "numeric" })
  }).format(date);
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// zapisi stižu od najnovijeg, grupišemo po danu zadržavajući redoslijed
const days = computed(() => {
  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 86_400_000);
  const groups = new Map();

  for (const entry of activity_store.visible_items) {
    const key = dayKey(entry.created_at);

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  return [...groups].map(([key, entries]) => {
    const relative =
      key === today
        ? t("activity_log.today")
        : key === yesterday
          ? t("activity_log.yesterday")
          : null;

    return {
      key,
      entries,
      title: relative ?? capitalize(formatDay(key)),
      subtitle: relative ? formatDay(key, false) : ""
    };
  });
});

// otvoreni detalji po id-u zapisa
const expanded = ref({});

const isExpanded = (id) => !!expanded.value[id];

const toggle = (id) => {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] };
};

// vrijednosti koje same ne govore ništa ("4") idu sa nazivom
const LABELED_IN_SUMMARY = new Set(["version", "effective_from", "reason", "rejection_reason"]);

// kratak pregled detalja dok su zatvoreni
const summary = (entry) =>
  entry.details
    .map((item) =>
      LABELED_IN_SUMMARY.has(item.key) ? `${item.label}: ${item.value}` : item.value
    )
    .join(" · ");

// ista osoba uvijek dobije istu nijansu
const hue = (name = "") => [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

onMounted(() => activity_store.fetchEntries());

onUnmounted(() => activity_store.resetStore());
</script>

<style lang="scss" scoped>
.activity-log {
  --page-bg: #{$cold-50};

  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  background: var(--page-bg);

  &__header {
    position: relative;
    z-index: 3;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__search {
    width: 20.125rem;
  }

  &__filters.v-btn {
    color: $fg-action;
  }

  // skrol je ovdje da bi zaglavlja dana mogla da se lijepe
  &__body {
    min-height: 0;
    overflow-y: auto;
  }

  &__inner {
    max-width: 56rem;
    margin: 0 auto;
    padding: $space-16 $space-24 $space-32;
  }

  &__count {
    margin-bottom: $space-4;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;

    strong {
      font-weight: $weight-bold;
      color: $fg-action;
    }
  }

  // dan
  &__days {
    list-style: none;
    transition: opacity 0.2s ease;

    &.is-refreshing {
      opacity: 0.55;
    }
  }

  &__day-header {
    @include flex(flex-start, baseline, $space-8);
    flex-wrap: wrap;
    position: sticky;
    top: 0;
    z-index: 2;
    margin: 0 (-$space-4);
    padding: $space-12 $space-4 $space-8;
    font-size: $text-14;
    line-height: $leading-sm;
    background: var(--page-bg);
  }

  &__day-title {
    font-weight: $weight-bold;
    color: $fg-heading;
  }

  &__day-date {
    font-size: $text-12;
    color: $fg-body;
  }

  &__day-count {
    margin-left: auto;
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xxs;
    color: $fg-body;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-pill;
  }

  // vertikalna linija vremenske ose
  &__entries {
    position: relative;
    padding: $space-4 0 $space-8 2.75rem;
    list-style: none;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      left: calc(0.875rem - 1px);
      width: 2px;
      background: $border-default;
      border-radius: $radius-pill;
    }
  }

  &__entry {
    --tone: #{$cold-550};

    position: relative;

    & + & {
      margin-top: $space-10;
    }

    &.is-success {
      --tone: #{$success-500};
    }

    &.is-accent {
      --tone: #{$primary-500};
    }

    &.is-error {
      --tone: #{$error-500};
    }

    &.is-warning {
      --tone: #{$warning-500};
    }

    &.is-info {
      --tone: #{$information-500};
    }
  }

  &__dot {
    @include flex(center, center);
    position: absolute;
    top: $space-12;
    left: -2.75rem;
    width: 1.75rem;
    height: 1.75rem;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 16%, #{$surface-default});
    border: 1px solid color-mix(in srgb, var(--tone) 40%, transparent);
    border-radius: 50%;
    // prsten u boji pozadine prekida liniju oko tačke
    box-shadow: 0 0 0 4px var(--page-bg);
  }

  &__card {
    @include flex(flex-start, stretch, $space-8, column);
    min-width: 0;
    padding: $space-12 $space-16;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
    transition: $transition;

    &:hover {
      border-color: color-mix(in srgb, var(--tone) 45%, #{$border-default});
    }
  }

  &__top {
    @include flex(flex-start, center, $space-6 $space-10);
    flex-wrap: wrap;
    min-width: 0;
  }

  &__time {
    flex-shrink: 0;
    font-size: $text-12;
    font-weight: $weight-semibold;
    font-variant-numeric: tabular-nums;
    color: $fg-body;
  }

  &__title {
    flex: 1 1 auto;
    min-width: 0;
    font-size: $text-14;
    font-weight: $weight-bold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__entity {
    @include flex(flex-start, center, $space-4);
    flex-shrink: 0;
    padding: $space-2 $space-8 $space-2 $space-6;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xxs;
    color: $fg-body;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-pill;

    :deep(.v-icon) {
      color: var(--tone);
    }
  }

  &__summary {
    @include truncate;
    font-size: $text-13;
    line-height: $leading-sm;
    color: $fg-body;
  }

  &__meta {
    @include flex(space-between, center, $space-8);
    min-width: 0;
  }

  &__actor {
    @include flex(flex-start, center, $space-6);
    min-width: 0;
    font-size: $text-12;
  }

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    font-size: $text-10;
    font-weight: $weight-bold;
    color: hsl(var(--avatar-hue) 55% 35%);
    background: hsl(var(--avatar-hue) 70% 88%);
    border-radius: 50%;

    &.is-system {
      color: $primary-500;
      background: $alpha-primary-10;
    }
  }

  &__actor-name {
    @include truncate;
    min-width: 0;
    font-weight: $weight-semibold;
    color: $fg-heading;
  }

  &__actor-type {
    flex-shrink: 0;
    color: $fg-body;

    &::before {
      content: "·";
      margin-right: $space-6;
    }
  }

  &__toggle {
    @include flex(flex-start, center, $space-2);
    flex-shrink: 0;
    padding: $space-2 $space-4 $space-2 $space-8;
    font-family: inherit;
    font-size: $text-12;
    font-weight: $weight-semibold;
    color: $fg-action;
    background: transparent;
    border: 0;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    :deep(.v-icon) {
      transition: transform 0.2s ease;
    }

    &:hover {
      background: $alpha-primary-10;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 1px;
    }

    &.is-open :deep(.v-icon) {
      transform: rotate(180deg);
    }
  }

  &__details {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: $space-10 $space-16;
    padding: $space-12;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-md;
    animation: activity-details-in 0.18s ease;
  }

  &__detail {
    min-width: 0;

    dt {
      margin-bottom: $space-2;
      font-size: $text-11;
      font-weight: $weight-semibold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: $fg-body;
    }

    dd {
      font-size: $text-13;
      line-height: $leading-sm;
      color: $fg-heading;
      overflow-wrap: anywhere;
    }
  }

  &__footer {
    @include flex(center, center, $space-8, column);
    padding-top: $space-16;
  }

  &__footer-error {
    font-size: $text-12;
    color: $fg-error;
  }

  &__end {
    @include flex(center, center, $space-6);
    font-size: $text-12;
    color: $fg-body;

    :deep(.v-icon) {
      color: $fg-success;
    }
  }

  .is-spinning {
    animation: activity-spin 0.9s linear infinite;
  }

  // prazno stanje i greška
  &__state {
    @include flex(center, center, $space-8, column);
    margin-top: $space-24;
    padding: $space-40 $space-24;
    text-align: center;
    background: $surface-default;
    border: 1px dashed $border-default;
    border-radius: $radius-xl;

    .v-btn {
      margin-top: $space-8;
    }
  }

  &__state-icon {
    @include flex(center, center);
    width: 3.5rem;
    height: 3.5rem;
    margin-bottom: $space-4;
    color: $primary-500;
    background: $alpha-primary-10;
    border-radius: 50%;
  }

  &__state.is-error &__state-icon {
    color: $error-500;
    background: $alpha-red;
  }

  &__state-title {
    font-size: $text-14;
    font-weight: $weight-bold;
    color: $fg-heading;
  }

  &__state-hint {
    max-width: 22rem;
    font-size: $text-13;
    color: $fg-body;
  }

  // kostur
  &__skeleton {
    padding-top: $space-12;
  }

  &__skeleton-row {
    position: relative;
    padding-left: 2.75rem;

    & + & {
      margin-top: $space-10;
    }
  }

  &__skeleton-dot {
    position: absolute;
    top: $space-12;
    left: 0;
    width: 1.75rem;
    height: 1.75rem;
    background: $cold-100;
    border-radius: 50%;
  }

  &__skeleton-card {
    @include flex(flex-start, stretch, $space-10, column);
    padding: $space-16;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__skeleton-bar {
    height: 0.625rem;
    width: 70%;
    background: $cold-100;
    border-radius: $radius-pill;

    &.is-short {
      width: 40%;
    }

    &.is-tiny {
      width: 25%;
    }
  }

  &__skeleton-dot,
  &__skeleton-bar {
    animation: activity-pulse 1.2s ease-in-out infinite;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @include respond-to("tablet-sm") {
    &__header {
      padding: $space-8;
    }

    &__search {
      flex: 1;
      width: auto;
      min-width: 0;
    }

    &__inner {
      padding: $space-8 $space-12 $space-24;
    }
  }

  @include respond-to("mobile") {
    &__entries {
      padding-left: 2.25rem;

      &::before {
        left: calc(0.75rem - 1px);
      }
    }

    &__dot {
      left: -2.25rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    &__card {
      padding: $space-10 $space-12;
    }

    // tip izvršioca se gubi prvi, ime ostaje
    &__actor-type {
      display: none;
    }

    &__skeleton-row {
      padding-left: 2.25rem;
    }
  }
}

:root[data-theme="dark"] .activity-log__avatar:not(.is-system) {
  color: hsl(var(--avatar-hue) 70% 85%);
  background: hsl(var(--avatar-hue) 35% 28%);
}

@keyframes activity-details-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}

@keyframes activity-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes activity-pulse {
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .activity-log__details,
  .activity-log__skeleton-dot,
  .activity-log__skeleton-bar,
  .activity-log .is-spinning {
    animation: none;
  }
}
</style>
