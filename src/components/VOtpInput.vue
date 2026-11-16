<script setup>
import { ref, watch, computed, onMounted } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },

  length: { type: Number, default: 6 },

  error: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue", "complete"]);

const digits = ref(Array.from({ length: props.length }, (_, i) => props.modelValue[i] ?? ""));

const inputs = ref([]);

watch(
  () => props.modelValue,
  (val) => {
    digits.value = Array.from({ length: props.length }, (_, i) => val[i] ?? "");
  }
);

const joined = computed(() => digits.value.join(""));

onMounted(() => {
  if (props.autofocus) focusInput(0);
});

function focusInput(index) {
  const el = inputs.value[index];
  if (el) {
    el.focus();
    el.select();
  }
}

// Zajednička funkcija: upiši cifre i obavesti roditelja
function commit() {
  emit("update:modelValue", joined.value);
  if (joined.value.length === props.length) {
    emit("complete", joined.value);
  }
}

// Upiši više cifara odjednom, počevši od `start` kvadrata
function fillFrom(start, text) {
  const chars = text.slice(0, props.length - start).split("");
  chars.forEach((char, i) => {
    digits.value[start + i] = char;
  });
  commit();

  focusInput(Math.min(start + chars.length, props.length - 1));
}

function onInput(e, index) {
  const value = e.target.value.replace(/\D/g, "");

  if (value.length > 1) {
    e.target.value = digits.value[index];
    fillFrom(index, value);
    return;
  }

  digits.value[index] = value;
  e.target.value = value;
  commit();

  // Automatski skoči na sledeći kvadrat
  if (value && index < props.length - 1) {
    focusInput(index + 1);
  }
}

function onKeydown(e, index) {
  if (e.key === "Backspace") {
    if (digits.value[index]) {
      digits.value[index] = "";
      commit();
    } else if (index > 0) {
      digits.value[index - 1] = "";
      commit();
      focusInput(index - 1);
    }
    e.preventDefault();
  } else if (e.key === "ArrowLeft" && index > 0) {
    focusInput(index - 1);
    e.preventDefault();
  } else if (e.key === "ArrowRight" && index < props.length - 1) {
    focusInput(index + 1);
    e.preventDefault();
  }
}

function onPaste(e, index) {
  e.preventDefault();
  const text = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "");
  if (!text) return;


  fillFrom(text.length >= props.length ? 0 : index, text);
}
</script>

<template>
  <div
    :class="['v-otp', { 'is-error': error, 'is-disabled': disabled }]"
    role="group"
    :aria-label="$t('ui.otp.label')"
  >
    <input
      v-for="(digit, index) in digits"
      :key="index"
      :ref="(el) => (inputs[index] = el)"
      :class="['v-otp__box', { 'is-filled': digit }]"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      :value="digit"
      :disabled="disabled"
      :aria-invalid="error || undefined"
      :aria-label="`Cifra ${index + 1} od ${length}`"
      @input="onInput($event, index)"
      @keydown="onKeydown($event, index)"
      @paste="onPaste($event, index)"
      @focus="$event.target.select()"
    />
  </div>
</template>

<style scoped lang="scss">
@layer components {
  .v-otp {
    @include flex(center, center, $space-16);

    &__box {
      width: $size-large;
      height: $size-large;
      min-width: 0;
      border: 1px solid $border-stroke;
      border-radius: $radius-sm;
      background: $surface-default;
      color: $fg-heading;
      font-size: $text-24;
      font-weight: $weight-semibold;
      line-height: $leading-md;
      text-align: center;
      outline: none;
      caret-color: $border-action;
      transition: $transition;

      &.is-filled {
        border-color: $border-default;
      }

      &:focus {
        border-color: $border-action;
      }

      &:disabled {
        color: $fg-action-disabled;
        border-color: $border-default;
        cursor: not-allowed;
      }
    }

    &.is-error &__box {
      border-color: $border-error;
    }

    @include respond-to("mobile-sm") {
      gap: $space-8;
    }

    @media (prefers-reduced-motion: reduce) {
      &__box {
        transition: none;
      }
    }
  }
}
</style>
