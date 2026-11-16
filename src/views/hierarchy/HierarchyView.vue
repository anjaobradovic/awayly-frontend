<template>
  <div class="hierarchy">
    <div class="hierarchy__header">
      <VPageHeader :title="$t('hierarchy.title')" :description="$t('hierarchy.description')">
        <template #actions>
          <VBaseInput
            v-model="search"
            class="hierarchy__search"
            appearance="outlined"
            size="header"
            :placeholder="$t('hierarchy.search_placeholder')"
            :aria-label="$t('common.actions.search')"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>
        </template>
      </VPageHeader>
    </div>

    <section class="hierarchy__panel">
      <div class="hierarchy__toolbar">
        <p v-if="hierarchy_store.visible_ids" class="hierarchy__summary" role="status">
          <strong>{{ $t("hierarchy.results", { count: hierarchy_store.match_ids.length }) }}</strong>
          <VBaseButton appearance="text" size="small" @click="search = ''">
            {{ $t("hierarchy.show_all") }}
          </VBaseButton>
        </p>
        <p v-else class="hierarchy__summary">
          <span>{{ $t("hierarchy.stats.people", { count: hierarchy_store.nodes.length }) }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ $t("hierarchy.stats.managers", { count: hierarchy_store.manager_count }) }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ $t("hierarchy.stats.teams", { count: hierarchy_store.team_count }) }}</span>
        </p>

        <div class="hierarchy__toolbar-actions">
          <VBaseButton
            appearance="text"
            size="small"
            :disabled="!hierarchy_store.nodes.length"
            @click="hierarchy_store.expandAll()"
          >
            <VIcon name="unfold_more" :size="16" />
            {{ $t("hierarchy.expand_all") }}
          </VBaseButton>
          <VBaseButton
            appearance="text"
            size="small"
            :disabled="!hierarchy_store.nodes.length"
            @click="hierarchy_store.collapseAll()"
          >
            <VIcon name="unfold_less" :size="16" />
            {{ $t("hierarchy.collapse_all") }}
          </VBaseButton>
          <VSegmentedButton
            v-model="layout"
            :aria-label="$t('hierarchy.view.label')"
            :options="layout_options"
            size="small"
          />
        </div>
      </div>

      <div ref="canvas_ref" :class="['hierarchy__canvas', `hierarchy__canvas--${layout}`]">
        <p v-if="message" class="hierarchy__message">{{ message }}</p>

        <ul v-else :class="['org-tree', `org-tree--${layout}`]">
          <HierarchyNode
            v-for="root in hierarchy_store.visible_roots"
            :key="root.id"
            :node="root"
            @select="openPerson"
          />
        </ul>
      </div>
    </section>

    <HierarchyPersonDrawer v-model:open="is_drawer_open" @select="openPerson" @reveal="reveal" />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VIcon from "@/components/VIcon.vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import { useBreakpoint } from "@/composables/useBreakpoint";
import { t } from "@/i18n";
import { useHierarchyStore } from "@/stores/hierarchy";
import { getErrorMessage } from "@/utils/api-error";
import HierarchyNode from "./components/HierarchyNode.vue";
import HierarchyPersonDrawer from "./components/HierarchyPersonDrawer.vue";

const hierarchy_store = useHierarchyStore();
const { is_tablet_sm } = useBreakpoint();

const search = computed({
  get: () => hierarchy_store.search,
  set: (value) => hierarchy_store.setSearch(value)
});

// na telefonu je dijagram preširok, pa krećemo od liste
const layout = ref(is_tablet_sm.value ? "list" : "chart");

watch(is_tablet_sm, (narrow) => (layout.value = narrow ? "list" : "chart"));

const layout_options = computed(() => [
  { value: "chart", label: t("hierarchy.view.chart") },
  { value: "list", label: t("hierarchy.view.list") }
]);

const message = computed(() => {
  if (hierarchy_store.is_loading) return t("common.states.loading");
  if (hierarchy_store.error) return getErrorMessage(hierarchy_store.error, t("common.states.error"));
  if (!hierarchy_store.nodes.length) return t("hierarchy.empty");
  if (!hierarchy_store.visible_roots.length) return t("hierarchy.no_results");

  return "";
});

const canvas_ref = ref(null);

// kartica osobe u vidno polje, i vodoravno kad je dijagram širok
async function scrollToPerson(id) {
  await nextTick();

  document
    .getElementById(`hierarchy-node-${id}`)
    ?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
}

// prvi pogodak pretrage se sam pokaže
watch(
  () => hierarchy_store.match_ids[0],
  (id) => {
    if (id) scrollToPerson(id);
  }
);

const is_drawer_open = ref(false);

function openPerson(id) {
  hierarchy_store.select(id);
  is_drawer_open.value = true;
}

function reveal(id) {
  is_drawer_open.value = false;
  hierarchy_store.reveal(id);
  scrollToPerson(id);
}

// širok dijagram kreće od sredine, gdje je vrh strukture
async function centerCanvas() {
  await nextTick();

  const canvas = canvas_ref.value;

  if (canvas && layout.value === "chart") {
    canvas.scrollLeft = (canvas.scrollWidth - canvas.clientWidth) / 2;
  }
}

watch(layout, centerCanvas);

onMounted(async () => {
  await hierarchy_store.fetchHierarchy();
  centerCanvas();
});

onUnmounted(() => hierarchy_store.resetStore());
</script>

<style scoped lang="scss">
.hierarchy {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  background: $cold-50;

  &__header {
    position: relative;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__search {
    width: 20.125rem;
  }

  &__panel {
    @include flex(flex-start, stretch, 0, column);
    min-height: 0;
    margin: $space-16;
    overflow: hidden;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    box-shadow: $shadow-small;
  }

  &__toolbar {
    position: relative;
    z-index: 1;
    @include flex(space-between, center, $space-16);
    flex-wrap: wrap;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-small;
  }

  &__summary {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;

    strong {
      font-weight: $weight-semibold;
      color: $fg-heading;
    }
  }

  &__toolbar-actions {
    @include flex(flex-end, center, $space-12);
    flex-wrap: wrap;
  }

  // platno skroluje u oba pravca, dijagram može biti širi od ekrana
  &__canvas {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: $surface-background;
    @include thin-scrollbar($primary);

    &--chart {
      padding: $space-24;
    }

    &--list {
      padding: $space-8 $space-16 $space-24;
    }
  }

  &__message {
    padding: $space-24;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  @include respond-to("tablet") {
    &__header {
      padding: $space-8;
    }

    &__panel {
      margin: $space-8;
    }

    &__search {
      flex: 1;
      width: auto;
      min-width: 0;
    }
  }

  @include respond-to("mobile") {
    &__toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: $space-8;
      padding: $space-12;
    }

    &__toolbar-actions {
      justify-content: space-between;
    }

    &__canvas--list {
      padding: $space-4 $space-8 $space-16;
    }
  }
}

// dijagram je širok koliko treba, a centriran kad stane
.org-tree--chart {
  display: flex;
  justify-content: center;
  gap: $space-32;
  width: max-content;
  min-width: 100%;
}

.org-tree--list {
  @include flex(flex-start, stretch, 0, column);
}
</style>
