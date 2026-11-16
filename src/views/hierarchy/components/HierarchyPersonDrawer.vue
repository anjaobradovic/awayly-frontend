<template>
  <VDrawer v-model:open="is_open" :title="$t('hierarchy.drawer.title')" width="30rem">
    <template v-if="person">
      <section class="person-drawer__summary">
        <span class="person-drawer__avatar" aria-hidden="true">{{ person.initials }}</span>

        <div class="person-drawer__summary-text">
          <p class="person-drawer__name">{{ person.name }}</p>
          <p class="person-drawer__position">
            {{ person.position || $t("hierarchy.no_position") }}
          </p>
          <div class="person-drawer__chips">
            <VChip tone="action">{{ script(person.role) }}</VChip>
            <VChip v-if="person.status === 'PENDING_INVITE'" tone="pending">
              {{ $t("hierarchy.pending_invite") }}
            </VChip>
          </div>
        </div>
      </section>

      <section class="person-drawer__card">
        <h3 class="person-drawer__card-title">{{ $t("hierarchy.drawer.contact") }}</h3>

        <dl class="person-drawer__fields">
          <div class="person-drawer__field">
            <dt>{{ $t("hierarchy.drawer.email") }}</dt>
            <dd>
              <a :href="`mailto:${person.email}`" class="person-drawer__link">{{ person.email }}</a>
            </dd>
          </div>
          <div class="person-drawer__field">
            <dt>{{ $t("hierarchy.drawer.team") }}</dt>
            <dd>{{ script(person.team) || $t("hierarchy.no_team") }}</dd>
          </div>
          <div class="person-drawer__field">
            <dt>{{ $t("hierarchy.drawer.role") }}</dt>
            <dd>{{ script(person.role) }}</dd>
          </div>
        </dl>
      </section>

      <section class="person-drawer__card">
        <h3 class="person-drawer__card-title">{{ $t("hierarchy.drawer.manager") }}</h3>

        <button
          v-if="manager"
          type="button"
          class="person-drawer__person"
          @click="emit('select', manager.id)"
        >
          <span class="person-drawer__mini-avatar" aria-hidden="true">{{ manager.initials }}</span>
          <span class="person-drawer__person-text">
            <strong>{{ manager.name }}</strong>
            <span>{{ manager.position || $t("hierarchy.no_position") }}</span>
          </span>
          <VIcon name="chevron_right" :size="18" />
        </button>
        <p v-else class="person-drawer__empty">{{ $t("hierarchy.drawer.no_manager") }}</p>
      </section>

      <section class="person-drawer__card">
        <h3 class="person-drawer__card-title">
          {{ $t("hierarchy.drawer.direct_reports") }} ({{ reports.length }})
        </h3>

        <ul v-if="reports.length" class="person-drawer__list">
          <li v-for="report in reports" :key="report.id">
            <button type="button" class="person-drawer__person" @click="emit('select', report.id)">
              <span class="person-drawer__mini-avatar" aria-hidden="true">
                {{ report.initials }}
              </span>
              <span class="person-drawer__person-text">
                <strong>{{ report.name }}</strong>
                <span>{{ report.position || $t("hierarchy.no_position") }}</span>
              </span>
              <VIcon name="chevron_right" :size="18" />
            </button>
          </li>
        </ul>
        <p v-else class="person-drawer__empty">{{ $t("hierarchy.drawer.no_reports") }}</p>
      </section>

      <section v-if="chain.length > 1" class="person-drawer__card">
        <h3 class="person-drawer__card-title">{{ $t("hierarchy.drawer.chain") }}</h3>

        <ol class="person-drawer__chain">
          <li
            v-for="item in chain"
            :key="item.id"
            :class="{ 'is-current': item.id === person.id }"
          >
            {{ item.name }}
          </li>
        </ol>
      </section>
    </template>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.close") }}
      </VBaseButton>
      <VBaseButton :disabled="!person" @click="emit('reveal', person.id)">
        <VIcon name="account_tree" :size="16" />
        {{ $t("hierarchy.drawer.show_in_chart") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VChip from "@/components/VChip.vue";
import VIcon from "@/components/VIcon.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { script } from "@/i18n";
import { useHierarchyStore } from "@/stores/hierarchy";

const is_open = defineModel("open", { type: Boolean, default: false });

// select prebacuje panel na drugu osobu, reveal je pokazuje u stablu
const emit = defineEmits(["select", "reveal"]);

const hierarchy_store = useHierarchyStore();

const person = computed(() => hierarchy_store.selected_node);

const manager = computed(() =>
  person.value ? (hierarchy_store.by_id.get(person.value.manager_id) ?? null) : null
);

const reports = computed(() => (person.value ? hierarchy_store.reportsOf(person.value.id) : []));

const chain = computed(() => (person.value ? hierarchy_store.chainOf(person.value.id) : []));
</script>

<style lang="scss" scoped>
.person-drawer {
  &__summary,
  &__card {
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__summary {
    @include flex(flex-start, center, $space-16);
  }

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: $space-56;
    height: $space-56;
    font-size: $text-20;
    font-weight: $weight-semibold;
    color: $fg-on-action;
    background: $surface-action;
    border-radius: $radius-pill;
  }

  &__summary-text {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
  }

  &__name {
    font-size: $text-18;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__position {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__chips {
    @include flex(flex-start, center, $space-8);
    flex-wrap: wrap;
    margin-top: $space-4;
  }

  &__card {
    @include flex(flex-start, stretch, $space-12, column);
  }

  &__card-title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__fields {
    @include flex(flex-start, stretch, $space-8, column);
  }

  &__field {
    display: grid;
    grid-template-columns: 6rem minmax(0, 1fr);
    gap: $space-8;
    font-size: $text-14;
    line-height: $leading-18;

    dt {
      color: $fg-body;
    }

    dd {
      overflow-wrap: anywhere;
      color: $fg-heading;
    }
  }

  &__link {
    color: $fg-action;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__list {
    @include flex(flex-start, stretch, $space-8, column);
  }

  &__person {
    @include flex(flex-start, center, $space-12);
    width: 100%;
    padding: $space-8 $space-12;
    font-family: $font-family;
    text-align: left;
    color: $fg-body;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xs;
    cursor: pointer;
    transition: $transition;

    &:hover {
      border-color: $border-action;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
  }

  &__mini-avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: $space-32;
    height: $space-32;
    font-size: $text-12;
    font-weight: $weight-semibold;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__person-text {
    @include flex(flex-start, stretch, $space-2, column);
    flex: 1;
    min-width: 0;

    strong {
      @include truncate;
      font-size: $text-14;
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-heading;
    }

    span {
      @include truncate;
      font-size: $text-12;
      line-height: $leading-xs;
    }
  }

  &__empty {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  // vrh -> osoba, sa strelicama između
  &__chain {
    @include flex(flex-start, center, $space-4);
    flex-wrap: wrap;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;

    li + li::before {
      margin-right: $space-4;
      content: "→";
      color: $fg-muted;
    }

    .is-current {
      font-weight: $weight-semibold;
      color: $fg-action;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .person-drawer__person {
    transition: none;
  }
}
</style>
