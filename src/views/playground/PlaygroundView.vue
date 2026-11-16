<script setup>
import { ref } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VStepNumber from "@/components/VStepNumber.vue";
import VOtpInput from "@/components/VOtpInput.vue";
import VStatCard from "@/components/VStatCard.vue";
import VStatItem from "@/components/VStatItem.vue";
import VIcon from "@/components/VIcon.vue";
import VPageHeader from "@/components/VPageHeader.vue";
import VTabs from "@/components/VTabs.vue";
import VDropdown from "@/components/VDropdown.vue";
import VTable from "@/components/VTable.vue";
import VPagination from "@/components/VPagination.vue";
import VDatePicker from "@/components/VDatePicker.vue";
import VDateInput from "@/components/VDateInput.vue";
import VDateRangePicker from "@/components/VDateRangePicker.vue";
import VDateRangeInput from "@/components/VDateRangeInput.vue";

const email = ref("");
const password = ref("");
const query = ref("");

//kartice iznad kalendara
const code = ref("");
// ovako bi podatke vratio store
const absence_groups = ref([
  {
    id: "vacation",
    title: "Godišnji i rad od kuće",
    accent: "absence-vacation",
    types: [
      { id: "annual", icon: "beach_access", label: "Godišnji odmor", count: 8 },
      { id: "remote", icon: "maps_home_work", label: "Rad od kuće", count: 2 }
    ]
  },
  {
    id: "family",
    title: "Porodica i zdravlje",
    accent: "absence-family",
    types: [
      { id: "sick", icon: "local_hotel", label: "Bolovanje", count: 1 },
      { id: "pregnancy", icon: "pregnant_woman", label: "Trudničko", count: null },
      { id: "parental", icon: "family_restroom", label: "Roditeljsko", count: null },
      { id: "maternity", icon: "child_friendly", label: "Porodiljsko", count: 1 }
    ]
  },
  {
    id: "paid",
    title: "Plaćeno odsustvo",
    accent: "absence-paid",
    types: [
      { id: "private", icon: "work_outline", label: "Privatni poslovi", count: 2 },
      { id: "blood", icon: "bloodtype", label: "Davanje krvi", count: null },
      { id: "slava", icon: "celebration", label: "Krsna slava", count: null },
      { id: "funeral", icon: "local_florist", label: "Smrtni slučaj", count: null }
    ]
  },
  {
    id: "other",
    title: "Ostalo",
    accent: "absence-other",
    types: [{ id: "unpaid", icon: "money_off", label: "Neplaćeno odustvo", count: 1 }]
  }
]);
function selectType(group, type) {
  console.log("filtriraj kalendar:", group.id, type.id);
}

// VTabs
const tabs = [
  { value: "calendar", label: "Kalendar", icon: "calendar_month" },
  { value: "requests", label: "Zahtevi", icon: "inbox" },
  { value: "holidays", label: "Praznici" }
];
const active_tab = ref("calendar");

// VTable + VPagination
const columns = [
  { key: "name", label: "Ime i prezime", sortable: true },
  { key: "type", label: "Tip odsustva", sortable: true },
  { key: "from", label: "Od", width: "8rem" },
  { key: "to", label: "Do", width: "8rem" },
  { key: "status", label: "Status", width: "8rem" }
];
const rows = ref([
  {
    id: 1,
    name: "Marko Marković",
    type: "Godišnji odmor",
    from: "01.10.2026.",
    to: "10.10.2026.",
    status: "Odobreno"
  },
  {
    id: 2,
    name: "Jelena Jovanović",
    type: "Bolovanje",
    from: "28.09.2026.",
    to: "02.10.2026.",
    status: "Na čekanju"
  },
  {
    id: 3,
    name: "Nikola Nikolić",
    type: "Rad od kuće",
    from: "30.09.2026.",
    to: "30.09.2026.",
    status: "Odbijeno"
  }
]);
const sort = ref(null);
const page = ref(1);

const picked_date = ref("2026-03-17");
const date_from = ref("");
const date_to = ref("");
const period_start = ref("2026-06-10");
const period_end = ref("2026-06-14");
</script>

<template>
  <div style="padding: 32px; display: grid; gap: 16px; max-width: 420px">
    <div style="display: flex; gap: 12px; align-items: center">
      <VBaseButton size="large">Large</VBaseButton>
      <VBaseButton>Medium</VBaseButton>
      <VBaseButton size="small">Small</VBaseButton>
    </div>
    <div style="display: flex; gap: 12px; align-items: center">
      <VBaseButton appearance="outlined">Outlined</VBaseButton>
      <VBaseButton appearance="gradient">Gradient</VBaseButton>
      <VBaseButton appearance="text">Text</VBaseButton>
    </div>
    <div style="display: flex; gap: 12px; align-items: center">
      <VBaseButton color="success">Odobri</VBaseButton>
      <VBaseButton color="error" appearance="outlined">Obriši</VBaseButton>
      <VBaseButton color="neutral" appearance="text">Otkaži</VBaseButton>
    </div>
    <div style="display: flex; gap: 12px; align-items: center">
      <VBaseButton disabled>Disabled</VBaseButton>
      <VBaseButton appearance="outlined" disabled>Disabled</VBaseButton>
      <VBaseButton appearance="text" disabled>Disabled</VBaseButton>
    </div>
    <VBaseButton size="large" block type="submit" @click="console.log('prijava')">
      Prijavi se
    </VBaseButton>
  </div>

  <div style="padding: 32px; display: grid; gap: 24px; max-width: 420px">
    <VBaseInput v-model="email" label="Email" placeholder="example@example.com" size="large" />

    <VBaseInput
      v-model="password"
      label="Lozinka"
      type="password"
      size="large"
      autocomplete="current-password"
    />

    <VBaseInput
      label="Pretraga"
      placeholder="Helper Text"
      optional
      supporting-text="Supporting Text"
    >
      <template #icon>
        <span class="material-icons-outlined">search</span>
      </template>
    </VBaseInput>

    <VBaseInput
      label="Uspeh"
      model-value="Tekst"
      status="success"
      supporting-text="Sve je u redu"
      required
    />
    <VBaseInput
      label="Greška"
      model-value="Tekst"
      status="error"
      supporting-text="Neispravan unos"
    />
    <VBaseInput
      label="Onemogućeno"
      model-value="Tekst"
      disabled
      supporting-text="Supporting Text"
    />
    <VBaseInput label="Samo čitanje" model-value="Tekst" readonly />

    <p>email: {{ email }} / lozinka: {{ password }}</p>

    <VBaseButton size="large" block>Prijavi se</VBaseButton>
  </div>

  <ol class="steps">
    <li class="steps__item">
      <VStepNumber :number="1" />
      <span>Otvorite ...</span>
    </li>
    <li class="steps__item">
      <VStepNumber :number="2" />
      <span>Skenirajte ...</span>
    </li>
    <li class="steps__item">
      <VStepNumber :number="3" />
      <span>Unesite ...</span>
    </li>
  </ol>

  <VOtpInput v-model="code" />
  <p>{{ code }}</p>

  <!-- Pregled kalendara: traka sa karticama po grupama odsustva -->
  <div class="absence-summary">
    <VStatCard
      v-for="group in absence_groups"
      :key="group.id"
      :title="group.title"
      :accent="group.accent"
    >
      <VStatItem
        v-for="type in group.types"
        :key="type.id"
        :icon="type.icon"
        :label="type.label"
        :count="type.count"
        @click="selectType(group, type)"
      />
      <template v-if="group.id === 'other'" #action>
        <VBaseButton appearance="outlined" color="neutral">
          Dodaj tip
          <span class="material-icons-outlined">add</span>
        </VBaseButton>
      </template>
    </VStatCard>
  </div>

  <!-- VPageHeader -->
  <section class="pg-section">
    <h2 class="pg-section__title">VPageHeader</h2>
    <VPageHeader title="Praznici" description="Pregled svih praznika u godini" />
    <VPageHeader title="Zahtevi">
      <template #actions>
        <div style="width: 322px">
          <VBaseInput
            v-model="query"
            appearance="outlined"
            size="header"
            placeholder="Pretraži zahteve"
            :clearable="false"
          >
            <template #icon>
              <VIcon name="search" :size="18" />
            </template>
          </VBaseInput>
        </div>
        <VBaseButton appearance="outlined" size="header">Filteri</VBaseButton>
      </template>
    </VPageHeader>
  </section>

  <!-- VDatePicker / VDateInput -->
  <section class="pg-section">
    <h2 class="pg-section__title">VDatePicker — izabrano: {{ picked_date || "ništa" }}</h2>
    <div style="display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start">
      <VDatePicker v-model="picked_date" title="Modal Date Picker" @cancel="picked_date = ''" />

      <div style="display: grid; gap: 16px; width: 280px">
        <VDateInput v-model="date_from" label="Datum od" :max="date_to" />
        <VDateInput v-model="date_to" label="Datum do" :min="date_from" required />
        <VDateInput model-value="2026-10-23" label="Samo za čitanje" icon="today" readonly />
        <p style="font-size: 12px">od: {{ date_from || "—" }} · do: {{ date_to || "—" }}</p>
      </div>
    </div>
  </section>

  <!-- VDateRangePicker / VDateRangeInput -->
  <section class="pg-section">
    <h2 class="pg-section__title">
      VDateRangePicker — period: {{ period_start || "—" }} do {{ period_end || "—" }}
    </h2>
    <div style="display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start">
      <VDateRangePicker
        v-model:start="period_start"
        v-model:end="period_end"
        title="Odabir perioda zahteva"
      />

      <div style="width: 340px">
        <VDateRangeInput
          v-model:start="period_start"
          v-model:end="period_end"
          label="Period zahteva"
          picker-title="Odabir perioda zahteva"
        />
      </div>
    </div>
  </section>

  <!-- VTabs -->
  <section class="pg-section">
    <h2 class="pg-section__title">VTabs — aktivan: {{ active_tab }}</h2>
    <VTabs v-model="active_tab" :tabs="tabs" />
  </section>

  <!-- VDropdown -->
  <section class="pg-section">
    <h2 class="pg-section__title">VDropdown</h2>
    <div style="display: flex; gap: 48px; align-items: center">
      <VDropdown align="start">
        <ul class="pg-menu">
          <li><button type="button" @click="console.log('izmeni')">Izmeni</button></li>
          <li><button type="button" @click="console.log('obriši')">Obriši</button></li>
        </ul>
      </VDropdown>
      <VDropdown>
        <ul class="pg-menu">
          <li><button type="button">Poravnat desno (end)</button></li>
        </ul>
      </VDropdown>
    </div>
  </section>

  <!-- VTable + VPagination -->
  <section class="pg-section">
    <h2 class="pg-section__title">VTable — sort: {{ sort ?? "nema" }}</h2>
    <VTable v-model:sort="sort" :columns="columns" :rows="rows">
      <template #cell-status="{ value }">
        <strong>{{ value }}</strong>
      </template>
      <template #actions="{ row }">
        <VDropdown>
          <ul class="pg-menu">
            <li><button type="button" @click="console.log('izmeni', row.id)">Izmeni</button></li>
          </ul>
        </VDropdown>
      </template>
      <template #footer>
        <span>Ukupno: {{ rows.length }}</span>
        <VPagination v-model="page" :total-pages="5" />
      </template>
    </VTable>

    <h2 class="pg-section__title">VTable — prazna</h2>
    <VTable :columns="columns" :rows="[]" />
  </section>

  <!-- Korak 1: VIcon -->
  <div style="padding: 32px; display: flex; gap: 16px; align-items: center">
    <VIcon name="search" />
    <VIcon name="more_vert" :size="18" />
    <VIcon name="tune" :size="16" color="fg-action" />
    <VIcon name="notifications" :size="32" filled />
  </div>

  <!-- Korak 2: nova veličina "header" + outlined polje -->
  <div style="padding: 32px; display: flex; gap: 16px; align-items: center">
    <VBaseButton appearance="outlined" size="header">Filteri</VBaseButton>

    <div style="width: 322px">
      <VBaseInput
        v-model="query"
        appearance="outlined"
        size="header"
        placeholder="Pretraži praznike"
        :clearable="false"
      >
        <template #icon>
          <VIcon name="search" :size="18" />
        </template>
      </VBaseInput>
    </div>
  </div>
</template>

<style lang="scss" scoped>
//kartice
// view-ovi nemaju @layer, pa ovaj CSS pregazi stil V* komponenti
.absence-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: $space-16;
  margin: $space-16;
  padding: $space-12;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-xs;
  @include respond-to("laptop-sm") {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @include respond-to("tablet-sm") {
    grid-template-columns: minmax(0, 1fr);
  }
}

// sekcije za nove komponente
.pg-section {
  display: grid;
  gap: $space-16;
  padding: $space-32;

  &__title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    color: $fg-body;
  }
}

// primjer sadržaja za VDropdown, panel nema svoju pozadinu
.pg-menu {
  min-width: 10rem;
  padding: $space-4;
  list-style: none;
  background: $surface-default;
  border: 1px solid $border-default;
  border-radius: $radius-sm;
  box-shadow: $shadow-small;

  button {
    width: 100%;
    padding: $space-8 $space-12;
    font-family: inherit;
    font-size: $text-14;
    text-align: left;
    color: $fg-heading;
    background: none;
    border: none;
    border-radius: $radius-xs;
    cursor: pointer;

    &:hover {
      background: $surface-default-hover;
    }
  }
}
</style>
