<template>
  <VDropdown
    :class="['notifications', { 'has-unread': has_unread }]"
    :label="trigger_label"
    @open="notifications_store.fetchNotifications()"
  >
    <template #trigger>
      <span class="notifications__bell">
        <span class="material-icons" aria-hidden="true">notifications</span>
        <span v-if="has_unread" class="notifications__dot" aria-hidden="true" />
      </span>
    </template>

    <section class="notifications__panel" :aria-label="$t('layout.notifications.title')">
      <header class="notifications__header">
        <h2 class="notifications__title">{{ $t("layout.notifications.title") }}</h2>
        <button
          v-if="has_unread"
          type="button"
          class="notifications__read-all"
          @click.stop="notifications_store.markAllAsRead()"
        >
          {{ $t("layout.notifications.mark_all_read") }}
        </button>
      </header>

      <div class="notifications__body">
        <p v-if="is_first_load" class="notifications__message">
          {{ $t("common.states.loading") }}
        </p>

        <p v-else-if="notifications_store.error" class="notifications__error" role="alert">
          {{ getErrorMessage(notifications_store.error) }}
        </p>

        <p v-else-if="!items.length" class="notifications__message">
          {{ $t("layout.notifications.empty") }}
        </p>

        <ul v-else class="notifications__list">
          <li v-for="item in items" :key="item.id">
            <button
              type="button"
              :class="['notifications__item', { 'is-unread': !item.is_read }]"
              @click="openNotification(item)"
            >
              <!-- osoba ima inicijale, sistemsko obavještenje ikonicu tipa -->
              <span v-if="item.initials" class="notifications__avatar" aria-hidden="true">
                {{ item.initials }}
              </span>
              <span
                v-else
                :class="['notifications__avatar', 'is-icon', `is-${item.tone}`]"
                aria-hidden="true"
              >
                <VIcon :name="item.type_icon" :size="18" />
              </span>

              <span class="notifications__content">
                <strong class="notifications__name">{{ item.title }}</strong>

                <span v-if="item.text || item.leave_type" class="notifications__text">
                  {{ item.text }}
                  <span
                    v-if="item.leave_type"
                    class="notifications__leave"
                    :style="{ '--leave-accent': item.accent }"
                  >
                    {{ item.leave_type }}
                    <VIcon :name="item.leave_icon" :size="16" />
                  </span>
                </span>

                <span v-if="item.detail" class="notifications__detail">{{ item.detail }}</span>

                <span class="notifications__time">{{ formatTimeAgo(item.created_at) }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </section>
  </VDropdown>

  <!-- isti panel kao klik na karticu na stranici Zahtevi -->
  <RequestDetailsDrawer ref="details_ref" />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import VDropdown from "@/components/VDropdown.vue";
import VIcon from "@/components/VIcon.vue";
import { useNotificationsStore } from "@/stores/notifications";
import { useDate } from "@/composables/useDate";
import { t } from "@/i18n";
import { getErrorMessage } from "@/utils/api-error";
import { leaveTypeName, leaveTypeSourceName } from "@/utils/leave-type-name";
import { resolveColor } from "@/utils/color";
import { formatDateRange } from "@/utils/date-range";
import { REQUEST_GROUPS, groupKeyOf, iconOf } from "@/views/requests/request-config";
import RequestDetailsDrawer from "@/views/requests/components/RequestDetailsDrawer.vue";

// type određuje izgled kartice i gdje vodi klik
// ostali LEAVE_REQUEST_* tipovi su pretpostavka, dokumentacija nema listu
const dates = (n) => formatDateRange(n.start_date, n.end_date);

const LEAVE_TARGET = "request";

// naslovi i tekstovi su ključevi u layout.notifications.types, prevode se pri renderu
const TYPES = {
  LEAVE_REQUEST_APPROVED: {
    title: "approved",
    icon: "check_circle",
    tone: "success",
    text: () => t("layout.notifications.types.approved.text"),
    detail: dates,
    target: LEAVE_TARGET
  },
  LEAVE_REQUEST_REJECTED: {
    title: "rejected",
    icon: "cancel",
    tone: "error",
    text: () => t("layout.notifications.types.rejected.text"),
    detail: (n) =>
      n.rejection_reason
        ? t("layout.notifications.reason", { reason: n.rejection_reason })
        : dates(n),
    target: LEAVE_TARGET
  },
  LEAVE_REQUEST_SUBMITTED: {
    title: "submitted",
    icon: "event_note",
    tone: "action",
    text: () => t("layout.notifications.types.submitted.text"),
    detail: dates,
    target: LEAVE_TARGET
  },
  LEAVE_REQUEST_CANCELLED: {
    title: "cancelled",
    icon: "remove_circle",
    tone: "neutral",
    text: () => t("layout.notifications.types.cancelled.text"),
    detail: dates,
    target: LEAVE_TARGET
  },
  DELEGATION_ASSIGNED: {
    title: "delegation",
    icon: "how_to_reg",
    tone: "action",
    text: (n) =>
      n.name
        ? t("layout.notifications.types.delegation.text_named", { name: n.name })
        : t("layout.notifications.types.delegation.text"),
    detail: dates,
    target: "delegations"
  },
  POLICY_SCHEDULED: {
    title: "policy",
    icon: "policy",
    tone: "action",
    text: (n) =>
      [
        n.policy_version &&
          t("layout.notifications.types.policy.version", { version: n.policy_version }),
        n.effective_from &&
          t("layout.notifications.types.policy.effective", {
            date: formatDateRange(n.effective_from)
          })
      ]
        .filter(Boolean)
        .join(" "),
    target: "policies"
  }
};

// nepoznat tip, bar vrijeme i opšti naslov
const DEFAULT_TYPE = { title: "default", icon: "notifications", tone: "neutral" };

const POLL_MS = 60_000;

const notifications_store = useNotificationsStore();
const router = useRouter();
const { formatTimeAgo } = useDate();

const has_unread = computed(() => notifications_store.unread_count > 0);

const trigger_label = computed(() =>
  has_unread.value
    ? t("layout.notifications.unread_label", { count: notifications_store.unread_count })
    : t("layout.notifications.title")
);

const is_first_load = computed(
  () => notifications_store.is_loading && !notifications_store.notifications.length
);

const accentOf = (leave_type) =>
  resolveColor(REQUEST_GROUPS.find((group) => group.key === groupKeyOf(leave_type))?.accent);

const initialsOf = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const items = computed(() =>
  notifications_store.notifications.map((notification) => {
    const config = TYPES[notification.type] ?? DEFAULT_TYPE;
    // ikonice i boje su ključane srpskim nazivom tipa
    const source_type = notification.leave_type_name
      ? leaveTypeSourceName(notification.leave_type_name)
      : "";

    return {
      ...notification,
      leave_type: notification.leave_type_name ? leaveTypeName(notification.leave_type_name) : "",
      title: t(`layout.notifications.types.${config.title}.title`),
      text: config.text?.(notification) ?? "",
      detail: config.detail?.(notification) ?? "",
      target: config.target ?? null,
      // inicijali samo kad obavještenje stvarno govori o osobi
      initials: initialsOf(notification.name),
      type_icon: config.icon,
      tone: config.tone,
      leave_icon: iconOf(source_type),
      accent: accentOf(source_type)
    };
  })
);

const details_ref = ref(null);

// klik označi kao pročitano i otvori ono na šta se odnosi
// kod zahtjeva entity_id je id zahtjeva, delegacije i polise vode na svoju stranu
function openNotification(item) {
  notifications_store.markAsRead(item.id);

  if (item.target === LEAVE_TARGET && item.entity_id) details_ref.value?.show(item.entity_id);
  else if (item.target) router.push({ name: item.target });
}

let poll_id = null;

onMounted(() => {
  notifications_store.fetchUnreadCount();
  poll_id = setInterval(() => notifications_store.fetchUnreadCount(), POLL_MS);
});

onUnmounted(() => clearInterval(poll_id));
</script>

<style lang="scss" scoped>
.notifications {
  :deep(.v-dropdown__trigger) {
    width: $size-header;
    height: $size-header;
    color: $icon-on-action;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &.has-unread :deep(.v-dropdown__trigger) {
    color: $fg-heading;
    border-color: transparent;
  }

  :deep(.v-dropdown__trigger[aria-expanded="true"]) {
    background: $surface-default-hover;
    border-color: $border-default;
  }

  &__bell {
    position: relative;
    @include flex(center, center);
  }

  &__dot {
    position: absolute;
    top: 0;
    right: 0;
    width: 0.5rem;
    height: 0.5rem;
    background: $fg-action;
    border: 1px solid $surface-default;
    border-radius: $radius-pill;
  }

  &__panel {
    @include flex(flex-start, stretch, 0, column);
    width: 25.25rem;
    max-width: calc(100vw - #{$space-16});
    max-height: min(34rem, calc(100vh - 5rem));
    overflow: hidden;
    background: $surface-default;
    border-radius: $radius-sm;
    box-shadow: 0 0 20px rgba($black, 0.25);
  }

  &__header {
    @include flex(space-between, center, $space-16);
    padding: $space-16;
    border-bottom: 1px solid $border-default;
  }

  &__title {
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__read-all {
    padding: 0;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-action;
    background: transparent;
    border: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    padding: $space-8 $space-4 $space-8 $space-8;
    overflow-y: auto;
  }

  &__message {
    padding: $space-16 $space-8;
    font-size: $text-14;
    color: $fg-body;
  }

  &__error {
    padding: $space-16 $space-8;
    font-size: $text-12;
    color: $fg-error;
  }

  &__list {
    @include flex(flex-start, stretch, $space-8, column);
  }

  &__item {
    @include flex(flex-start, flex-start, $space-12);
    width: 100%;
    padding: $space-16;
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
      outline: 1px solid $border-action-focused;
    }

    &.is-unread {
      background: $cold-25;
      border-left: 4px solid $fg-action;
      padding-left: calc(#{$space-16} - 3px);
    }
  }

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    font-size: $text-12;
    font-weight: $weight-semibold;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;

    // sistemsko obavještenje, ikonica tipa u boji ishoda
    &.is-success {
      color: $fg-success;
      background: alpha($fg-success, 0.1);
    }

    &.is-error {
      color: $fg-error;
      background: alpha($fg-error, 0.1);
    }

    &.is-neutral {
      color: $fg-body;
      background: $cold-50;
    }
  }

  &__content {
    @include flex(flex-start, flex-start, $space-8, column);
    min-width: 0;
  }

  &__name {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__detail {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    overflow-wrap: anywhere;
  }

  &__text {
    @include flex(flex-start, center, $space-4);
    flex-wrap: wrap;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__leave {
    @include flex(center, center, $space-4);
    padding: 2px $space-4;
    color: var(--leave-accent, #{$fg-body});
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-lg;
  }

  &__time {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }
}
</style>
