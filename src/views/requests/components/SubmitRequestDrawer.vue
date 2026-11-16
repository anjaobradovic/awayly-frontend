<template>
  <VDrawer v-model:open="is_open" :title="$t('requests.submit.title')" width="37.5rem">
    <ol class="submit-drawer__steps">
      <li
        v-for="(item, index) in steps"
        :key="index"
        :class="[
          'submit-drawer__step',
          { 'is-done': step > index + 1, 'is-current': step === index + 1 }
        ]"
      >
        <span class="submit-drawer__track">
          <span
            :class="['submit-drawer__line', { 'is-hidden': index === 0, 'is-active': step > 1 }]"
          />
          <span class="submit-drawer__number">
            <VIcon v-if="step > index + 1" name="check" :size="18" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span
            :class="[
              'submit-drawer__line',
              { 'is-hidden': index === steps.length - 1, 'is-active': step > 1 }
            ]"
          />
        </span>
        <strong class="submit-drawer__step-title">{{ item.title }}</strong>
        <span class="submit-drawer__step-text">{{ item.text }}</span>
      </li>
    </ol>

    <!-- korak 1: vrsta odsustva -->
    <template v-if="step === 1">
      <section
        v-for="group in groups"
        :key="group.key"
        class="submit-drawer__card"
        :style="{ '--submit-accent': resolveColor(group.accent) }"
      >
        <h3 class="submit-drawer__card-title">{{ group.title }}</h3>

        <div class="submit-drawer__types">
          <button
            v-for="type in group.types"
            :key="type.id"
            type="button"
            :class="['submit-drawer__type', { 'is-selected': type.id === leave_type_id }]"
            :aria-pressed="type.id === leave_type_id"
            :disabled="isBlockedType(type)"
            :title="isBlockedType(type) ? $t('requests.submit.wfh_blocked') : undefined"
            @click="leave_type_id = type.id"
          >
            <span class="submit-drawer__type-icon">
              <VIcon :name="iconOf(type.name)" :size="20" />
            </span>
            <span class="submit-drawer__type-text">
              <span class="submit-drawer__type-name">{{ script(type.name) }}</span>
              <strong v-if="countOf(type) !== null" class="submit-drawer__type-count">
                {{ countOf(type) }}
              </strong>
              <span v-else class="submit-drawer__type-unlimited">
                {{ $t("requests.submit.unlimited") }}
              </span>
            </span>
          </button>
        </div>
      </section>
    </template>

    <!-- korak 2: period, razlog i bilans -->
    <template v-else>
      <section class="submit-drawer__card" :style="{ '--submit-accent': selected_accent }">
        <h3 class="submit-drawer__card-title">{{ $t("requests.submit.period_card") }}</h3>

        <!-- za ove tipove bira se samo početak, kraj računa backend -->
        <template v-if="is_fixed_duration">
          <VDateInput
            v-model="start_date"
            :label="$t('requests.submit.start_date')"
            :min="min_date"
            required
          />

          <!-- porodiljsko traži maternity_leave_details -->
          <div v-if="is_maternity" class="submit-drawer__row">
            <!-- porođaj mora biti poslije početka porodiljskog -->
            <VDateInput
              v-model="expected_due_date"
              :label="$t('requests.submit.due_date')"
              :min="due_date_min"
              required
            />
            <VBaseInput
              v-model="child_order"
              type="number"
              :label="$t('requests.submit.child_order')"
              appearance="outlined"
              :clearable="false"
              required
              :status="child_order_error ? 'error' : 'default'"
              :supporting-text="child_order_error"
            />
          </div>

          <p class="submit-drawer__hint">{{ duration_hint }}</p>
        </template>

        <!-- kalendar bira početak i kraj u jednom polju -->
        <VDateRangeInput
          v-else
          v-model:start="start_date"
          v-model:end="end_date"
          :label="$t('requests.submit.period')"
          :picker-title="$t('requests.submit.period_picker')"
          :min="min_date"
        />

        <!-- raniji datumi su zaključani ako tip ne dozvoljava prošlost -->
        <p v-if="min_date_hint" class="submit-drawer__hint">{{ min_date_hint }}</p>

        <VTextarea
          v-model="reason"
          :label="$t('requests.submit.reason')"
          :placeholder="$t('requests.submit.reason_placeholder')"
          :required="selected_type?.requires_reason"
          :rows="6"
          :maxlength="255"
        />
      </section>

      <section
        v-if="selected_type && selected_type.remaining !== null"
        class="submit-drawer__card"
        :style="{ '--submit-accent': selected_accent }"
      >
        <h3 class="submit-drawer__card-title">
          {{ $t("requests.submit.balance_title", { type: selected_type.name }) }}
        </h3>

        <p v-if="has_period" class="submit-drawer__period">
          <VIcon name="calendar_month" :size="16" />
          {{ formatDateRange(start_date, end_date) }}
        </p>

        <div class="submit-drawer__stats">
          <div v-for="stat in stats" :key="stat.label" class="submit-drawer__stat">
            <span :class="['submit-drawer__stat-icon', { 'is-muted': stat.muted }]">
              <VIcon :name="stat.icon" :size="20" />
            </span>
            <span class="submit-drawer__stat-text">
              <span class="submit-drawer__stat-label">{{ stat.label }}</span>
              <strong class="submit-drawer__stat-value">{{ stat.value }}</strong>
            </span>
          </div>
        </div>

        <!-- informacija, ne upozorenje -->
        <VNotice v-if="has_period" :tone="left_days < 0 ? 'warning' : 'info'">
          {{ balance_message }}
        </VNotice>
      </section>

      <!-- provjera pravila prije slanja i greška sa servera -->
      <VNotice v-for="message in rule_errors" :key="message">{{ message }}</VNotice>
      <VNotice v-if="error">{{ error }}</VNotice>
    </template>

    <template #footer>
      <template v-if="step === 1">
        <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
          {{ $t("common.actions.cancel") }}
        </VBaseButton>
        <VBaseButton :disabled="!selected_type" @click="step = 2">
          {{ $t("common.actions.next") }}
        </VBaseButton>
      </template>

      <template v-else>
        <VBaseButton appearance="tonal" color="neutral" @click="step = 1">
          {{ $t("common.actions.back") }}
        </VBaseButton>
        <VBaseButton
          :disabled="!can_submit || rule_errors.length > 0 || balance_blocked || busy"
          @click="submit"
        >
          {{ busy ? $t("requests.submit.sending") : $t("requests.submit.submit") }}
        </VBaseButton>
      </template>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VIcon from "@/components/VIcon.vue";
import VDateInput from "@/components/VDateInput.vue";
import VDateRangeInput from "@/components/VDateRangeInput.vue";
import VTextarea from "@/components/VTextarea.vue";
import VNotice from "@/components/VNotice.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import { resolveColor } from "@/utils/color";
import { useRequestsStore } from "@/stores/requests";
import { useAuthStore } from "@/stores/auth";
import { countWorkingDays, formatDateRange } from "@/utils/date-range";
import { REQUEST_GROUPS, groupKeyOf, iconOf } from "../request-config";
import { fromIso, longLabel } from "@/utils/calendar-date";
import { intlLocale, script, t } from "@/i18n";

const steps = computed(() => [
  { title: t("requests.submit.steps.type_title"), text: t("requests.submit.steps.type_text") },
  { title: t("requests.submit.steps.period_title"), text: t("requests.submit.steps.period_text") }
]);

const is_open = defineModel("open", { type: Boolean, default: false });

// greška sa servera, briše se čim korisnik nešto promijeni
const error = defineModel("error", { type: String, default: "" });

const props = defineProps({
  // tipovi sa saldom, null je neograničeno
  leaveTypes: { type: Array, default: () => [] },
  // true dok traje slanje, da se ne klikne dvaput
  busy: { type: Boolean, default: false },
  // tip je već izabran iz menija, forma kreće od 2. koraka
  initialTypeId: { type: Number, default: null }
});

const emit = defineEmits(["submit"]);

const requests_store = useRequestsStore();
const auth_store = useAuthStore();

const step = ref(1);
const leave_type_id = ref(null);
const start_date = ref("");
const end_date = ref("");
const reason = ref("");
const expected_due_date = ref("");
const child_order = ref("1");

// svako otvaranje kreće od prazne forme
watch(is_open, (open) => {
  if (!open) return;

  step.value = props.initialTypeId ? 2 : 1;
  leave_type_id.value = props.initialTypeId;
  start_date.value = "";
  end_date.value = "";
  reason.value = "";
  expected_due_date.value = "";
  child_order.value = "1";
  error.value = "";

  // pravila polise i moji zahtjevi za provjeru prije slanja
  requests_store.fetchSubmitContext();
});

watch([leave_type_id, start_date, end_date, reason, expected_due_date, child_order], () => {
  error.value = "";
});

const groups = computed(() =>
  REQUEST_GROUPS.map((group) => ({
    ...group,
    types: props.leaveTypes.filter((type) => groupKeyOf(type.name) === group.key)
  })).filter((group) => group.types.length)
);

const selected_type = computed(() =>
  props.leaveTypes.find((type) => type.id === leave_type_id.value)
);

const selected_accent = computed(() => {
  const group = REQUEST_GROUPS.find((item) => item.key === groupKeyOf(selected_type.value?.name));
  return resolveColor(group?.accent);
});

const is_fixed_duration = computed(() => Boolean(selected_type.value?.fixed_duration));
// samo porodiljsko traži datum porođaja i redni broj deteta
const is_maternity = computed(() => selected_type.value?.name === MATERNITY_LEAVE);

// kad se promijeni tip, datumi kreću ispočetka
watch(leave_type_id, () => {
  start_date.value = "";
  end_date.value = "";
});

const has_period = computed(() =>
  is_fixed_duration.value
    ? Boolean(start_date.value)
    : Boolean(start_date.value && end_date.value) && end_date.value >= start_date.value
);

// neki tipovi traže razlog (requires_reason)
const can_submit = computed(
  () =>
    has_period.value &&
    (!selected_type.value?.requires_reason || reason.value.trim()) &&
    (!is_maternity.value || (expected_due_date.value && !child_order_error.value))
);

// pravila tipa i polise, backend ih provjerava i sam
const WORK_FROM_HOME = "Rad od kuće";
const MATERNITY_LEAVE = "Porodiljsko";
const ACTIVE_STATUSES = ["PENDING", "APPROVED", "PENDING_CANCELLATION"];

const policy = computed(() => requests_store.policy);

const toIso = (date) => date.toISOString().slice(0, 10);
const addDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
};
// 17. mart 2026. / 17 March 2026
const formatIso = (iso) => longLabel(iso);
const days = (count) => t("common.days", { count });
// "mart 2026." / "March 2026" za poruku o mjesečnom limitu
const monthYearLabel = (iso) =>
  new Intl.DateTimeFormat(intlLocale(), { month: "long", year: "numeric" }).format(fromIso(iso));

// mjesečni limit 0 znači da rad od kuće nije dozvoljen
const isBlockedType = (type) => type.name === WORK_FROM_HOME && wfh_limit.value === 0;

// bez prošlosti i uz minimalnu najavu, raniji dani se ne nude
const min_date = computed(() => {
  const type = selected_type.value;

  if (!type || type.allow_past_dates) return "";

  return addDays(toIso(new Date()), Number(type.min_advance_notice_days) || 0);
});

const min_date_hint = computed(() => {
  if (!min_date.value) return "";

  const notice = Number(selected_type.value?.min_advance_notice_days) || 0;

  return notice
    ? t("requests.submit.notice_hint", { days: days(notice), date: formatIso(min_date.value) })
    : t("requests.submit.no_past");
});

// najraniji datum porođaja je dan poslije početka porodiljskog
const due_date_min = computed(() => (start_date.value ? addDays(start_date.value, 1) : ""));

// trajanje porodiljskog zavisi od reda djeteta
const child_order_error = computed(() =>
  Number.isInteger(Number(child_order.value)) && Number(child_order.value) >= 1
    ? ""
    : t("requests.submit.child_order_error")
);

const duration_hint = computed(() => {
  // smrtni slučaj i davanje krvi, broj dana po zahtjevu
  let count = policy.value?.[PER_REQUEST_POLICY[selected_type.value?.name]];

  if (is_maternity.value) {
    count =
      Number(child_order.value) >= 3
        ? policy.value?.maternity_leave_days_third_plus
        : policy.value?.maternity_leave_days_first_second;
  }

  return count
    ? t("requests.submit.duration_policy", { days: days(Number(count)) })
    : t("requests.submit.duration_auto");
});

// moji aktivni zahtjevi, bez odbijenih i otkazanih
const my_active = computed(() =>
  requests_store.my_requests.filter((request) => ACTIVE_STATUSES.includes(request.status))
);

const day = (value) => String(value ?? "").slice(0, 10);

// prvi i posljednji dan mjeseca YYYY-MM
const monthBounds = (month) => ({
  start: `${month}-01`,
  end: addDays(addDays(`${month}-28`, 7).slice(0, 7) + "-01", -1)
});

// radni dani rada od kuće koje već imam u mjesecu
function wfhUsedIn(month) {
  const { start, end } = monthBounds(month);

  return my_active.value
    .filter((request) => request.leave_type === WORK_FROM_HOME)
    .filter((request) => day(request.start_date) <= end && day(request.end_date) >= start)
    .reduce((sum, request) => {
      const from = day(request.start_date) > start ? day(request.start_date) : start;
      const to = day(request.end_date) < end ? day(request.end_date) : end;

      return sum + countWorkingDays(from, to);
    }, 0);
}

// mjesečni limit rada od kuće, null ako polisa nije učitana
const wfh_limit = computed(() => {
  const limit = policy.value?.work_from_home_monthly_limit;

  return limit === null || limit === undefined ? null : Number(limit);
});

// ovi tipovi ne troše saldo, broj dana je u polisi
const ANNUAL_LEAVE = "Godišnji odmor";
const GENERAL_LEAVE = "Privatni poslovi";
// najviše dana po jednom zahtjevu
const PER_REQUEST_POLICY = {
  "Davanje krvi": "paid_leave_blood_donation_days",
  "Smrtni slučaj": "paid_leave_family_death_days"
};

const policyNumber = (key) => {
  const value = policy.value?.[key];

  return value === null || value === undefined || value === "" ? null : Number(value);
};

// radni dani mojih zahtjeva jednog tipa u godini
function usedInYear(type_name, year) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  return my_active.value
    .filter((request) => request.leave_type === type_name)
    .filter((request) => day(request.start_date) <= end && day(request.end_date) >= start)
    .reduce((sum, request) => {
      const from = day(request.start_date) > start ? day(request.start_date) : start;
      const to = day(request.end_date) < end ? day(request.end_date) : end;

      return sum + countWorkingDays(from, to);
    }, 0);
}

// broj na pločici tipa, uvijek po polisi, null je neograničeno
function countOf(type) {
  if (type.name === WORK_FROM_HOME && wfh_limit.value !== null) {
    return Math.max(wfh_limit.value - wfhUsedIn(toIso(new Date()).slice(0, 7)), 0);
  }

  if (type.remaining !== null) return type.remaining;

  if (type.name === MATERNITY_LEAVE) {
    const first = policyNumber("maternity_leave_days_first_second");
    const third = policyNumber("maternity_leave_days_third_plus");

    if (first !== null && third !== null && first !== third) return `${first} / ${third}`;

    return first ?? third;
  }

  if (type.name === GENERAL_LEAVE && policyNumber("paid_leave_general_days") !== null) {
    const year = new Date().getFullYear();

    return Math.max(policyNumber("paid_leave_general_days") - usedInYear(GENERAL_LEAVE, year), 0);
  }

  if (PER_REQUEST_POLICY[type.name]) return policyNumber(PER_REQUEST_POLICY[type.name]);

  return null;
}

const rule_errors = computed(() => {
  if (!selected_type.value || !start_date.value) return [];

  const errors = [];
  const from = start_date.value;
  const to = is_fixed_duration.value ? start_date.value : end_date.value;

  if (min_date.value && from < min_date.value) errors.push(min_date_hint.value);

  // porodiljsko počinje prije porođaja (nije u dokumentaciji)
  if (is_maternity.value && expected_due_date.value && expected_due_date.value <= from) {
    errors.push(t("requests.submit.due_date_error"));
  }

  // preklapanje sa mojim zahtjevom
  const overlap =
    to &&
    my_active.value.find(
      (request) => day(request.start_date) <= to && day(request.end_date) >= from
    );

  if (overlap) {
    errors.push(
      t("requests.submit.overlap", {
        type: overlap.leave_type,
        period: formatDateRange(overlap.start_date, overlap.end_date)
      })
    );
  }

  // mjesečni limit rada od kuće
  const limit = wfh_limit.value;

  if (selected_type.value.name === WORK_FROM_HOME && to && Number.isFinite(limit)) {
    for (
      let month = from.slice(0, 7);
      month <= to.slice(0, 7);
      month = addDays(`${month}-28`, 7).slice(0, 7)
    ) {
      const { start: month_start, end: month_end } = monthBounds(month);
      const clip = (a, b) =>
        countWorkingDays(a > month_start ? a : month_start, b < month_end ? b : month_end);
      const used = wfhUsedIn(month);
      const requested = clip(from, to);

      if (used + requested > limit) {
        errors.push(
          t("requests.submit.wfh_limit", {
            limit: days(limit),
            month: monthYearLabel(`${month}-01`),
            used,
            requested
          })
        );
      }
    }
  }

  errors.push(...policyErrors(from, to));

  return errors;
});

// ostala pravila polise za izabrani tip
function policyErrors(from, to) {
  const errors = [];
  const name = selected_type.value.name;
  const requested = to ? requested_days.value : 0;
  const year = from.slice(0, 4);

  if (name === ANNUAL_LEAVE) {
    // pravo na godišnji tek poslije perioda od zaposlenja
    const eligibility = policyNumber("eligibility_period_days");
    const hire_date = day(auth_store.profile?.hire_date);

    if (eligibility && hire_date && from < addDays(hire_date, eligibility)) {
      errors.push(
        t("requests.submit.eligibility", {
          days: days(eligibility),
          date: formatIso(addDays(hire_date, eligibility))
        })
      );
    }

    // prvi godišnji u godini mora imati bar first_part_min_days
    const first_part = policyNumber("first_part_min_days");

    if (first_part && to && !usedInYear(ANNUAL_LEAVE, year) && requested < first_part) {
      errors.push(
        t("requests.submit.first_part", {
          year,
          days: t("common.work_days", { count: first_part }),
          selected: requested
        })
      );
    }
  }

  // privatni poslovi, godišnji broj dana iz polise
  const general_limit = policyNumber("paid_leave_general_days");

  if (name === GENERAL_LEAVE && selected_type.value.remaining === null && general_limit !== null) {
    const used = usedInYear(GENERAL_LEAVE, year);

    if (to && used + requested > general_limit) {
      errors.push(
        t("requests.submit.general_limit", { days: days(general_limit), year, used, requested })
      );
    }
  }

  // davanje krvi i smrtni slučaj, najviše dana po zahtjevu
  const per_request = PER_REQUEST_POLICY[name] ? policyNumber(PER_REQUEST_POLICY[name]) : null;

  if (Number.isFinite(per_request) && to && requested > per_request) {
    errors.push(
      t("requests.submit.per_request", {
        type: name,
        days: days(per_request),
        selected: requested
      })
    );
  }

  return errors;
}

// saldo, poruku već prikazuje kartica Bilans, ovdje samo blokiramo slanje
// minus je dozvoljen samo za godišnji odmor
const allowed_negative = computed(() =>
  selected_type.value?.name === ANNUAL_LEAVE && policy.value?.negative_balance_allowed
    ? Number(policy.value.max_negative_balance) || 0
    : 0
);

const balance_blocked = computed(
  () =>
    has_period.value &&
    selected_type.value?.remaining !== null &&
    -left_days.value > allowed_negative.value
);

// praznici u periodu, bez njih bi Preostaje bilo manje nego na backendu
const holiday_dates = ref([]);
let holidays_token = 0;

watch([start_date, end_date], async ([from, to]) => {
  const token = ++holidays_token;

  holiday_dates.value = [];
  if (!from || !to || to < from) return;

  const dates = await requests_store.fetchHolidayDates(from, to);

  // datumi su se u međuvremenu promijenili, ovaj odgovor je zastario
  if (token === holidays_token) holiday_dates.value = dates;
});

const requested_days = computed(() =>
  countWorkingDays(start_date.value, end_date.value, holiday_dates.value)
);
const left_days = computed(() => (selected_type.value?.remaining ?? 0) - requested_days.value);

const stats = computed(() => [
  {
    label: t("requests.balance.available"),
    value: selected_type.value?.remaining,
    icon: iconOf(selected_type.value?.name)
  },
  {
    label: t("requests.balance.requested"),
    value: requested_days.value,
    icon: "watch_later",
    muted: true
  },
  {
    label: t("requests.balance.remaining"),
    value: left_days.value,
    icon: iconOf(selected_type.value?.name)
  }
]);

const balance_message = computed(() => {
  const year = start_date.value.slice(0, 4);

  if (left_days.value < 0 && !balance_blocked.value) {
    return t("requests.submit.negative_allowed", {
      days: days(-left_days.value),
      max: days(allowed_negative.value)
    });
  }

  if (left_days.value < 0) {
    return t("requests.submit.not_enough", { days: days(-left_days.value), year });
  }

  return t("requests.submit.left", {
    days: days(left_days.value),
    type: selected_type.value.name.toLowerCase(),
    year
  });
});

function submit() {
  emit("submit", {
    leave_type_id: leave_type_id.value,
    start_date: start_date.value,
    end_date: is_fixed_duration.value ? "" : end_date.value,
    reason: reason.value.trim(),
    maternity_leave_details: is_maternity.value
      ? { expected_due_date: expected_due_date.value, child_order: Number(child_order.value) }
      : null
  });
}
</script>

<style scoped lang="scss">
.submit-drawer__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-16;
  align-items: start;
}

.submit-drawer__type:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.submit-drawer {
  &__steps {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: $space-12 0;
    list-style: none;
  }

  &__step {
    @include flex(flex-start, center, $space-4, column);
    text-align: center;
  }

  &__track {
    @include flex(center, center, $space-8);
    width: 100%;
    margin-bottom: $space-4;
  }

  &__line {
    flex: 1;
    height: 3px;
    background: $border-default;

    &.is-active {
      background: $border-action;
    }

    &.is-hidden {
      visibility: hidden;
    }
  }

  // broj koraka: siv, crveni okvir dok traje, pun crveni kad je gotov
  &__number {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    margin: $space-4;
    font-size: $text-16;
    line-height: $leading-sm;
    color: $fg-body;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-xl;
  }

  &__step.is-current &__number {
    font-weight: $weight-semibold;
    color: $fg-heading;
    // drugi, spoljašnji krug
    box-shadow:
      0 0 0 3px $surface-default,
      0 0 0 4px $border-action;
    border-color: transparent;
  }

  &__step.is-done &__number {
    color: $fg-on-action;
    background: $border-action;
    border-color: $border-action;
  }

  &__step-title {
    font-size: $text-16;
    font-weight: $weight-regular;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__step-text {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__card {
    @include flex(flex-start, stretch, $space-12, column);
    padding: $space-12;
    background-color: $surface-default;
    background-image: linear-gradient(
      90deg,
      color-mix(in srgb, var(--submit-accent, #{$absence-vacation}) 3%, transparent) 0%,
      transparent 100%
    );
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__card-title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__types {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $space-12 $space-24;
  }

  &__type {
    @include flex(flex-start, center, $space-12);
    min-width: 0;
    padding: $space-8;
    font-family: $font-family;
    text-align: left;
    background: $cold-25;
    border: 1px solid transparent;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: $transition;

    &:hover {
      border-color: $border-default;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
      outline-offset: 1px;
    }

    &.is-selected {
      background: $alpha-primary-5;
      border-color: $border-action;
    }
  }

  &__type-icon,
  &__stat-icon {
    @include flex(center, center);
    flex-shrink: 0;
    color: $fg-on-action;
    background: var(--submit-accent);
    border-radius: $radius-sm;
  }

  &__type-icon {
    width: 2.25rem;
    height: 2.25rem;
  }

  &__type-text,
  &__stat-text {
    @include flex(flex-start, flex-start, 0, column);
    min-width: 0;
  }

  &__type-name {
    @include truncate;
    max-width: 100%;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
  }

  &__type-count {
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__type-unlimited {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__hint {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__period {
    @include flex(flex-start, center, $space-4);
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $space-24;
  }

  &__stat {
    @include flex(flex-start, center, $space-12);
    padding: $space-8;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
  }

  &__stat-icon {
    width: 1.75rem;
    height: 1.75rem;

    &.is-muted {
      color: $fg-heading;
      background: $cold-75;
    }
  }

  &__stat-label {
    font-size: $text-12;
    text-transform: uppercase;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__stat-value {
    font-size: $text-20;
    font-weight: $weight-semibold;
    line-height: $leading-24;
    color: $fg-heading;
  }

  @include respond-to("tablet-sm") {
    &__types,
    &__stats {
      grid-template-columns: minmax(0, 1fr);
      gap: $space-12;
    }
  }
}
</style>
