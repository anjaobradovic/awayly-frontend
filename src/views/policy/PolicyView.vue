<template>
  <div :class="['policy', { 'is-editing': is_editing }]">
    <Teleport defer to="#navbar-actions">
      <VBaseButton v-if="source && !is_editing" size="header" @click="startEditing">
        <VIcon name="edit" :size="16" />
        {{ view === "current" ? $t("policy.actions.edit") : $t("policy.actions.edit_scheduled") }}
      </VBaseButton>
    </Teleport>

    <div class="policy__header">
      <VPageHeader :title="$t('policy.title')" :description="$t('policy.description')">
        <!-- aktivna / zakazana, samo kad zakazana postoji -->
        <template v-if="policy_store.scheduled" #actions>
          <VSegmentedButton
            v-model="view"
            :class="{ 'is-locked': is_editing }"
            size="header"
            :options="view_options"
            :aria-label="$t('policy.views.label')"
          />
        </template>
      </VPageHeader>
    </div>

    <div ref="content_ref" class="policy__content" @scroll.passive="onScroll">
      <p v-if="policy_store.is_loading && !policy_store.current" class="policy__message">
        {{ $t("common.states.loading") }}
      </p>
      <p v-else-if="policy_store.error" class="policy__message is-error" role="alert">
        {{ getErrorMessage(policy_store.error, $t("common.states.error")) }}
      </p>

      <template v-else-if="source">
        <PolicyOverview
          v-model:view="view"
          :source="source"
          :scheduled="policy_store.scheduled"
          :locked="is_editing"
          @cancel="is_cancel_open = true"
        />

        <div class="policy__body">
          <PolicyNav
            :sections="POLICY_SECTIONS"
            :active="active_section"
            :changes="is_editing ? changes_by_section : {}"
            :errors="is_editing ? errors_by_section : {}"
            @select="scrollToSection"
          />

          <div class="policy__sections">
            <PolicyGroup
              v-for="section in POLICY_SECTIONS"
              :key="section.key"
              :ref="(component) => setSectionRef(section.key, component)"
              v-model:form="form"
              :section="section"
              :original="original"
              :editing="is_editing"
              :changes="changes_by_section[section.key] ?? 0"
            />
          </div>
        </div>
      </template>
    </div>

    <PolicyActionBar
      v-if="is_editing && source"
      v-model:effective-from="effective_from"
      :view="view"
      :changes="changed_fields.length"
      :errors="invalid.length"
      :notice="notice"
      :min="tomorrow"
      :can-save="can_save"
      :defaults-applied="defaults_applied"
      @reset-defaults="applyDefaults"
      @cancel="stopEditing"
      @save="save"
    />

    <PolicyCancelDialog
      v-model:open="is_cancel_open"
      :effective-from="formatDay(policy_store.scheduled?.effective_from)"
      @cancelled="view = 'current'"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import PolicyOverview from "./components/PolicyOverview.vue";
import PolicyNav from "./components/PolicyNav.vue";
import PolicyGroup from "./components/PolicyGroup.vue";
import PolicyActionBar from "./components/PolicyActionBar.vue";
import PolicyCancelDialog from "./components/PolicyCancelDialog.vue";
import {
  ALL_FIELDS,
  POLICY_SECTIONS,
  invalidFields,
  isChanged,
  isVisible,
  normalizePolicy
} from "./policy-config";
import { pickPolicy, usePolicyStore } from "@/stores/policy";
import { getErrorMessage } from "@/utils/api-error";
import { intlLocale, t } from "@/i18n";

const policy_store = usePolicyStore();

// "current" = aktivna polisa, "scheduled" = zakazana izmjena
const view = ref("current");

const view_options = computed(() => [
  { value: "current", label: t("policy.views.current") },
  { value: "scheduled", label: t("policy.views.scheduled") }
]);

// aktivna ili zakazana polisa
const source = computed(() =>
  view.value === "scheduled" && policy_store.scheduled ? policy_store.scheduled : policy_store.current
);

// bez zakazane nema ni njenog prikaza (npr. posle otkazivanja)
watch(
  () => policy_store.scheduled,
  (scheduled) => {
    if (!scheduled) view.value = "current";
  }
);

// vrijednosti sa servera i forma (kopija), na server ide tek na Zakaži / Sačuvaj
const original = computed(() => pickPolicy(source.value));
const form = ref({});
const is_editing = ref(false);
const defaults_applied = ref(false);
const is_cancel_open = ref(false);

// zakazana polisa već ima datum, za novu ga bira korisnik
const effective_from = ref("");
const initialEffectiveFrom = () =>
  view.value === "scheduled" ? (source.value?.effective_from ?? "").slice(0, 10) : "";

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

// kad se promijeni prikaz ili stignu novi podaci, forma kreće ispočetka
watch(source, resetForm);

function startEditing() {
  resetForm();
  is_editing.value = true;
}

function stopEditing() {
  resetForm();
  is_editing.value = false;
}

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

// izmijenjena polja koja se vide (skriveno zavisno polje se ne računa)
const changed_fields = computed(() =>
  ALL_FIELDS.filter(
    (field) => isVisible(field, form.value) && isChanged(field, form.value, original.value)
  )
);

const invalid = computed(() => invalidFields(form.value));

const countBySection = (fields) =>
  fields.reduce((counts, field) => {
    counts[field.section] = (counts[field.section] ?? 0) + 1;
    return counts;
  }, {});

const changes_by_section = computed(() => countBySection(changed_fields.value));
const errors_by_section = computed(() => countBySection(invalid.value));

// ima li izmjena u odnosu na server (i skriveno polje se šalje, pa ga poredimo cijelog)
const is_dirty = computed(
  () =>
    ALL_FIELDS.some((field) => isChanged(field, form.value, original.value)) ||
    effective_from.value !== initialEffectiveFrom()
);

const can_save = computed(
  () => is_dirty.value && !invalid.value.length && Boolean(effective_from.value) && !policy_store.is_saving
);

// poruka iznad dugmadi: narandžasta je upozorenje, plava samo obavještenje
const notice = computed(() => {
  if (view.value === "scheduled") {
    if (!is_dirty.value) return null;

    return {
      tone: "info",
      text: t("policy.notices.scheduled_change", { date: formatDay(effective_from.value) })
    };
  }

  if (!is_dirty.value) return null;

  if (!effective_from.value) {
    return { tone: "warning", text: t("policy.notices.date_required") };
  }

  if (defaults_applied.value) {
    return {
      tone: "warning",
      text: t(
        policy_store.scheduled ? "policy.notices.defaults_replace" : "policy.notices.defaults_applied",
        { date: formatDay(effective_from.value) }
      )
    };
  }

  // 2.4 je upsert, nova izmjena briše postojeću zakazanu
  if (policy_store.scheduled) {
    return { tone: "warning", text: t("policy.notices.replace_scheduled") };
  }

  return null;
});

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
  const error = await policy_store.schedulePolicy(normalizePolicy(form.value), effective_from.value);

  if (error) {
    window.alert(getErrorMessage(error, t("common.states.error")));
    return;
  }

  // sačuvana izmjena je sada zakazana, pa nju prikazujemo
  is_editing.value = false;
  view.value = "scheduled";
  resetForm();
  content_ref.value?.scrollTo({ top: 0, behavior: "smooth" });
}

// nav levo: klik skroluje do odeljka, a skrolovanje bira aktivni odeljak
const content_ref = ref(null);
const section_refs = {};
const active_section = ref(POLICY_SECTIONS[0].key);

const setSectionRef = (key, component) => {
  if (component) section_refs[key] = component.$el;
  else delete section_refs[key];
};

// dok traje skrol na klik, scroll-spy ne prepisuje izabrani odeljak
let scroll_lock = 0;

function scrollToSection(key) {
  const element = section_refs[key];

  if (!element) return;

  active_section.value = key;
  scroll_lock = Date.now() + 800;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

let frame = 0;

function onScroll() {
  if (frame) return;

  frame = requestAnimationFrame(() => {
    frame = 0;
    if (Date.now() < scroll_lock) return;

    const container = content_ref.value;

    if (!container) return;

    // na dnu je aktivan poslednji odeljak, i kad je kratak
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
      active_section.value = POLICY_SECTIONS[POLICY_SECTIONS.length - 1].key;
      return;
    }

    const top = container.getBoundingClientRect().top + container.clientHeight * 0.3;
    let current = POLICY_SECTIONS[0].key;

    for (const section of POLICY_SECTIONS) {
      const element = section_refs[section.key];

      if (element && element.getBoundingClientRect().top <= top) current = section.key;
    }

    active_section.value = current;
  });
}

// pri prelasku između aktivne i zakazane, vrh stranice
watch(view, async () => {
  await nextTick();
  onScroll();
});

// promjena širine pomjera odeljke, aktivni se računa ponovo
onMounted(() => {
  policy_store.fetchPolicies();
  window.addEventListener("resize", onScroll);
});

onUnmounted(() => {
  window.removeEventListener("resize", onScroll);
  cancelAnimationFrame(frame);
});
</script>

<style lang="scss" scoped>
.policy {
  display: grid;
  // header, sadržaj (skroluje), traka za izmjenu
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  background: $cold-50;

  &__header {
    position: relative;
    z-index: 4;
    padding: $space-12 $space-16;
    background: $surface-default;
    box-shadow: $shadow-header;
  }

  // dok traje izmjena prikaz se ne mijenja
  .is-locked {
    pointer-events: none;
    opacity: 0.5;
  }

  &__content {
    @include flex(flex-start, stretch, $space-16, column);
    position: relative;
    min-height: 0;
    padding: $space-16;
    overflow-y: auto;
    @include thin-scrollbar;

    // kartice se ne skupljaju, sadržaj skroluje
    > * {
      flex-shrink: 0;
    }
  }

  &__message {
    padding: $space-24 $space-16;
    font-size: $text-14;
    color: $fg-body;
    text-align: center;

    &.is-error {
      color: $fg-error;
    }
  }

  // nav levo, odeljci desno
  &__body {
    display: grid;
    grid-template-columns: 15.5rem minmax(0, 1fr);
    align-items: start;
    gap: $space-16;
  }

  &__sections {
    @include flex(flex-start, stretch, $space-16, column);
    min-width: 0;
    max-width: 60rem;
  }

  // usko: nav postaje traka sa čipovima iznad odeljaka
  @include respond-to("tablet") {
    &__body {
      grid-template-columns: minmax(0, 1fr);
      gap: $space-12;
    }

    &__sections {
      max-width: none;
    }
  }

  @include respond-to("tablet-sm") {
    &__header {
      padding: $space-8;
    }
  }

  @include respond-to("mobile") {
    &__content {
      gap: $space-12;
      padding: $space-12;
    }
  }
}
</style>
