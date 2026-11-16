<template>
  <!-- jedan izveštaj: sličica PDF strane, naziv, opis, period, autor, primaoci i preuzimanje -->
  <article class="report-card">
    <header class="report-card__top">
      <!-- mala PDF strana nacrtana u CSS-u, liči na šablon iz utils/report-pdf.js -->
      <span class="report-card__thumb" aria-hidden="true">
        <span class="report-card__thumb-band" />
        <span class="report-card__thumb-kpis"><i /><i /><i /></span>
        <span class="report-card__thumb-line" />
        <span class="report-card__thumb-line is-short" />
        <span class="report-card__thumb-badge">PDF</span>
      </span>

      <span :class="['report-card__scope', { 'is-company': report.scope === 'COMPANY' }]">
        <VIcon :name="report.scope === 'COMPANY' ? 'domain' : 'groups'" :size="14" />
        <span class="report-card__scope-text">{{ report.team }}</span>
      </span>
    </header>

    <div class="report-card__body">
      <h3 class="report-card__name" :title="script(report.name)">{{ script(report.name) }}</h3>
      <p
        v-if="report.description"
        class="report-card__description"
        :title="script(report.description)"
      >
        {{ script(report.description) }}
      </p>
    </div>

    <dl class="report-card__meta">
      <div class="report-card__meta-row">
        <dt>
          <VIcon name="date_range" :size="16" />
          <span class="visually-hidden">{{ $t("reports.card.period") }}</span>
        </dt>
        <dd>
          {{ formatDate(report.date_from, { dateOnly: true }) }} –
          {{ formatDate(report.date_to, { dateOnly: true }) }}
        </dd>
      </div>

      <div class="report-card__meta-row">
        <dt>
          <VIcon name="person" :size="16" />
          <span class="visually-hidden">{{ $t("reports.card.generated") }}</span>
        </dt>
        <dd>
          {{
            $t("reports.card.generated_by", {
              name: report.generated_by,
              date: formatDate(report.created_at)
            })
          }}
        </dd>
      </div>
    </dl>

    <footer class="report-card__footer">
      <ul
        v-if="recipients.length"
        class="report-card__avatars"
        :aria-label="$t('reports.card.recipients')"
      >
        <li
          v-for="(recipient, index) in recipients.slice(0, MAX_AVATARS)"
          :key="recipient.email"
          class="report-card__avatar"
          :title="recipient.name"
          :style="{ '--avatar-hue': hue(recipient.name), zIndex: MAX_AVATARS - index }"
        >
          {{ initials(recipient.name) }}
        </li>
        <li v-if="recipients.length > MAX_AVATARS" class="report-card__avatar-more">
          <!-- hover ili fokus na +N pokazuje ostale primaoce -->
          <VTooltip
            :title="$t('reports.other_recipients')"
            :text="
              recipients
                .slice(MAX_AVATARS)
                .map((recipient) => recipient.name)
                .join(', ')
            "
          >
            <span class="report-card__avatar is-more">+{{ recipients.length - MAX_AVATARS }}</span>
          </VTooltip>
        </li>
      </ul>
      <span v-else class="report-card__no-recipients">{{ $t("reports.card.no_recipients") }}</span>

      <VBaseButton
        size="small"
        :disabled="downloading"
        :aria-label="$t('reports.download_aria', { name: script(report.name) })"
        @click="$emit('download', report)"
      >
        <VIcon name="download" :size="16" />
        {{ downloading ? $t("reports.card.downloading") : $t("reports.card.download") }}
      </VBaseButton>
    </footer>
  </article>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";
import VTooltip from "@/components/VTooltip.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useDate } from "@/composables/useDate";
import { script } from "@/i18n";

defineProps({
  // red iz reports store-a (rows)
  report: { type: Object, required: true },
  // [{ email, name }]
  recipients: { type: Array, default: () => [] },
  downloading: { type: Boolean, default: false }
});

defineEmits(["download"]);

const MAX_AVATARS = 4;

const { formatDate } = useDate();

// email bez imena daje inicijale iz dijela prije @
const initials = (name = "") =>
  name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

// ista osoba uvijek dobije istu nijansu
const hue = (name = "") => [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
</script>

<style scoped lang="scss">
.report-card {
  @include flex(flex-start, stretch, $space-14, column);
  min-width: 0;
  padding: $space-16 $space-16 $space-14;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;
  box-shadow: $shadow-small;
  transition: $transition;

  &:hover {
    border-color: $alpha-primary-20;
    box-shadow: 0 12px 28px -18px $primary-500;
  }

  &__top {
    @include flex(space-between, flex-start, $space-12);
  }

  // mini PDF strana
  &__thumb {
    position: relative;
    @include flex(flex-start, stretch, $space-4, column);
    flex-shrink: 0;
    width: 2.75rem;
    height: 3.5rem;
    padding: 0 0 $space-4;
    overflow: hidden;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    box-shadow: 0 6px 14px -10px $primary-600;
  }

  &__thumb-band {
    height: 0.95rem;
    background: linear-gradient(140deg, $primary-400, $primary-600);
  }

  &__thumb-kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    padding: 0 $space-4;

    i {
      height: 0.3rem;
      background: $alpha-primary-20;
      border-radius: 1px;
    }
  }

  &__thumb-line {
    height: 2px;
    margin: 0 $space-4;
    background: $cold-100;
    border-radius: 1px;

    &.is-short {
      margin-right: 1rem;
    }
  }

  &__thumb-badge {
    position: absolute;
    right: 2px;
    bottom: 2px;
    padding: 0 3px;
    font-size: 0.5rem;
    font-weight: 800;
    line-height: 0.75rem;
    letter-spacing: 0.04em;
    color: $white;
    background: $primary-500;
    border-radius: 3px;
  }

  &__scope {
    @include flex(flex-start, center, $space-4);
    min-width: 0;
    max-width: 65%;
    padding: $space-2 $space-8;
    font-size: $text-11;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
    background: $surface-sunken;
    border: 1px solid $border-default;
    border-radius: $radius-pill;

    &.is-company {
      color: $fg-action;
      background: $alpha-primary-10;
      border-color: transparent;
    }
  }

  &__scope-text {
    @include truncate;
  }

  &__body {
    @include flex(flex-start, stretch, $space-4, column);
    min-width: 0;
  }

  &__name {
    @include truncate;
    font-size: $text-16;
    font-weight: $weight-bold;
    letter-spacing: -0.01em;
    color: $fg-heading;
  }

  // dva reda pa tri tačke, visina je fiksna da kartice budu poravnate
  &__description {
    display: -webkit-box;
    min-height: calc(2 * 1.125rem);
    overflow: hidden;
    font-size: $text-12;
    line-height: 1.125rem;
    color: $fg-body;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__meta {
    @include flex(flex-start, stretch, $space-6, column);
    margin: 0;
    padding: $space-10 $space-12;
    background: $surface-sunken;
    border-radius: $radius-md;
  }

  &__meta-row {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
    font-size: $text-12;
    line-height: $leading-xs;

    dt {
      display: flex;
      flex-shrink: 0;
      color: $fg-action;
    }

    // usko se prelama u drugi red umesto tri tačke
    dd {
      min-width: 0;
      margin: 0;
      color: $fg-heading;
    }
  }

  &__footer {
    @include flex(space-between, center, $space-12);
    margin-top: auto;
  }

  &__avatars {
    display: flex;
    margin: 0;
    padding: 0 0 0 $space-6;
    list-style: none;
  }

  &__avatar {
    @include flex(center, center);
    position: relative;
    width: 1.75rem;
    height: 1.75rem;
    margin-left: -$space-6;
    font-size: $text-10;
    font-weight: $weight-bold;
    color: hsl(var(--avatar-hue) 55% 35%);
    background: hsl(var(--avatar-hue) 70% 88%);
    border: 2px solid $surface-default;
    border-radius: 50%;
    cursor: default;

    &.is-more {
      color: $fg-body;
      background: $cold-75;
    }
  }

  &__avatar-more {
    display: flex;
  }

  &__no-recipients {
    font-size: $text-12;
    color: $fg-muted;
  }

  // natpis samo za čitače ekrana
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  // dark tema: avatari tamniji
  :root[data-theme="dark"] &__avatar:not(.is-more) {
    color: hsl(var(--avatar-hue) 70% 85%);
    background: hsl(var(--avatar-hue) 35% 28%);
  }
}
</style>
