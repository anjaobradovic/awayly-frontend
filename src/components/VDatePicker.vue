<template>
  <div
    class="v-date-picker"
    role="dialog"
    :aria-label="title || $t('ui.date.pick')"
    @keydown.esc.stop="emit('cancel')"
  >
    <header class="v-date-picker__top">
      <span class="v-date-picker__title">{{ title || $t("ui.date.pick") }}</span>
      <button
        type="button"
        class="v-date-picker__close"
        :aria-label="$t('common.actions.close')"
        @click="emit('cancel')"
      >
        <VIcon name="close" :size="18" />
      </button>
    </header>

    <div class="v-date-picker__body">
      <p :class="['v-date-picker__selected', { 'is-empty': !draft }]">
        {{ draft ? longLabel(draft) : $t("ui.date.pick") }}
      </p>

      <VCalendar
        :selected="draft"
        :min="min"
        :max="max"
        :focus-date="focus_date"
        @pick="draft = $event"
      />
    </div>

    <footer class="v-date-picker__footer">
      <VBaseButton appearance="outlined" color="neutral" @click="emit('cancel')">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!draft" @click="confirm">{{ $t("ui.date.ok") }}</VBaseButton>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import VIcon from "@/components/VIcon.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VCalendar from "@/components/VCalendar.vue";
import { isValidIso, longLabel, todayIso } from "@/utils/calendar-date";

const props = defineProps({
  // YYYY-MM-DD, prazno ako nije izabran
  modelValue: { type: String, default: "" },
  min: { type: String, default: "" },
  max: { type: String, default: "" },
  title: { type: String, default: "" }
});

// vrijednost se salje tek na ok, klik na dan samo mijenja izbor
const emit = defineEmits(["update:modelValue", "cancel"]);

const draft = ref("");
const focus_date = ref("");

// otvara se na izabranom datumu, danasnjem ili najblizoj granici
watch(
  () => props.modelValue,
  (value) => {
    draft.value = isValidIso(value) ? value : "";

    let start = draft.value || todayIso();
    if (isValidIso(props.min) && start < props.min) start = props.min;
    if (isValidIso(props.max) && start > props.max) start = props.max;

    focus_date.value = start;
  },
  { immediate: true }
);

function confirm() {
  if (draft.value) emit("update:modelValue", draft.value);
}
</script>

<style scoped lang="scss">
@layer components {
  .v-date-picker {
    display: flex;
    flex-direction: column;
    width: 17.5rem;
    font-family: $font-family;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    box-shadow: $shadow-menu;

    &__top {
      @include flex(space-between, center, $space-4);
      height: 2.5rem;
      padding: 0 $space-12;
      border-bottom: 1px solid $border-default;
    }

    &__title {
      @include truncate;
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    &__close {
      @include flex(center, center);
      flex-shrink: 0;
      padding: 0;
      color: $fg-heading;
      background: transparent;
      border: none;
      border-radius: $radius-xs;
      cursor: pointer;

      &:hover {
        background: $cold-75;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }

    &__body {
      @include flex(flex-start, stretch, $space-24, column);
      padding: $space-16;
      background: $cold-25;
    }

    &__selected {
      font-size: $text-24;
      font-weight: $weight-semibold;
      line-height: $leading-md;
      color: $fg-heading;

      &.is-empty {
        color: $fg-body;
      }
    }

    &__footer {
      @include flex(flex-end, center, $space-16);
      height: 3rem;
      padding: 0 $space-12;
      border-top: 1px solid $border-default;
    }
  }
}
</style>
