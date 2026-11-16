<template>
  <div class="v-table" role="table">
    <div class="v-table__scroll">
      <div class="v-table__content" :style="{ minWidth: content_min_width }">
        <div class="v-table__head" role="row">
          <div
            v-for="column in columns"
            :key="column.key"
            class="v-table__cell v-table__cell--head"
            :style="cellStyle(column)"
            role="columnheader"
            :aria-sort="ariaSort(column)"
          >
            <slot :name="`head-${column.key}`" :column="column">
              <span :class="['v-table__label', { 'is-nowrap': column.nowrap }]">
                {{ column.label }}
              </span>
            </slot>

            <!-- sort, dva trougla -->
            <span v-if="column.sortable" :class="['v-table__sort', sortClass(column)]">
              <button
                v-for="arrow in SORT_ARROWS"
                :key="arrow.direction"
                type="button"
                :class="['v-table__sort-arrow', `is-${arrow.direction}`]"
                :aria-label="$t(arrow.label, { column: column.label })"
                :aria-pressed="isSorted(column, arrow.direction)"
                @click="setSort(column, arrow.direction)"
              >
                <svg width="16" height="8" :viewBox="arrow.view_box" aria-hidden="true">
                  <path :d="arrow.path" />
                </svg>
              </button>
            </span>
          </div>
          <span v-if="$slots.actions" class="v-table__cell v-table__cell--actions" />
        </div>

        <div class="v-table__body">
          <p v-if="!rows.length" class="v-table__empty">{{ emptyText || $t("ui.table.empty") }}</p>

          <!-- clickable, cijeli red otvara detalje (mis, enter ili razmak) -->
          <div
            v-for="(row, index) in rows"
            :key="row[rowKey] ?? index"
            :class="['v-table__row', { 'is-clickable': clickable }, rowClass?.(row)]"
            role="row"
            :tabindex="clickable ? 0 : undefined"
            @click="clickable && emit('row-click', row)"
            @keydown.enter.self.prevent="clickable && emit('row-click', row)"
            @keydown.space.self.prevent="clickable && emit('row-click', row)"
          >
            <div
              v-for="column in columns"
              :key="column.key"
              class="v-table__cell"
              :style="cellStyle(column)"
              role="cell"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </div>

            <!-- stop da klik na meni ne otvori i detalje reda -->
            <div
              v-if="$slots.actions"
              class="v-table__cell v-table__cell--actions"
              role="cell"
              @click.stop
            >
              <slot name="actions" :row="row" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer v-if="$slots.footer" class="v-table__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup>
import { computed, useSlots } from "vue";

// kolone se skupljaju do minWidth, ispod toga tabela skroluje horizontalno
const DEFAULT_MIN_WIDTH = "8rem";
const ACTIONS_WIDTH = "2.625rem";
// padding, border reda i scrollbar
const CONTENT_GUTTER = "1.5rem + 2px + 6px";

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    validator: (list) => list.every((column) => "key" in column && "label" in column)
  },
  rows: { type: Array, required: true },
  rowKey: { type: String, default: "id" },
  emptyText: { type: String, default: "" },
  clickable: { type: Boolean, default: false },
  rowClass: { type: Function, default: null }
});

const emit = defineEmits(["row-click"]);

const slots = useSlots();

const sort = defineModel("sort", { type: Object, default: null });

const minWidth = (column) => column.minWidth ?? DEFAULT_MIN_WIDTH;

const cellStyle = (column) => ({
  flex: column.width ? `${column.grow ? 1 : 0} 1 ${column.width}` : "1 1 0",
  minWidth: minWidth(column)
});

const content_min_width = computed(() => {
  const parts = props.columns.map(minWidth);

  if (slots.actions) parts.push(ACTIONS_WIDTH);

  return `calc(${[...parts, CONTENT_GUTTER].join(" + ")})`;
});

const SORT_ARROWS = [
  {
    direction: "asc",
    label: "ui.table.sort_asc",
    view_box: "0 0 16 8",
    path: "M4.667 6 8 2.667 11.333 6z"
  },
  {
    direction: "desc",
    label: "ui.table.sort_desc",
    view_box: "0 8 16 8",
    path: "M4.667 10 8 13.333 11.333 10z"
  }
];

const isSorted = (column, direction) =>
  sort.value?.key === column.key && sort.value.direction === direction;

function setSort(column, direction) {
  sort.value = isSorted(column, direction) ? null : { key: column.key, direction };
}

const sortClass = (column) =>
  sort.value?.key === column.key ? `is-sorted-${sort.value.direction}` : "";

const ariaSort = (column) => {
  if (!column.sortable) return undefined;
  if (sort.value?.key !== column.key) return "none";

  return sort.value.direction === "asc" ? "ascending" : "descending";
};
</script>

<style scoped lang="scss">
$table-scrollbar: 6px;

@layer components {
  .v-table {
    @include flex(flex-start, stretch, 0, column);
    min-height: 0;
    background: $surface-default;
    overflow: hidden;

    // scroll ide horizontalno za zaglavlje i redove zajedno, body vertikalno
    &__scroll {
      flex: 1;
      min-height: 0;
      overflow-x: auto;
      overflow-y: hidden;
    }

    &__content {
      @include flex(flex-start, stretch, 0, column);
      height: 100%;
    }

    // desno ima mjesta za scrollbar da se kolone poravnaju sa redovima
    &__head {
      position: relative;
      z-index: 1;
      display: flex;
      flex-shrink: 0;
      padding: 0 calc(#{$space-12} + #{$table-scrollbar}) 0 $space-12;
      background: $surface-table-head;
      box-shadow: $shadow-header;
    }

    &__body {
      @include flex(flex-start, stretch, $space-8, column);
      flex: 1;
      min-height: 0;
      padding: $space-12;
      overflow-y: auto;
      // mjesto za scrollbar uvijek postoji da se kolone ne pomjeraju
      scrollbar-gutter: stable;

      &::-webkit-scrollbar {
        width: $table-scrollbar;
      }

      &::-webkit-scrollbar-track {
        background: alpha($fg-body, 0.05);
        border: 1px solid $border-default;
        border-radius: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: $cold-200;
        background-clip: padding-box;
        border: 1px solid transparent;
        border-radius: 2px;
      }

      @supports not selector(::-webkit-scrollbar) {
        scrollbar-width: thin;
        scrollbar-color: $cold-200 $cold-25;
      }
    }

    &__row {
      @include flex(flex-start, center, 0);
      flex-shrink: 0;
      min-height: 3rem;
      padding: $space-12 0;
      background: $surface-default;
      border: 1px solid $cold-75;
      border-radius: $radius-xs;
      transition: $transition;

      &:hover {
        background: $surface-default-hover;
      }

      &.is-clickable {
        cursor: pointer;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }

    &__cell {
      @include flex(flex-start, center, $space-16);
      min-width: 0;
      padding: 0 $space-16;
      font-size: $text-12;
      line-height: $leading-xs;
      color: $fg-heading;
      overflow-wrap: anywhere;

      &--head {
        height: 3rem;
        padding: $space-8 $space-16;
        font-weight: $weight-semibold;
        color: $fg-body;
        text-transform: uppercase;
      }

      &--actions {
        flex: 0 0 auto;
        width: 2.625rem;
        min-width: 0;
        justify-content: center;
        padding: 0;
      }
    }

    &__label {
      min-width: 0;
      overflow-wrap: normal;
    }

    &__label.is-nowrap {
      white-space: nowrap;
    }

    &__sort {
      @include flex(center, stretch, 0, column);
      flex-shrink: 0;
    }

    &__sort-arrow {
      display: flex;
      padding: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: $transition;

      &.is-asc {
        color: $cold-850;
      }

      &.is-desc {
        color: $cold-600;
      }

      svg {
        fill: currentColor;
      }

      &:hover {
        color: $fg-heading;
      }

      &:focus-visible {
        outline: 1px solid $border-action-focused;
      }
    }

    &__sort.is-sorted-asc &__sort-arrow.is-desc,
    &__sort.is-sorted-desc &__sort-arrow.is-asc {
      color: $cold-225;
    }

    &__empty {
      padding: $space-16;
      font-size: $text-14;
      color: $fg-body;
      text-align: center;
    }

    &__footer {
      @include flex(space-between, center, $space-16);
      flex-shrink: 0;
      padding: $space-8 $space-16;
      background: $cold-50;
      border-top: 1px solid $border-default;
    }
  }
}
</style>
