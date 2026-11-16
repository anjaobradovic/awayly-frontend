<template>
  <!-- po jedna kartica za svaku grupu tipova odsustva -->
  <div class="calendar-summary">
    <div class="calendar-summary__cards">
      <VStatCard
        v-for="group in groups"
        :key="group.key"
        :title="group.title"
        :accent="group.accent"
      >
        <VStatItem
          v-for="type in group.types"
          :key="type.name"
          :class="{ 'is-selected': type.name === selected_source }"
          :icon="type.icon"
          :label="script(type.label)"
          :count="type.count"
          :accent="group.accent"
          :aria-pressed="type.name === selected_source"
          @click="emit('select', type.name)"
        />
      </VStatCard>
    </div>
  </div>
</template>

<script setup>
import VStatCard from "@/components/VStatCard.vue";
import VStatItem from "@/components/VStatItem.vue";
import { computed } from "vue";
import { script } from "@/i18n";
import { leaveTypeSourceName } from "@/utils/leave-type-name";

const props = defineProps({
  // [{ key, title, accent, types: [{ name, label, icon, count }] }]
  groups: { type: Array, required: true },
  // tip po kom je kalendar filtriran, ili null
  selected: { type: String, default: null }
});

const emit = defineEmits(["select"]);

// izabrani tip može stići na bilo kom jeziku, poredimo srpske nazive
const selected_source = computed(() => props.selected && leaveTypeSourceName(props.selected));
</script>

<style scoped lang="scss">
.calendar-summary {
  padding: $space-16 $space-16 0;


  &__cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $space-16;
    padding: $space-12;
    background: $surface-default;
    border: 1px solid $border-default;
    border-bottom: none;
    border-radius: $radius-xs;
  }


  :deep(.v-stat-item.is-selected .v-stat-item__label) {
    color: $fg-action;
  }

  @include respond-to("laptop-sm") {
    &__cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @include respond-to("tablet-sm") {
    padding: $space-8 $space-8 0;

    &__cards {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
