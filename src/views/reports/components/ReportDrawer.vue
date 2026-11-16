<template>
  <!-- generisanje izvještaja, četiri kartice i footer sa dva dugmeta -->
  <VDrawer v-model:open="is_open" :title="$t('reports.drawer.title')" width="35rem">
    <!-- manji razmak između kartica nego što VDrawer stavlja -->
    <div class="report-drawer">
      <section class="report-drawer__card">
        <div class="report-drawer__heading">
          <h3 class="report-drawer__title">{{ $t("reports.drawer.name_title") }}</h3>
          <p class="report-drawer__text">{{ $t("reports.drawer.name_text") }}</p>
        </div>

        <VBaseInput
          v-model="form.name"
          :label="$t('reports.drawer.name')"
          :placeholder="$t('reports.drawer.name_placeholder')"
          appearance="outlined"
          required
        />
        <VTextarea
          v-model="form.description"
          :label="$t('reports.drawer.description')"
          :placeholder="$t('reports.drawer.description_placeholder')"
          :maxlength="DESCRIPTION_MAX"
        />
      </section>

      <section class="report-drawer__card">
        <div class="report-drawer__heading">
          <h3 class="report-drawer__title">{{ $t("reports.drawer.type_title") }}</h3>
          <p class="report-drawer__text">{{ $t("reports.drawer.type_text") }}</p>
        </div>

        <!-- jedna lista: Kompanija (scope COMPANY) i svaki tim (scope TEAM + team_id) -->
        <VSelect
          v-model="form.target"
          :label="$t('reports.drawer.scope')"
          :placeholder="$t('reports.drawer.scope_placeholder')"
          :options="target_options"
        />
      </section>

      <section class="report-drawer__card">
        <div class="report-drawer__heading">
          <h3 class="report-drawer__title">{{ $t("reports.drawer.period_title") }}</h3>
          <p class="report-drawer__text">{{ $t("reports.drawer.period_text") }}</p>
        </div>

        <div class="report-drawer__dates">
          <VDateInput v-model="form.date_from" :label="$t('reports.drawer.date_from')" required />
          <VDateInput
            v-model="form.date_to"
            :label="$t('reports.drawer.date_to')"
            :min="form.date_from"
            required
          />
        </div>
      </section>

      <section class="report-drawer__card">
        <div class="report-drawer__heading">
          <h3 class="report-drawer__title">{{ $t("reports.drawer.recipients_title") }}</h3>
          <p class="report-drawer__text">{{ $t("reports.drawer.recipients_text") }}</p>
        </div>

        <VBaseInput
          v-model="recipient_search"
          appearance="outlined"
          :placeholder="$t('reports.drawer.recipients_search')"
        >
          <template #icon>
            <VIcon name="search" :size="18" />
          </template>
        </VBaseInput>

        <ul class="report-drawer__recipients">
          <li v-for="user in visible_users" :key="user.id" class="report-drawer__recipient">
            <VCheckbox
              :model-value="form.recipients.includes(user.email)"
              @update:model-value="toggleRecipient(user.email, $event)"
            >
              <strong>{{ script(user.name) }}</strong>
            </VCheckbox>
          </li>

          <li v-if="!visible_users.length" class="report-drawer__empty">
            {{ $t("reports.drawer.recipients_empty") }}
          </li>
        </ul>
      </section>

      <p v-if="error_message" class="report-drawer__error" role="alert">{{ error_message }}</p>
    </div>

    <template #footer>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="!can_submit || is_saving" @click="submit">
        {{ is_saving ? $t("reports.generating") : $t("reports.generate") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VTextarea from "@/components/VTextarea.vue";
import VSelect from "@/components/VSelect.vue";
import VDateInput from "@/components/VDateInput.vue";
import VCheckbox from "@/components/VCheckbox.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import { useReportsStore } from "@/stores/reports";
import { useEmployeesStore } from "@/stores/employees";
import { getErrorCode, getErrorMessage } from "@/utils/api-error";
import { script, t, te } from "@/i18n";

// brojač ispod opisa
const DESCRIPTION_MAX = 120;

// vrijednost opcije Kompanija u listi Opseg, timovi imaju svoj id
const COMPANY = "COMPANY";

// greške iz 16.1 imaju prevod (reports.errors), ostale idu kroz getErrorMessage
const reportError = (error) => {
  const key = `reports.errors.${String(getErrorCode(error) ?? "").replaceAll(".", "_")}`;

  return te(key) ? t(key) : getErrorMessage(error, t("common.states.error"));
};

const is_open = defineModel("open", { type: Boolean, default: false });

const emit = defineEmits(["generated"]);

const reports_store = useReportsStore();
const employees_store = useEmployeesStore();

const createForm = () => ({
  name: "",
  description: "",
  target: COMPANY,
  date_from: "",
  date_to: "",
  // API 16.1 prima recipients kao listu email adresa
  recipients: []
});

const form = ref(createForm());
const recipient_search = ref("");
const is_saving = ref(false);
const error_message = ref("");

// svako otvaranje kreće od praznog formulara
watch(is_open, (open) => {
  if (!open) return;

  form.value = createForm();
  recipient_search.value = "";
  error_message.value = "";
});

const target_options = computed(() => [
  { value: COMPANY, label: t("reports.drawer.company") },
  ...employees_store.team_options
]);

// samo aktivni zaposleni sa email adresom, filtrirani pretragom
const visible_users = computed(() => {
  const query = recipient_search.value.trim().toLowerCase();

  return employees_store.all_users.filter(
    (user) =>
      user.status !== "DEACTIVATED" &&
      user.email &&
      (!query || user.name.toLowerCase().includes(query))
  );
});

function toggleRecipient(email, checked) {
  const recipients = form.value.recipients.filter((item) => item !== email);

  form.value.recipients = checked ? [...recipients, email] : recipients;
}

// obavezno ime, opseg i oba datuma (datum do ne prije datuma od)
const can_submit = computed(() => {
  const { name, target, date_from, date_to } = form.value;

  return Boolean(name.trim() && target && date_from && date_to && date_to >= date_from);
});

async function submit() {
  if (!can_submit.value) return;

  const { name, description, target, date_from, date_to, recipients } = form.value;

  is_saving.value = true;
  error_message.value = "";

  const error = await reports_store.generateReport({
    name: name.trim(),
    description: description.trim(),
    scope: target === COMPANY ? "COMPANY" : "TEAM",
    team_id: target === COMPANY ? null : target,
    date_from,
    date_to,
    recipients
  });

  is_saving.value = false;

  // panel ostaje otvoren sa porukom, da korisnik ne izgubi unos
  if (error) {
    error_message.value = reportError(error);
    return;
  }

  is_open.value = false;
  emit("generated");
}
</script>

<style lang="scss" scoped>
.report-drawer {
  @include flex(flex-start, stretch, $space-16, column);

  // svaka cjelina je svijetlo siva kutija sa tankim okvirom
  &__card {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__heading {
    @include flex(flex-start, flex-start, $space-8, column);
  }

  &__title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__text {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  // Datum od i Datum do jedan pored drugog
  &__dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-16;
  }

  // lista ima svoj tanki skrol, oko 8 redova
  &__recipients {
    @include flex(flex-start, stretch, $space-8, column);
    max-height: 25.125rem;
    padding: 0 $space-10 0 0;
    list-style: none;
    @include thin-scrollbar;
  }

  // ime lijevo, checkbox desno, linija ispod reda
  &__recipient {
    flex-shrink: 0;
    padding: $space-8;
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-heading;
    background: $surface-default;
    border-bottom: 1px solid $border-default;
  }

  &__empty {
    padding: $space-8;
    font-size: $text-12;
    color: $fg-body;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }
}
</style>
