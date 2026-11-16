<template>
  <li class="org-node">
    <div
      :id="`hierarchy-node-${node.id}`"
      :class="[
        'org-node__card',
        { 'is-match': is_match, 'is-selected': is_selected, 'is-pending': is_pending }
      ]"
    >
      <button
        type="button"
        class="org-node__main"
        :aria-label="$t('hierarchy.open_person', { name: node.name })"
        @click="emit('select', node.id)"
      >
        <span class="org-node__avatar" aria-hidden="true">{{ node.initials }}</span>

        <span class="org-node__info">
          <span class="org-node__name">{{ node.name }}</span>
          <span class="org-node__position">{{ node.position || $t("hierarchy.no_position") }}</span>
          <span class="org-node__meta">
            <span class="org-node__team">{{ script(node.team) || $t("hierarchy.no_team") }}</span>
            <span v-if="is_pending" class="org-node__badge">{{ $t("hierarchy.pending_invite") }}</span>
          </span>
        </span>
      </button>

      <button
        v-if="reports.length"
        type="button"
        class="org-node__toggle"
        :aria-expanded="is_expanded"
        :aria-label="
          $t(is_expanded ? 'hierarchy.collapse' : 'hierarchy.expand', { name: node.name })
        "
        @click="hierarchy_store.toggle(node.id)"
      >
        <VIcon name="group" :size="14" />
        {{ $t("hierarchy.reports", { count: reports.length }) }}
        <VIcon class="org-node__chevron" name="expand_more" :size="16" />
      </button>
    </div>

    <ul v-if="is_expanded && children.length" class="org-node__children">
      <HierarchyNode
        v-for="child in children"
        :key="child.id"
        :node="child"
        @select="emit('select', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { computed } from "vue";
import VIcon from "@/components/VIcon.vue";
import { script } from "@/i18n";
import { useHierarchyStore } from "@/stores/hierarchy";

const props = defineProps({
  // čvor iz hierarchy store-a
  node: { type: Object, required: true }
});

const emit = defineEmits(["select"]);

const hierarchy_store = useHierarchyStore();

const reports = computed(() => hierarchy_store.reportsOf(props.node.id));
const children = computed(() => hierarchy_store.visibleChildrenOf(props.node.id));

const is_expanded = computed(() => hierarchy_store.expanded_ids.includes(props.node.id));
const is_match = computed(() => hierarchy_store.match_ids.includes(props.node.id));
const is_selected = computed(() => hierarchy_store.selected_id === props.node.id);
const is_pending = computed(() => props.node.status === "PENDING_INVITE");
</script>

<style scoped lang="scss">
// razmak između nivoa, linije se crtaju u njemu
$gap: $space-24;
$line: 1px solid $border-stroke;

.org-node {
  position: relative;

  &__card {
    position: relative;
    @include flex(flex-start, stretch, 0, column);
    overflow: hidden;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
    box-shadow: $shadow-small;
    transition: $transition;

    &:hover {
      border-color: $cold-225;
    }

    // pogodak pretrage
    &.is-match {
      border-color: $border-action;
      box-shadow: 0 0 0 3px $alpha-primary-20;
    }

    &.is-selected {
      border-color: $border-action;
    }

    &.is-pending {
      border-style: dashed;
    }
  }

  &__main {
    @include flex(flex-start, center, $space-12);
    width: 100%;
    padding: $space-12;
    font-family: $font-family;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;

    &:hover {
      background: $surface-default-hover;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: -1px;
    }
  }

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: $space-40;
    height: $space-40;
    font-size: $text-14;
    font-weight: $weight-semibold;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__card.is-match &__avatar {
    color: $fg-on-action;
    background: $surface-action;
  }

  &__info {
    @include flex(flex-start, stretch, $space-2, column);
    min-width: 0;
  }

  &__name {
    @include truncate;
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__position {
    @include truncate;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__meta {
    @include flex(flex-start, center, $space-6);
    min-width: 0;
    margin-top: $space-2;
  }

  &__team {
    @include truncate;
    font-size: $text-11;
    font-weight: $weight-medium;
    line-height: $leading-xs;
    color: $fg-action;
  }

  &__badge {
    flex-shrink: 0;
    padding: 0 $space-6;
    font-size: $text-10;
    line-height: $leading-xs;
    color: $fg-warning;
    background: $surface-warning;
    border-radius: $radius-pill;
  }

  &__toggle {
    @include flex(center, center, $space-4);
    width: 100%;
    padding: $space-4 $space-8;
    font-family: $font-family;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    background: $cold-25;
    border: 0;
    border-top: 1px solid $border-default;
    cursor: pointer;

    &:hover {
      color: $fg-action;
      background: $surface-default-hover;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: -1px;
    }

    &[aria-expanded="true"] .org-node__chevron {
      transform: rotate(180deg);
    }
  }

  &__chevron {
    transition: transform 0.2s ease;
  }
}

// dijagram: čvorovi odozgo nadole, linije preko ::before / ::after
.org-tree--chart {
  .org-node {
    @include flex(flex-start, center, 0, column);
    padding: $gap $space-8 0;

    // vodoravna linija do braće i uspravna do kartice
    &::before,
    &::after {
      position: absolute;
      top: 0;
      right: 50%;
      width: 50%;
      height: $gap;
      content: "";
      border-top: $line;
    }

    &::after {
      right: auto;
      left: 50%;
      border-left: $line;
    }

    &:first-child::before,
    &:last-child::after {
      border: 0;
    }

    &:last-child::before {
      border-right: $line;
      border-top-right-radius: $radius-sm;
    }

    &:first-child::after {
      border-top-left-radius: $radius-sm;
    }

    &:only-child::before {
      display: none;
    }

    &:only-child::after {
      border-top: 0;
      border-radius: 0;
    }
  }

  .org-node__card {
    width: 15rem;
  }

  .org-node__children {
    position: relative;
    display: flex;
    justify-content: center;
    padding-top: $gap;

    // linija od roditelja do vodoravne linije
    &::before {
      position: absolute;
      top: 0;
      left: 50%;
      height: $gap;
      content: "";
      border-left: $line;
    }
  }
}

// korijeni nemaju liniju iznad sebe
.org-tree--chart > .org-node {
  padding-top: 0;

  &::before,
  &::after {
    display: none;
  }
}

// lista: uvučeno, linije lijevo
.org-tree--list {
  .org-node {
    padding-top: $space-8;
  }

  .org-node__card {
    max-width: 32rem;
  }

  .org-node__children {
    margin-left: $space-20;
    padding-left: $space-20;

    // vodoravna linija do sredine avatara
    > .org-node::before {
      position: absolute;
      top: $space-40;
      left: -$space-20;
      width: $space-20;
      content: "";
      border-top: $line;
    }

    // uspravna linija, kod posljednjeg djeteta staje na njemu
    > .org-node::after {
      position: absolute;
      top: 0;
      bottom: 0;
      left: -$space-20;
      content: "";
      border-left: $line;
    }

    > .org-node:last-child::after {
      bottom: auto;
      height: $space-40;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .org-node__card,
  .org-node__chevron {
    transition: none;
  }
}
</style>
