<template>
  <div
    ref="root_ref"
    :class="['v-select', `v-select--${appearance}`, `v-select--${size}`, { 'is-open': is_open }]"
  >
    <label v-if="label" :id="label_id" class="v-select__label" @click="trigger_ref?.focus()">
      {{ label }}
      <span v-if="optional" class="v-select__label-hint">({{ $t("common.optional") }})</span>
    </label>

    <!-- svoje polje i lista umjesto <select>, da izgleda isto u svakom browseru -->
    <div class="v-select__control">
      <button
        ref="trigger_ref"
        type="button"
        :class="['v-select__field', { 'is-placeholder': !selected_option, 'has-clear': show_clear }]"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="is_open"
        :aria-controls="list_id"
        :aria-labelledby="label ? label_id : undefined"
        :aria-activedescendant="is_open && active_index >= 0 ? optionId(active_index) : undefined"
        @click="toggle"
        @keydown="onKeydown"
      >
        <VIcon v-if="leadingIcon" class="v-select__leading" :name="leadingIcon" :size="18" filled />
        <span class="v-select__value">{{ selected_option?.label ?? placeholder }}</span>
        <VIcon class="v-select__icon" :name="icon" :size="18" :color="iconColor" />
      </button>

      <!-- X briše izbor, dugme je van polja jer button ne smije u button -->
      <button
        v-if="show_clear"
        type="button"
        class="v-select__clear"
        :aria-label="$t('ui.select.clear')"
        @click="clear"
      >
        <VIcon name="close" :size="18" />
      </button>
    </div>

    <Transition name="fade2x">
      <ul
        v-if="is_open"
        :id="list_id"
        ref="list_ref"
        :class="['v-select__list', { 'v-select__list--up': opens_up }]"
        role="listbox"
        :aria-labelledby="label ? label_id : undefined"
      >
        <li
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="option.value"
          :class="[
            'v-select__option',
            { 'is-active': index === active_index, 'is-selected': option.value === model }
          ]"
          role="option"
          :aria-selected="option.value === model"
          @click="select(option)"
          @mousemove="active_index = index"
        >
          {{ option.label }}
        </li>

        <li v-if="!options.length" class="v-select__empty">{{ $t("ui.select.empty") }}</li>
      </ul>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, useId } from "vue";
import VIcon from "@/components/VIcon.vue";
import { useClickOutside } from "@/composables/useClickOutside";

const props = defineProps({
  label: { type: String, default: "" },
  optional: { type: Boolean, default: false },
  placeholder: { type: String, default: "" },
  options: {
    type: Array,
    required: true,
    validator: (list) => list.every((option) => "value" in option && "label" in option)
  },

  icon: { type: String, default: "expand_more" },
  // ikonica ispred vrijednosti
  leadingIcon: { type: String, default: "" },
  // header je za kontrole u headeru, inače forma
  size: {
    type: String,
    default: "default",
    validator: (value) => ["default", "header"].includes(value)
  },
  iconColor: { type: String, default: "" },
  clearable: { type: Boolean, default: false },
  // outlined = okvir, underlined = samo donja linija
  appearance: {
    type: String,
    default: "outlined",
    validator: (value) => ["outlined", "underlined"].includes(value)
  }
});

// null = ništa nije izabrano (prikazuje se placeholder)
const model = defineModel({ type: [String, Number], default: null });

const id = useId();
const label_id = `${id}-label`;
const list_id = `${id}-list`;
const optionId = (index) => `${id}-option-${index}`;

const root_ref = ref(null);
const trigger_ref = ref(null);
const list_ref = ref(null);

const is_open = ref(false);
const opens_up = ref(false);
// opcija označena mišem ili strelicama (Enter je bira)
const active_index = ref(-1);

const selected_option = computed(
  () => props.options.find((option) => option.value === model.value) ?? null
);

const show_clear = computed(() => props.clearable && selected_option.value !== null);

// lista je absolute, ne Teleport, da klik na opciju ostane unutar pop-upa
useClickOutside(root_ref, () => close());

// max-height liste iz CSS-a, da znamo da li lista ide gore
const LIST_MAX_HEIGHT = 210;

async function open() {
  if (is_open.value) return;

  // ako ispod nema mjesta, lista se otvara iznad
  const rect = trigger_ref.value.getBoundingClientRect();
  const space_below = window.innerHeight - rect.bottom;
  opens_up.value = space_below < LIST_MAX_HEIGHT && rect.top > space_below;

  active_index.value = props.options.findIndex((option) => option.value === model.value);
  is_open.value = true;

  await nextTick();
  scrollToActive();
}

function close({ focus = false } = {}) {
  if (!is_open.value) return;

  is_open.value = false;
  if (focus) trigger_ref.value?.focus();
}

function toggle() {
  if (is_open.value) close();
  else open();
}

function clear() {
  model.value = null;
  close();
  trigger_ref.value?.focus();
}

function select(option) {
  model.value = option.value;
  close({ focus: true });
}

function moveActive(step) {
  const count = props.options.length;
  if (!count) return;

  active_index.value = (active_index.value + step + count) % count;
  scrollToActive();
}

function scrollToActive() {
  list_ref.value?.children[active_index.value]?.scrollIntoView({ block: "nearest" });
}

// tastatura kao kod običnog <select>
function onKeydown(event) {
  switch (event.key) {
    case "ArrowDown":
    case "ArrowUp":
      event.preventDefault();
      if (!is_open.value) open();
      else moveActive(event.key === "ArrowDown" ? 1 : -1);
      break;

    case "Enter":
    case " ":
      event.preventDefault();
      if (!is_open.value) open();
      else if (active_index.value >= 0) select(props.options[active_index.value]);
      break;

    case "Escape":
      // zatvara samo listu, ne i pop-up/panel u kome se nalazi
      if (!is_open.value) return;
      event.stopPropagation();
      close();
      break;

    case "Tab":
      close();
      break;
  }
}
</script>

<style scoped lang="scss">
@layer components {
  .v-select {
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

    &__label-hint {
      font-weight: $weight-regular;
      font-style: italic;
      color: $fg-body;
    }

    // zatvoreno: okvir sa zaobljenim uglovima
    &__field {
      @include flex(space-between, center, $space-4);
      width: 100%;
      height: 2rem;
      padding: $space-4 $space-4 $space-4 $space-8;
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

    &__control {
      position: relative;
    }

    // x se vidi samo na hover ili fokus
    &__clear {
      visibility: hidden;
    }

    &__control:hover &__clear,
    &__control:focus-within &__clear {
      visibility: visible;
    }

    // mjesto za X i crtu pored strelice
    &--header &__field {
      height: $size-header;
    }

    &__leading {
      flex-shrink: 0;
      color: $fg-heading;
    }

    &__field.has-clear &__value {
      margin-right: $space-32;
    }

    // X, pa crta, pa strelica
    &__clear {
      position: absolute;
      top: 50%;
      right: $space-32;
      @include flex(center, center);
      padding: 0 $space-4 0 0;
      color: $fg-heading;
      background: transparent;
      border: none;
      border-right: 1px solid $border-default;
      transform: translateY(-50%);
      cursor: pointer;

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }

    &__value {
      @include truncate;
      flex: 1;
      min-width: 0;
    }

    &__icon {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      @include flex(center, center);
    }

    // underlined: samo donja linija i tamniji tekst
    &--underlined &__field {
      border-color: transparent;
      border-bottom-color: $border-stroke;
      border-radius: 0;

      &.is-placeholder {
        color: $fg-heading;
      }

      &:focus-visible {
        border-color: transparent;
        border-bottom-color: $border-action-focused;
      }
    }

    // otvoreno: samo donja linija, tamniji tekst
    &.is-open &__field {
      color: $fg-heading;
      background: $surface-default;
      border-color: transparent;
      border-bottom-color: $border-stroke;
      border-radius: 0;
    }

    // lista ispod polja, iste širine
    &__list {
      position: absolute;
      top: calc(100% + #{$space-4});
      right: 0;
      left: 0;
      z-index: $z-dropdown;
      max-height: 13.125rem; // isto kao LIST_MAX_HEIGHT u skripti
      margin: 0;
      padding: 0;
      overflow-y: auto;
      list-style: none;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-sm;
      box-shadow: $shadow-menu;

      &--up {
        top: auto;
        bottom: calc(100% + #{$space-4});
      }
    }

    &__option,
    &__empty {
      padding: $space-12;
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-heading;
      border-bottom: 1px solid $border-default;

      &:last-child {
        border-bottom: none;
      }
    }

    &__option {
      cursor: pointer;

      &.is-active {
        background: $surface-default-hover;
      }
    }

    &__empty {
      color: $fg-body;
    }
  }
}
</style>
