<template>
  <VDrawer
    v-model:open="is_open"
    :title="$t('employees.details.title')"
    :transition="transition"
  >
    <template v-if="editable" #actions>
      <button
        type="button"
        class="employee-details__edit"
        :aria-label="$t('employees.actions.edit')"
        :disabled="!employee"
        @click="emit('edit')"
      >
        <VIcon name="edit_note" :size="24" />
      </button>
    </template>

    <p v-if="is_loading" class="employee-details__message">
      {{ $t("common.states.loading") }}
    </p>

    <p v-else-if="error_message" class="employee-details__error" role="alert">
      {{ error_message }}
    </p>

    <template v-else-if="employee">
      <div class="employee-details__top">
        <EmployeeSummary :employee="employee" />

        <dl class="employee-details__info">
          <div v-for="item in info_items" :key="item.label" class="employee-details__info-item">
            <span class="employee-details__info-icon" aria-hidden="true">
              <VIcon :name="item.icon" :size="24" />
            </span>
            <div class="employee-details__info-text">
              <dt>{{ item.label }}</dt>
              <dd>{{ item.value || "—" }}</dd>
            </div>
          </div>
        </dl>
      </div>

      <section class="employee-details__stats">
        <h3 class="employee-details__stats-title">{{ $t("employees.details.stats") }}</h3>

        <p v-if="!stat_groups.length" class="employee-details__message">
          {{ $t("employees.details.no_stats") }}
        </p>

        <section
          v-for="group in stat_groups"
          :key="group.key"
          class="employee-details__group"
          :style="{ '--stat-accent': resolveColor(group.accent) }"
        >
          <h4 class="employee-details__group-title">
            {{ $te(group.title) ? $t(group.title) : group.title }}
          </h4>

          <ul class="employee-details__group-list">
            <li v-for="item in group.items" :key="item.id" class="employee-details__stat">
              <span class="employee-details__stat-icon" aria-hidden="true">
                <VIcon :name="item.icon" :size="20" />
              </span>
              <div class="employee-details__stat-text">
                <span class="employee-details__stat-name">{{ item.name }}</span>
                <span v-if="item.unlimited" class="employee-details__stat-unlimited">
                  {{ $t("employees.details.unlimited") }}
                </span>
                <span v-else class="employee-details__stat-value">
                  <strong>{{ item.remaining }}</strong>
                  <span class="employee-details__stat-slash">/</span>
                  <span class="employee-details__stat-total">{{ item.total }}</span>
                </span>
              </div>
            </li>
          </ul>
        </section>
      </section>
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" :employee="employee" />
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VIcon from "@/components/VIcon.vue";
import { ROLE_LABELS, useEmployeesStore } from "@/stores/employees";
import { useDate } from "@/composables/useDate";
import { getErrorMessage } from "@/utils/api-error";
import { leaveTypeName } from "@/utils/leave-type-name";
import { resolveColor } from "@/utils/color";
import { REQUEST_GROUPS, groupKeyOf, iconOf } from "@/views/requests/request-config";
import { RELIGION_OPTIONS } from "../employee-config";
import EmployeeSummary from "./EmployeeSummary.vue";
import { t } from "@/i18n";

const is_open = defineModel("open", { type: Boolean, default: false });

const props = defineProps({
  employeeId: { type: Number, default: null },
  transition: { type: String, default: "slide" },
  editable: { type: Boolean, default: true }
});

const emit = defineEmits(["edit"]);

const employees_store = useEmployeesStore();
const { formatDate } = useDate();

// odgovor 4.3 getSingleUser i 13.2 getUserLeaveBalances
const employee = ref(null);
const balances = ref([]);
const is_loading = ref(false);
const error_message = ref("");

watch(is_open, async (open) => {
  if (!open) return;

  employee.value = null;
  balances.value = [];
  error_message.value = "";
  is_loading.value = true;

  const [user, balance] = await Promise.all([
    employees_store.fetchEmployee(props.employeeId),
    employees_store.fetchEmployeeBalances(props.employeeId)
  ]);

  is_loading.value = false;

  if (user.error) {
    error_message.value = getErrorMessage(user.error);
    return;
  }

  employee.value = user.data;
  // bez prava na salda (403) panel i dalje prikazuje osnovne podatke, samo bez statistike
  balances.value = balance.data ?? [];
});

const manager_name = computed(
  () => employees_store.all_users.find((user) => user.id === employee.value?.manager_id)?.name ?? ""
);

const info_items = computed(() => {
  const data = employee.value;

  return [
    {
      label: t("employees.fields.role"),
      icon: "badge",
      value: ROLE_LABELS[data.role?.name] ?? data.role?.name
    },
    {
      label: t("employees.fields.hire_date"),
      icon: "calendar_month",
      value: data.hire_date ? formatDate(data.hire_date, { dateOnly: true }) : ""
    },
    { label: t("employees.fields.email_address"), icon: "mail_outline", value: data.email },
    {
      label: t("employees.fields.confession"),
      icon: "menu_book",
      value: RELIGION_OPTIONS.find((option) => option.value === data.religion)?.label
    },
    { label: t("employees.fields.manager"), icon: "manage_accounts", value: manager_name.value },
    { label: t("employees.fields.phone"), icon: "local_phone", value: data.phone_number }
  ];
});

// salda raspoređena u iste grupe kao na stranici zahteva; prazne grupe se ne prikazuju
const stat_groups = computed(() =>
  REQUEST_GROUPS.map((group) => ({
    ...group,
    items: balances.value
      .map((balance) => {
        const name = leaveTypeName(balance.leave_type_name);

        return {
          id: balance.leave_type_id,
          name,
          icon: iconOf(name),
          group: groupKeyOf(name),
          unlimited: !balance.counts_against_balance,
          remaining: Number(balance.remaining_days),
          total: Number(balance.allocated_days)
        };
      })
      .filter((item) => item.group === group.key)
  })).filter((group) => group.items.length)
);
</script>

<style lang="scss" scoped>
.employee-details {
  &__edit {
    @include flex(center, center);
    padding: 0;
    color: $fg-heading;
    background: transparent;
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;

    &:disabled {
      color: $fg-action-disabled;
      cursor: default;
    }

    &:focus-visible {
      outline: 1px solid $border-action-focused;
    }
  }

  &__top {
    @include flex(flex-start, stretch, $space-12, column);
  }

  &__info {
    display: grid;
    grid-template-columns: minmax(7.5rem, 1fr) minmax(8.75rem, 1fr) minmax(0, 1.6fr);
    gap: $space-16 $space-16;
    padding: $space-24 $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__info-item {
    @include flex(flex-start, center, $space-10);
    min-width: 0;
  }

  &__info-icon {
    @include flex(center, center);
    flex-shrink: 0;
    padding: $space-4;
    color: $fg-action;
    background: alpha($primary, 0.05);
    border-radius: $radius-pill;
  }

  &__info-text {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
    font-size: $text-12;
    line-height: $leading-xs;

    dt {
      color: $fg-body;
    }

    dd {
      max-width: 100%;
      overflow-wrap: anywhere;
      color: $fg-heading;
    }
  }

  &__stats {
    @include flex(flex-start, stretch, $space-12, column);
  }

  &__stats-title {
    margin-bottom: $space-4;
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__group {
    @include flex(flex-start, stretch, $space-12, column);
    padding: $space-12;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--stat-accent) 3%, transparent) 0%,
      transparent 100%
    );
    border: 1px solid $cold-50;
    border-radius: $radius-xs;
  }

  &__group-title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__group-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-12 $space-16;
  }

  &__stat {
    @include flex(flex-start, center, $space-8);
    min-width: 0;
  }

  &__stat-icon {
    @include flex(center, center);
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    color: $white;
    background: var(--stat-accent);
    border-radius: $radius-sm;
  }

  &__stat-text {
    @include flex(flex-start, flex-start, $space-4, column);
    min-width: 0;
  }

  &__stat-name {
    @include truncate;
    max-width: 100%;
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
  }

  &__stat-unlimited {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__stat-value {
    @include flex(flex-start, baseline);
    line-height: $leading-sm;

    strong {
      font-size: $text-16;
      font-weight: $weight-semibold;
      color: $fg-heading;
    }
  }

  &__stat-slash {
    font-size: $text-16;
    color: $fg-body;
  }

  &__stat-total {
    font-size: $text-14;
    color: $fg-body;
  }

  &__message {
    font-size: $text-14;
    color: $fg-body;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  @include respond-to("tablet-sm") {
    &__info {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__group-list {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}
</style>
