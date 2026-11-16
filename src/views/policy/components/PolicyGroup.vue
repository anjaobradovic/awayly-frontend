<template>
  <!-- jedan odeljak polise: zaglavlje sa ikonicom u boji grupe, pa grupe redova -->
  <section
    :id="`policy-${section.key}`"
    class="policy-group"
    :style="{ '--section-accent': resolveColor(section.accent) }"
    :aria-labelledby="`policy-${section.key}-title`"
  >
    <header class="policy-group__header">
      <span class="policy-group__icon" aria-hidden="true">
        <VIcon :name="section.icon" :size="20" />
      </span>
      <div class="policy-group__heading">
        <h2 :id="`policy-${section.key}-title`" class="policy-group__title">
          {{ $t(section.title) }}
        </h2>
        <p class="policy-group__text">{{ $t(section.text) }}</p>
      </div>
      <span v-if="editing && changes" class="policy-group__count">
        {{ $t("policy.bar.changes", { count: changes }) }}
      </span>
    </header>

    <div class="policy-group__cards">
      <PolicyCard
        v-for="card in section.cards"
        :key="card.key"
        :title="card.title ? $t(card.title) : ''"
        :icon="card.icon"
      >
        <PolicyField
          v-for="field in card.fields"
          :key="field.key"
          v-model:form="form"
          :field="field"
          :original="original"
          :editing="editing"
        />
      </PolicyCard>
    </div>
  </section>
</template>

<script setup>
import VIcon from "@/components/VIcon.vue";
import PolicyCard from "./PolicyCard.vue";
import PolicyField from "./PolicyField.vue";
import { resolveColor } from "@/utils/color";

defineProps({
  // odeljak iz POLICY_SECTIONS
  section: { type: Object, required: true },
  original: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  // broj izmijenjenih polja u odeljku
  changes: { type: Number, default: 0 }
});

const form = defineModel("form", { type: Object, required: true });
</script>

<style scoped lang="scss">
.policy-group {
  @include flex(flex-start, stretch, $space-16, column);
  min-width: 0;
  padding: $space-20;
  background:
    radial-gradient(
      90% 70% at 100% 0%,
      color-mix(in srgb, var(--section-accent) 7%, transparent) 0%,
      transparent 55%
    ),
    $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xl;
  box-shadow: $shadow-small;
  // nav skroluje do odeljka, ostavi malo mjesta iznad
  scroll-margin-top: $space-16;

  &__header {
    @include flex(flex-start, flex-start, $space-12);
  }

  &__icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--section-accent);
    background: color-mix(in srgb, var(--section-accent) 15%, transparent);
    border-radius: 50%;
  }

  &__heading {
    flex: 1;
    min-width: 0;
    padding-top: $space-2;
  }

  &__title {
    font-size: $text-18;
    font-weight: $weight-bold;
    line-height: $leading-sm;
    letter-spacing: -0.01em;
    color: $fg-heading;
  }

  &__text {
    margin-top: $space-2;
    font-size: $text-13;
    line-height: $leading-sm;
    color: $fg-body;
  }

  &__count {
    flex-shrink: 0;
    margin-top: $space-4;
    padding: $space-2 $space-10;
    font-size: $text-12;
    font-weight: $weight-bold;
    line-height: $leading-xs;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__cards {
    @include flex(flex-start, stretch, $space-16, column);
  }

  @include respond-to("tablet") {
    // horizontalna traka sa čipovima je iznad
    scroll-margin-top: 4.5rem;
  }

  @include respond-to("mobile") {
    gap: $space-12;
    padding: $space-14;

    &__icon {
      width: 2.25rem;
      height: 2.25rem;
    }

    &__title {
      font-size: $text-16;
    }
  }
}
</style>
