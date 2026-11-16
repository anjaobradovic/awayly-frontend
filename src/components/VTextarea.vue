<template>
  <div :class="['v-textarea', { 'v-textarea--readonly': readonly }]">
    <label v-if="label" :for="textarea_id" class="v-textarea__label">
      {{ label }}
      <span v-if="required" class="v-textarea__required">*</span>
    </label>

    <textarea
      :id="textarea_id"
      v-model="model"
      class="v-textarea__control"
      :placeholder="placeholder"
      :maxlength="maxlength || undefined"
      :rows="rows"
      :readonly="readonly"
    />


    <p v-if="maxlength" class="v-textarea__counter">{{ model.length }}/{{ maxlength }}</p>
  </div>
</template>

<script setup>
import { useId } from "vue";

defineProps({
  label: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  maxlength: { type: Number, default: 0 },
  rows: { type: Number, default: 2 },
  readonly: { type: Boolean, default: false }
});

const model = defineModel({ type: String, default: "" });

const textarea_id = useId();
</script>

<style scoped lang="scss">
@layer components {
  .v-textarea {
    @include flex(flex-start, stretch, $space-6, column);
    width: 100%;

    &__label {
      font-size: $text-14;
      font-weight: $weight-semibold;
      color: $fg-heading;
    }

    &__required {
      margin-left: $space-2;
    }

    &__control {
      width: 100%;
      padding: $space-6 $space-8;
      font-family: inherit;
      font-size: $text-14;
      line-height: $leading-18;
      color: $fg-heading;
      background: $surface-default;
      border: 1px solid $border-default;
      border-radius: $radius-sm;
      outline: none;
      resize: vertical;
      transition: $transition;

      &::placeholder {
        color: $fg-body;
      }

      &:hover {
        background: $surface-default-hover;
      }

      &:focus {
        background: $surface-default;
        border-color: $border-action-focused;
      }
    }

    &__counter {
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-body;
      text-align: right;
    }

    &--readonly &__control {
      resize: none;

      &:hover {
        background: $surface-default;
      }
    }
  }
}
</style>
