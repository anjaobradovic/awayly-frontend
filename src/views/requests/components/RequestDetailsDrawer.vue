<template>
  <!-- zahtjev: odobravalac, sopstveni zahtjev, saldo u minusu, odbijanje -->
  <VDrawer v-model:open="is_open" :title="title">
    <p v-if="load_error" class="request-details__error" role="alert">{{ load_error }}</p>

    <template v-else-if="request">
      <dl class="request-details__rows">
        <div class="request-details__row">
          <dt>{{ $t("requests.details.employee") }}</dt>
          <dd class="request-details__person">
            <span class="request-details__avatar" aria-hidden="true">{{ initials }}</span>
            {{ script(request.employee) || "—" }}
          </dd>
        </div>

        <div class="request-details__row">
          <dt>{{ $t("requests.details.team") }}</dt>
          <dd>{{ script(request.team) || "—" }}</dd>
        </div>

        <div class="request-details__row">
          <dt>{{ $t("requests.details.submitted_at") }}</dt>
          <dd>{{ formatDateRange(request.created_at) }}</dd>
        </div>

        <div class="request-details__row">
          <dt>{{ $t("requests.details.type") }}</dt>
          <dd class="request-details__type" :style="{ '--request-accent': accent }">
            <VIcon :name="iconOf(request.leave_type)" :size="16" />
            {{ script(request.leave_type) }}
          </dd>
        </div>

        <div class="request-details__row">
          <dt>{{ $t("requests.details.period") }}</dt>
          <dd class="request-details__dates">
            <VIcon name="calendar_month" :size="16" />
            <strong>{{ formatDateRange(request.start_date, request.end_date) }}</strong>
          </dd>
        </div>

        <div v-if="status_chip" class="request-details__row">
          <dt>{{ $t("requests.details.status") }}</dt>
          <dd>
            <VChip :tone="status_chip.tone" :icon="status_chip.icon">
              {{ status_chip.label }}
            </VChip>
          </dd>
        </div>

        <div class="request-details__row is-top">
          <dt>{{ $t("requests.details.reason") }}</dt>
          <dd class="request-details__text">{{ request.reason || "-" }}</dd>
        </div>

        <div v-if="request.rejection_reason" class="request-details__row is-top">
          <dt>{{ $t("requests.details.rejection_reason") }}</dt>
          <dd class="request-details__text">{{ request.rejection_reason }}</dd>
        </div>
      </dl>

      <!-- odbijanje: razlog se piše u istom panelu, saldo se tada ne prikazuje -->
      <section v-if="is_rejecting" class="request-details__reject">
        <VTextarea
          v-model="reject_reason"
          :label="$t('requests.details.reject_reason_label')"
          :rows="4"
          :maxlength="REJECT_MAX"
        />
      </section>

      <section v-else-if="request.balance" class="request-details__balance">
        <h3 class="request-details__balance-title">{{ balance_title }}</h3>

        <ul class="request-details__tiles" :style="{ '--request-accent': accent }">
          <li v-for="tile in balance_tiles" :key="tile.label" class="request-details__tile">
            <span :class="['request-details__tile-icon', { 'is-neutral': tile.neutral }]">
              <VIcon :name="tile.icon" :size="20" />
            </span>
            <span class="request-details__tile-text">
              <span class="request-details__tile-label">{{ tile.label }}</span>
              <strong class="request-details__tile-value">{{ tile.value }}</strong>
            </span>
          </li>
        </ul>

        <!-- poruka samo dok zahtjev čeka odluku -->
        <template v-if="request.status === 'PENDING'">
          <VNotice v-if="request.balance.remaining < 0">{{ negative_message }}</VNotice>
          <VNotice v-else tone="info">{{ remaining_message }}</VNotice>
        </template>
      </section>

      <p v-if="action_error" class="request-details__error" role="alert">{{ action_error }}</p>
    </template>

    <template v-if="can_decide || can_cancel" #footer>
      <!-- odobravalac, odbijanje: Nazad / Odbij zahtev -->
      <template v-if="can_decide && is_rejecting">
        <VBaseButton
          appearance="outlined"
          color="neutral"
          :disabled="is_busy"
          @click="is_rejecting = false"
        >
          {{ $t("common.actions.back") }}
        </VBaseButton>
        <VBaseButton :disabled="!reject_reason.trim() || is_busy" @click="reject">
          {{ is_busy ? $t("requests.details.rejecting") : $t("requests.details.reject") }}
        </VBaseButton>
      </template>

      <!-- odobravalac: Odbij zahtev / Odobri zahtev -->
      <template v-else-if="can_decide">
        <VBaseButton appearance="tonal" color="primary" :disabled="is_busy" @click="startReject">
          {{ $t("requests.details.reject") }}
        </VBaseButton>
        <VBaseButton :disabled="is_busy" @click="approve">
          {{ is_busy ? $t("requests.details.approving") : $t("requests.details.approve") }}
        </VBaseButton>
      </template>

      <!-- sopstveni zahtjev: Otkaži zahtev, Izmeni zahtev još nema -->
      <VBaseButton v-else appearance="tonal" color="primary" @click="is_cancel_open = true">
        {{ $t("requests.details.cancel") }}
      </VBaseButton>
    </template>
  </VDrawer>

  <CancelRequestDialog v-model:open="is_cancel_open" :request="request" @cancelled="onCancelled" />
</template>

<script setup>
import { computed, ref } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VIcon from "@/components/VIcon.vue";
import VChip from "@/components/VChip.vue";
import VNotice from "@/components/VNotice.vue";
import VTextarea from "@/components/VTextarea.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useAuthStore } from "@/stores/auth";
import { useRequestsStore } from "@/stores/requests";
import { formatDateRange } from "@/utils/date-range";
import { getErrorMessage } from "@/utils/api-error";
import { resolveColor } from "@/utils/color";
import { REQUEST_GROUPS, STATUS_CHIPS, canCancel, groupKeyOf, iconOf } from "../request-config";
import CancelRequestDialog from "./CancelRequestDialog.vue";
import { currentLocale, script, t } from "@/i18n";
import { leaveTypeSourceName } from "@/utils/leave-type-name";

// brojač 0/120 ispod polja
const REJECT_MAX = 120;

const emit = defineEmits(["decided"]);

const auth_store = useAuthStore();
const requests_store = useRequestsStore();

const is_open = ref(false);
const request = ref(null);
const load_error = ref("");
const action_error = ref("");
const is_busy = ref(false);
const is_rejecting = ref(false);
const reject_reason = ref("");
const is_cancel_open = ref(false);

// prvo podaci pa panel, da se ne otvori prazan
// { reject: true } otvara panel odmah sa poljem za razlog
async function show(id, { reject = false } = {}) {
  load_error.value = "";
  action_error.value = "";
  is_rejecting.value = reject;
  reject_reason.value = "";

  const { data, error } = await requests_store.fetchRequestDetails(id);

  request.value = data ?? null;
  if (error) load_error.value = getErrorMessage(error);

  is_open.value = true;
}

defineExpose({ show });

const title = computed(() => {
  const type = request.value?.leave_type;

  if (!type) return t("requests.details.title_default");

  return t("requests.details.title", {
    type,
    type_lower: type.toLocaleLowerCase(currentLocale().intl)
  });
});

const initials = computed(() =>
  (request.value?.employee ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
);

// boja kolone sa stranice zahteva
const accent = computed(() =>
  resolveColor(
    REQUEST_GROUPS.find((group) => group.key === groupKeyOf(request.value?.leave_type))?.accent
  )
);

const can_decide = computed(() => Boolean(request.value?.can_approve));

const is_own = computed(
  () => Boolean(request.value) && request.value.user_id === auth_store.user.id
);

const can_cancel = computed(() => is_own.value && canCancel(request.value));

// dok se odlučuje status je jasan iz dugmadi, čip samo za riješene
const status_chip = computed(() =>
  can_decide.value ? null : (STATUS_CHIPS[request.value?.status] ?? null)
);

// padež znamo samo za godišnji, ostali tipovi idu u zagradi
const is_annual = computed(() => leaveTypeSourceName(request.value?.leave_type) === "Godišnji odmor");

const balance_title = computed(() =>
  is_annual.value
    ? t("requests.details.balance_title_annual")
    : t("requests.details.balance_title", { type: request.value?.leave_type })
);

const negative_message = computed(() =>
  is_annual.value
    ? t("requests.details.negative_annual")
    : t("requests.details.negative", { type: request.value?.leave_type })
);

const remaining_message = computed(() => {
  const params = {
    days: t("common.days", { count: request.value?.balance?.remaining ?? 0 }),
    type: request.value?.leave_type,
    year: request_year.value
  };

  return t(is_annual.value ? "requests.details.left_annual" : "requests.details.left", params);
});

const request_year = computed(() => String(request.value?.start_date ?? "").slice(0, 4));

const balance_tiles = computed(() => {
  const balance = request.value?.balance ?? {};
  const icon = iconOf(request.value?.leave_type);

  return [
    { label: t("requests.balance.available"), value: balance.available, icon },
    {
      label: t("requests.balance.requested"),
      value: balance.requested,
      icon: "watch_later",
      neutral: true
    },
    { label: t("requests.balance.remaining"), value: balance.remaining, icon }
  ];
});

function startReject() {
  action_error.value = "";
  is_rejecting.value = true;
}

async function decide(action) {
  is_busy.value = true;
  action_error.value = "";

  const error = await action();

  is_busy.value = false;

  if (error) {
    action_error.value = getErrorMessage(error);
    return;
  }

  emit("decided", request.value.id);
  is_open.value = false;
}

function onCancelled() {
  emit("decided", request.value.id);
  is_open.value = false;
}

// api 9.4 / 9.5, store osvježava i karticu na stranici Zahtevi
const approve = () => decide(() => requests_store.approveRequest(request.value.id));

const reject = () =>
  decide(() => requests_store.rejectRequest(request.value.id, reject_reason.value.trim()));
</script>

<style scoped lang="scss">
.request-details {
  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  // labela lijevo, vrijednost desno
  &__rows {
    @include flex(flex-start, stretch, $space-16, column);
  }

  &__row {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr);
    gap: $space-24;
    align-items: center;
    font-size: $text-14;

    &.is-top {
      align-items: start;
    }

    dt {
      font-weight: $weight-semibold;
      line-height: $leading-xs;
      color: $fg-body;
    }

    dd {
      line-height: $leading-18;
      color: $fg-heading;
    }
  }

  &__person,
  &__type,
  &__dates {
    @include flex(flex-start, center, $space-8);
  }

  &__type :deep(.v-icon) {
    color: var(--request-accent);
  }

  &__dates {
    gap: $space-4;

    strong {
      font-weight: $weight-semibold;
    }
  }

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    font-size: 0.5rem;
    font-weight: $weight-semibold;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__text {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  // linija iznad, crveni okvir polja, brojač desno
  &__reject {
    padding-top: $space-16;
    border-top: 1px solid $border-default;

    :deep(.v-textarea) {
      gap: $space-4;
    }

    :deep(.v-textarea__label) {
      font-size: $text-12;
      line-height: $leading-xs;
    }

    :deep(.v-textarea__control) {
      min-height: 6rem;
      border-color: $border-error;

      &:focus {
        border-color: $border-error;
      }
    }
  }

  // okvir sa naslovom, tri pločice i porukom
  &__balance {
    @include flex(flex-start, stretch, $space-12, column);
    padding: $space-12;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__balance-title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__tiles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $space-16;
  }

  &__tile {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
    padding: $space-8;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__tile-icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    color: $white;
    background: var(--request-accent, #{$fg-action});
    border-radius: $radius-sm;

    &.is-neutral {
      color: $fg-heading;
      background: $cold-50;
    }
  }

  &__tile-text {
    @include flex(center, flex-start, 0, column);
    min-width: 0;
  }

  &__tile-label {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
    text-transform: uppercase;
  }

  &__tile-value {
    font-size: $text-20;
    font-weight: $weight-semibold;
    line-height: $leading-24;
    color: $fg-heading;
  }

  @include respond-to("mobile") {
    &__row {
      grid-template-columns: minmax(0, 1fr);
      gap: $space-4;
    }

    &__tiles {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
