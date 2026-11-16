<template>
  <div class="policy">
    <div class="policy__header">
      <VPageHeader :title="$t('policy.title')" :description="$t('policy.description')" />
    </div>

    <VTabs v-model="tab" class="policy__tabs" :tabs="tabs" />

    <p v-if="policy_store.is_loading && !policy_store.current" class="policy__message">
      {{ $t("common.states.loading") }}
    </p>
    <p v-else-if="policy_store.error" class="policy__message">
      {{ getErrorMessage(policy_store.error, $t("common.states.error")) }}
    </p>

    <!-- tab Zakazana kad nema zakazane izmjene -->
    <p v-else-if="!source" class="policy__message">
      {{ $t("policy.no_scheduled") }}
    </p>

    <template v-else>
      <!-- traka: status polise levo, datum stupanja na snagu desno -->
      <div class="policy__bar">
        <div class="policy__status">
          <VChip :tone="status.tone" :icon="status.icon">{{ status.label }}</VChip>
          <p class="policy__status-text">{{ status.text }}</p>
        </div>

        <!-- datum se bira samo za novu izmjenu, zakazana polisa zadržava svoj -->
        <VDateInput
          v-if="tab === 'current'"
          v-model="effective_from"
          class="policy__effective"
          :label="$t('policy.effective_from')"
          :min="tomorrow"
          required
        />
      </div>

      <!-- tri kolone sa karticama iz policy-config.js i dodatna podešavanja -->
      <div class="policy__groups">
        <PolicyGroup
          v-for="group in POLICY_GROUPS"
          :key="group.key"
          :title="$t(group.title)"
          :accent="group.accent"
        >
          <PolicyCard
            v-for="card in visibleCards(group)"
            :key="card.key"
            :title="$t(card.title)"
            :icon="card.icon"
          >
            <PolicyField
              v-for="field in card.fields"
              :key="field.key"
              v-model="form[field.key]"
              :field="field"
              :form="form"
            />
          </PolicyCard>
        </PolicyGroup>

        <PolicyGroup :title="$t('policy.settings_title')" accent="primary">
          <PolicySettings v-model:form="form" />
        </PolicyGroup>
      </div>

      <footer class="policy__footer">
        <VBaseButton
          v-if="tab === 'current'"
          appearance="tonal"
          color="error"
          :disabled="defaults_applied"
          @click="applyDefaults"
        >
          {{ $t("policy.actions.reset_defaults") }}
        </VBaseButton>
        <VBaseButton v-else appearance="tonal" color="error" @click="is_cancel_open = true">
          {{ $t("policy.actions.cancel_scheduled") }}
        </VBaseButton>

        <VNotice v-if="notice" :tone="notice.tone" class="policy__notice">
          {{ notice.text }}
        </VNotice>

        <div class="policy__actions">
          <VBaseButton
            appearance="outlined"
            color="neutral"
            :disabled="!is_dirty"
            @click="resetForm"
          >
            {{ $t("common.actions.cancel") }}
          </VBaseButton>
          <!-- nova izmjena se zakazuje, a postojeća zakazana se samo mijenja -->
          <VBaseButton
            :disabled="!is_dirty || !is_valid || !effective_from || policy_store.is_saving"
            @click="save"
          >
            {{
              tab === "current" ? $t("policy.actions.schedule") : $t("common.actions.save_changes")
            }}
          </VBaseButton>
        </div>
      </footer>
    </template>

    <PolicyCancelDialog
      v-model:open="is_cancel_open"
      :effective-from="formatDay(policy_store.scheduled?.effective_from)"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VTabs from "@/components/VTabs.vue";
import VChip from "@/components/VChip.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VDateInput from "@/components/VDateInput.vue";
import VNotice from "@/components/VNotice.vue";
import PolicyGroup from "./components/PolicyGroup.vue";
import PolicyCard from "./components/PolicyCard.vue";
import PolicyField from "./components/PolicyField.vue";
import PolicySettings from "./components/PolicySettings.vue";
import PolicyCancelDialog from "./components/PolicyCancelDialog.vue";
import {
  POLICY_GROUPS,
  isValidField,
  isVisible,
  normalizeNullable,
  visibleNumberFields
} from "./policy-config";
import { pickPolicy, usePolicyStore } from "@/stores/policy";
import { getErrorMessage } from "@/utils/api-error";
import { intlLocale, t } from "@/i18n";

const tabs = computed(() => [
  { value: "current", label: t("policy.tabs.current"), icon: "verified" },
  { value: "scheduled", label: t("policy.tabs.scheduled") }
]);

const policy_store = usePolicyStore();

const tab = ref("current");

// aktivna ili zakazana polisa, null ako nema zakazane
const source = computed(() =>
  tab.value === "current" ? policy_store.current : policy_store.scheduled
);

// forma je kopija polise, na server ide tek na Sačuvaj izmene
const form = ref({});
const defaults_applied = ref(false);
const is_cancel_open = ref(false);

// zakazana polisa već ima datum, za novu ga bira korisnik
const effective_from = ref("");
const initialEffectiveFrom = () =>
  tab.value === "scheduled" ? (source.value?.effective_from ?? "").slice(0, 10) : "";

// F-8.5: polisa najranije stupa na snagu sutra
const tomorrow = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
})();

function resetForm() {
  form.value = pickPolicy(source.value);
  effective_from.value = initialEffectiveFrom();
  defaults_applied.value = false;
}

// kad se promijeni tab ili stignu novi podaci, forma kreće ispočetka
watch(source, resetForm);

// 2027-01-01 u 01.01.2027. (ili 01/01/2027 na engleskom), u UTC da zona ne pomjeri dan
const formatDay = (value) =>
  value
    ? new Intl.DateTimeFormat(intlLocale(), {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC"
      }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
    : "";

const status = computed(() => {
  if (tab.value === "current") {
    return {
      label: t("policy.status.active"),
      tone: "active",
      icon: "check_circle",
      text: t("policy.status.active_text", { date: formatDay(source.value.effective_from) })
    };
  }

  return {
    label: t("policy.status.pending"),
    tone: "pending",
    icon: "access_time_filled",
    text: t("policy.status.pending_text", { date: formatDay(source.value.effective_from) })
  };
});

// ima li izmjena u odnosu na server, prazno polje je isto što i null
const is_dirty = computed(
  () =>
    JSON.stringify(normalizeNullable(form.value)) !== JSON.stringify(pickPolicy(source.value)) ||
    effective_from.value !== initialEffectiveFrom()
);

const is_valid = computed(() =>
  visibleNumberFields(form.value).every((field) => isValidField(field, form.value[field.key]))
);

// poruka u dnu: narandžasta je upozorenje, siva samo obavještenje
const notice = computed(() => {
  if (tab.value === "scheduled") {
    if (!is_dirty.value) return null;

    return {
      tone: "info",
      text: t("policy.notices.scheduled_change", { date: formatDay(effective_from.value) })
    };
  }

  if (!effective_from.value) {
    return {
      tone: "warning",
      text: t("policy.notices.date_required")
    };
  }

  if (defaults_applied.value) {
    return {
      tone: "warning",
      text: t("policy.notices.defaults_replace", { date: formatDay(effective_from.value) })
    };
  }

  // 2.4 je upsert, nova izmjena briše postojeću zakazanu
  if (is_dirty.value && policy_store.scheduled) {
    return {
      tone: "warning",
      text: t("policy.notices.replace_scheduled")
    };
  }

  return null;
});

// kartice sa `visible` (npr. rođendan) se crtaju samo dok su uključene u formi
const visibleCards = (group) => group.cards.filter((card) => isVisible(card, form.value));

async function applyDefaults() {
  const { data, error } = await policy_store.fetchDefaultPolicy();

  if (error) {
    window.alert(getErrorMessage(error, t("common.states.error")));
    return;
  }

  form.value = pickPolicy(data);
  defaults_applied.value = true;
}

async function save() {
  const error = await policy_store.schedulePolicy(
    normalizeNullable(form.value),
    effective_from.value
  );

  if (error) {
    window.alert(getErrorMessage(error, t("common.states.error")));
    return;
  }

  // sačuvana izmjena je sada zakazana, pa nju prikazujemo
  tab.value = "scheduled";
  resetForm();
}

onMounted(() => policy_store.fetchPolicies());
</script>

<style lang="scss" scoped>
.policy {
  display: grid;
  // header, tabovi, traka, kolone (rastu), dno
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  // jedna kolona, da dugi tekst ne gura stranicu udesno
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  background: $surface-background;

  &__header {
    position: relative;
    z-index: 1;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  &__tabs {
    margin-top: $space-12;

    // ikona aktivnog taba je crvena
    :deep(.v-icon) {
      color: $fg-action;
    }
  }

  &__message {
    grid-row: 3 / -1;
    padding: $space-24 $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;
  }

  &__bar {
    @include flex(space-between, center, $space-16);
    flex-wrap: wrap;
    padding: $space-12 $space-16 $space-12 $space-8;
    background: $cold-50;
    border-bottom: 1px solid $border-default;
  }

  &__status {
    @include flex(flex-start, center, $space-12);
    flex-wrap: wrap;
    padding: $space-12 $space-16;
  }

  &__status-text {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  // polje desno u traci
  &__effective {
    width: 26.75rem;
    max-width: 100%;
  }

  // četiri kolone, svaka skroluje sama, stranica ne skroluje
  &__groups {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    min-height: 0;
    padding: 0 $space-4;
    background: $cold-50;
  }

  &__footer {
    @include flex(space-between, center, $space-16);
    padding: $space-16;
    background: $surface-default;
    border-top: 1px solid $border-default;
  }

  // okvir je širok koliko tekst, duža poruka se prelama do 40rem
  &__notice {
    flex: 0 1 auto;
    max-width: 40rem;
    margin-left: auto;
  }

  &__actions {
    @include flex(flex-end, center, $space-16);
  }

  // uži ekran: kolone jedna ispod druge, pa skroluje ceo deo sa karticama
  @include respond-to("laptop-sm") {
    &__groups {
      grid-template-columns: minmax(0, 1fr);
      // svaki red visok koliko i njegova kolona (bez ovoga se kolone preklapaju)
      grid-auto-rows: max-content;
      overflow-y: auto;
    }

    // lista ne skroluje sama, visoka je koliko kartice
    &__groups :deep(.policy-group__list) {
      flex: none;
      overflow: visible;
    }

    &__footer {
      flex-wrap: wrap;
    }

    &__notice {
      order: -1;
      flex-basis: 100%;
      max-width: none;
    }
  }

  @include respond-to("tablet-sm") {
    &__header {
      padding: $space-8;
    }

    // na telefonu tabovi skroluju vodoravno, overflow-y mora zbog margin-bottom -1px
    &__tabs {
      overflow-x: auto;
      overflow-y: hidden;
    }

    &__status {
      padding: $space-8;
    }

    &__actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
