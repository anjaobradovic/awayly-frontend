<template>
  <div ref="root_ref" :class="['v-date-range-input', { 'is-open': is_open }]">
    <label
      v-if="label"
      :id="label_id"
      class="v-date-range-input__label"
      @click="field_ref?.focus()"
    >
      {{ label }}
      <span v-if="required" class="v-date-range-input__required">*</span>
    </label>

    <!-- jedno polje za cijeli period, otvara VDateRangePicker -->
    <div class="v-date-range-input__field">
      <button
        ref="field_ref"
        type="button"
        :class="['v-date-range-input__control', { 'is-placeholder': !start }]"
        aria-haspopup="dialog"
        :aria-expanded="is_open"
        :aria-labelledby="label ? label_id : undefined"
        @click="toggle"
        @keydown.down.prevent="open"
      >
        {{ start ? `${shortLabel(start)} - ${shortLabel(end || start)}` : placeholder }}
      </button>

      <VIcon class="v-date-range-input__icon" :name="icon" :size="18" color="fg-action" />
    </div>

    <Transition name="fade2x">
      <VDateRangePicker
        v-if="is_open"
        ref="picker_ref"
        :class="['v-date-range-input__picker', `is-align-${align}`, { 'is-up': opens_up }]"
        :style="{ translate: `0 ${shift_y}px` }"
        :start="start"
        :end="end"
        :min="min"
        :max="max"
        :title="pickerTitle || $t('ui.date.pick_range')"
        @update:start="start = $event"
        @update:end="select"
        @cancel="close({ focus: true })"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, useId } from "vue";
import VIcon from "@/components/VIcon.vue";
import VDateRangePicker from "@/components/VDateRangePicker.vue";
import { useClickOutside } from "@/composables/useClickOutside";
import { useDropdownPlacement } from "@/composables/useDropdownPlacement";
import { shortLabel } from "@/utils/calendar-date";

const props = defineProps({
  label: { type: String, default: "" },
  min: { type: String, default: "" },
  max: { type: String, default: "" },
  icon: { type: String, default: "calendar_month" },
  placeholder: { type: String, default: "DD.MM.YYYY - DD.MM.YYYY" },
  pickerTitle: { type: String, default: "" },
  // kalendar stoji uz desnu ivicu polja, ispod ikonice
  align: {
    type: String,
    default: "right",
    validator: (value) => ["left", "right"].includes(value)
  },
  required: { type: Boolean, default: false }
});

// "YYYY-MM-DD", v-model:start i v-model:end
const start = defineModel("start", { type: String, default: "" });
const end = defineModel("end", { type: String, default: "" });

const label_id = `${useId()}-label`;

const root_ref = ref(null);
const field_ref = ref(null);
const picker_ref = ref(null);

const is_open = ref(false);

useClickOutside(root_ref, () => close());

// visina kalendara za period
const { opens_up, shift_y, place } = useDropdownPlacement(root_ref, 486);

async function open() {
  if (is_open.value) return;

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

// Odaberi šalje start pa end, kalendar se zatvara poslije kraja
function select(value) {
  end.value = value;
  close({ focus: true });
}
</script>

<style scoped lang="scss">
@layer components {
  .v-date-range-input {
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
      @include truncate;
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
      z-index: $z-dropdown;

      &.is-align-left {
        left: 0;
      }

      &.is-align-right {
        right: 0;
      }

      &.is-up {
        top: auto;
        bottom: calc(100% + #{$space-4});
      }
    }
  }
}
</style>
