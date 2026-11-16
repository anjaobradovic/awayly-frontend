<template>
  <div
    class="v-date-range-picker"
    role="dialog"
    :aria-label="title || $t('ui.date.pick_range')"
    @keydown.esc.stop="emit('cancel')"
  >
    <div class="v-date-range-picker__body">
      <p class="v-date-range-picker__title">{{ title || $t("ui.date.pick_range") }}</p>

      <div class="v-date-range-picker__inputs">
        <label v-for="field in FIELDS" :key="field.key" class="v-date-range-picker__field">
          <span class="v-date-range-picker__label">{{ $t(field.label) }}</span>
          <input
            :value="texts[field.key]"
            type="text"
            inputmode="numeric"
            class="v-date-range-picker__input"
            placeholder="DD.MM.YYYY"
            @input="texts[field.key] = $event.target.value"
            @change="typeDate(field.key)"
            @keydown.enter.prevent="typeDate(field.key)"
          />
        </label>
      </div>

      <VCalendar
        :range-start="draft.start"
        :range-end="draft.end"
        :min="min"
        :max="max"
        :focus-date="focus_date"
        muted-weekdays
        @pick="pick"
      />
    </div>

    <footer class="v-date-range-picker__footer">
      <VBaseButton appearance="outlined" color="neutral" @click="emit('cancel')">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!draft.start" @click="confirm">
        {{ confirmLabel || $t("common.actions.select") }}
      </VBaseButton>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VCalendar from "@/components/VCalendar.vue";
import {
  isOutsideLimits,
  isValidIso,
  parseShort,
  shortLabel,
  todayIso
} from "@/utils/calendar-date";

const props = defineProps({
  start: { type: String, default: "" },
  end: { type: String, default: "" },
  min: { type: String, default: "" },
  max: { type: String, default: "" },
  title: { type: String, default: "" },
  confirmLabel: { type: String, default: "" }
});

const emit = defineEmits(["update:start", "update:end", "cancel"]);

const FIELDS = [
  { key: "start", label: "ui.date.date_from" },
  { key: "end", label: "ui.date.date_to" }
];

const draft = reactive({ start: "", end: "" });
const texts = reactive({ start: "", end: "" });
const focus_date = ref("");

const syncTexts = () => {
  texts.start = shortLabel(draft.start).replace(/\.$/, "");
  texts.end = shortLabel(draft.end).replace(/\.$/, "");
};

watch(
  () => [props.start, props.end],
  ([start, end]) => {
    draft.start = isValidIso(start) ? start : "";
    draft.end = isValidIso(end) && end >= draft.start ? end : "";
    syncTexts();

    let focus = draft.start || todayIso();
    if (isValidIso(props.min) && focus < props.min) focus = props.min;
    if (isValidIso(props.max) && focus > props.max) focus = props.max;
    focus_date.value = focus;
  },
  { immediate: true }
);


function pick(iso) {
  if (!draft.start || draft.end || iso < draft.start) {
    draft.start = iso;
    draft.end = "";
  } else {
    draft.end = iso;
  }

  syncTexts();
}

function typeDate(key) {
  const iso = parseShort(texts[key]);

  if (!iso || isOutsideLimits(iso, props.min, props.max)) {
    if (!texts[key].trim()) draft[key] = "";
    syncTexts();
    return;
  }

  draft[key] = iso;
  if (draft.start && draft.end && draft.end < draft.start) {
    if (key === "start") draft.end = "";
    else draft.start = iso;
  }

  syncTexts();
  focus_date.value = iso;
}

function confirm() {
  if (!draft.start) return;

  emit("update:start", draft.start);
  emit("update:end", draft.end || draft.start);
}
</script>

<style scoped lang="scss">
@layer components {
  .v-date-range-picker {
    display: flex;
    flex-direction: column;
    width: 17.25rem;
    overflow: hidden;
    font-family: $font-family;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    box-shadow: $shadow-small;

    &__body {
      @include flex(flex-start, stretch, $space-16, column);
      padding: $space-16 $space-12;
      background: $cold-25;
    }

    &__title {
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-action;
      text-transform: uppercase;
    }

    &__inputs {
      @include flex(flex-start, stretch, $space-8, column);
    }

    &__field {
      @include flex(flex-start, stretch, $space-4, column);
    }

    &__label {
      font-size: $text-12;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    &__input {
      height: 2rem;
      padding: $space-4 $space-4 $space-4 $space-8;
      font-family: inherit;
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-heading;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-sm;
      transition: $transition;

      &::placeholder {
        color: $fg-body;
      }

      &:focus-visible {
        outline: none;
        border-color: $border-action-focused;
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
