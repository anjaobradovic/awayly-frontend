<template>
  <div ref="root_ref" :class="['v-date-input', { 'is-open': is_open }]">
    <label v-if="label" :id="label_id" class="v-date-input__label" @click="field_ref?.focus()">
      {{ label }}
      <span v-if="required" class="v-date-input__required">*</span>
    </label>

    <div class="v-date-input__field">
      <button
        ref="field_ref"
        type="button"
        :class="['v-date-input__control', { 'is-placeholder': !model, 'is-readonly': readonly }]"
        aria-haspopup="dialog"
        :aria-expanded="is_open"
        :aria-labelledby="label ? label_id : undefined"
        :aria-readonly="readonly || undefined"
        @click="toggle"
        @keydown.down.prevent="open"
      >
        {{ model ? shortLabel(model) : placeholder }}
      </button>

      <VIcon class="v-date-input__icon" :name="icon" :size="18" color="fg-action" />
    </div>

    <Transition name="fade2x">
      <VDatePicker
        v-if="is_open"
        ref="picker_ref"
        :style="{ translate: `0 ${shift_y}px` }"
        :class="['v-date-input__picker', { 'is-up': opens_up }]"
        :model-value="model"
        :min="min"
        :max="max"
        :title="label || $t('ui.date.pick')"
        @update:model-value="select"
        @cancel="close({ focus: true })"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, useId } from "vue";
import VIcon from "@/components/VIcon.vue";
import VDatePicker from "@/components/VDatePicker.vue";
import { useClickOutside } from "@/composables/useClickOutside";
import { useDropdownPlacement } from "@/composables/useDropdownPlacement";
import { shortLabel } from "@/utils/calendar-date";

const props = defineProps({
  label: { type: String, default: "" },
  min: { type: String, default: "" },
  max: { type: String, default: "" },
  icon: { type: String, default: "calendar_month" },
  placeholder: { type: String, default: "DD.MM.YYYY." },
  readonly: { type: Boolean, default: false },
  required: { type: Boolean, default: false }
});

const model = defineModel({ type: String, default: "" });

const label_id = `${useId()}-label`;

const root_ref = ref(null);
const field_ref = ref(null);
const picker_ref = ref(null);

const is_open = ref(false);

useClickOutside(root_ref, () => close());

const { opens_up, shift_y, place } = useDropdownPlacement(root_ref, 418);

async function open() {
  if (is_open.value || props.readonly) return;

  is_open.value = true;
  await place(field_ref.value, () => picker_ref.value?.$el);
}

function close({ focus = false } = {}) {
  if (!is_open.value) return;

  is_open.value = false;
  if (focus) field_ref.value?.focus();
}

function toggle() {
  if (is_open.value) close();
  else open();
}

function select(value) {
  model.value = value;
  close({ focus: true });
}
</script>

<style scoped lang="scss">
@layer components {
  .v-date-input {
    position: relative;
    @include flex(flex-start, stretch, $space-4, column);
    width: 100%;
    font-family: $font-family;

    &__label {
      font-size: $text-12;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    &__required {
      margin-left: $space-2;
    }

    &__field {
      position: relative;
    }

    &__control {
      width: 100%;
      height: 2rem;
      padding: $space-4 2rem $space-4 $space-8;
      font-family: inherit;
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-heading;
      text-align: left;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-sm;
      cursor: pointer;
      transition: $transition;

      &:hover {
        background: $surface-default-hover;
      }

      &:focus-visible {
        outline: none;
        border-color: $border-action-focused;
      }

      &.is-readonly {
        cursor: default;

        &:hover {
          background: $surface-default;
        }
      }

      &.is-placeholder {
        color: $fg-body;
      }
    }

    &.is-open &__control {
      border-color: $border-action-focused;
    }

    &__icon {
      position: absolute;
      top: 50%;
      right: $space-8;
      transform: translateY(-50%);
      pointer-events: none;
    }

    &__picker {
      position: absolute;
      top: calc(100% + #{$space-4});
      left: 0;
      z-index: $z-dropdown;

      &.is-up {
        top: auto;
        bottom: calc(100% + #{$space-4});
      }
    }
  }
}
</style>
