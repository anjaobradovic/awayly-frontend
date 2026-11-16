<template>
  <VDrawer
    v-model:open="is_open"
    :title="chain ? $t('approval_chains.drawer.edit_title') : $t('approval_chains.drawer.add_title')"
    width="40rem"
  >
    <section class="chain-drawer__card">
      <h3 class="chain-drawer__card-title">{{ $t("approval_chains.drawer.basics") }}</h3>

      <VBaseInput
        v-model="form.name"
        :label="$t('approval_chains.drawer.name')"
        :placeholder="$t('approval_chains.drawer.name_placeholder')"
        appearance="outlined"
        required
        :maxlength="NAME_MAX_LENGTH"
        :status="show_errors && errors.name ? 'error' : 'default'"
        :supporting-text="show_errors ? errors.name : ''"
      />

      <VSwitch v-model="form.is_active" :label="$t('approval_chains.drawer.active')" />
    </section>

    <section class="chain-drawer__card">
      <h3 class="chain-drawer__card-title">{{ $t("approval_chains.drawer.scope") }}</h3>

      <VSegmentedButton v-model="form.scope" :options="scope_options" size="small" />

      <ul v-if="form.scope === 'teams'" class="chain-drawer__teams">
        <li v-for="team in approval_chains_store.team_options" :key="team.value">
          <VCheckbox
            :model-value="form.team_ids.includes(team.value)"
            @update:model-value="toggleTeam(team.value, $event)"
          >
            <span class="chain-drawer__team">
              {{ script(team.label) }}
              <small v-if="taken_teams.get(team.value)">
                {{ $t("approval_chains.drawer.team_in_chain", { name: taken_teams.get(team.value) }) }}
              </small>
            </span>
          </VCheckbox>
        </li>
      </ul>

      <p v-if="show_errors && errors.teams" class="chain-drawer__error" role="alert">
        {{ errors.teams }}
      </p>
    </section>

    <section class="chain-drawer__card">
      <div class="chain-drawer__card-head">
        <h3 class="chain-drawer__card-title">{{ $t("approval_chains.drawer.steps") }}</h3>
        <p class="chain-drawer__hint">{{ $t("approval_chains.drawer.steps_hint") }}</p>
      </div>

      <ol class="chain-drawer__steps">
        <li
          v-for="(step, index) in form.steps"
          :key="step.key"
          :class="['chain-drawer__step', { 'is-invalid': show_errors && errors.step[step.key] }]"
        >
          <div class="chain-drawer__step-head">
            <VStepNumber :number="index + 1" size="small" />
            <span class="chain-drawer__step-title">
              {{ $t("approval_chains.drawer.step", { number: index + 1 }) }}
            </span>

            <div class="chain-drawer__step-actions">
              <VBaseButton
                appearance="text"
                color="neutral"
                size="small"
                :disabled="index === 0"
                :aria-label="$t('approval_chains.drawer.move_up', { number: index + 1 })"
                @click="moveStep(index, -1)"
              >
                <VIcon name="arrow_upward" :size="16" />
              </VBaseButton>
              <VBaseButton
                appearance="text"
                color="neutral"
                size="small"
                :disabled="index === form.steps.length - 1"
                :aria-label="$t('approval_chains.drawer.move_down', { number: index + 1 })"
                @click="moveStep(index, 1)"
              >
                <VIcon name="arrow_downward" :size="16" />
              </VBaseButton>
              <VBaseButton
                appearance="text"
                color="neutral"
                size="small"
                :disabled="form.steps.length === 1"
                :aria-label="$t('approval_chains.drawer.remove_step', { number: index + 1 })"
                @click="removeStep(index)"
              >
                <VIcon name="delete_outline" :size="16" />
              </VBaseButton>
            </div>
          </div>

          <div class="chain-drawer__step-body">
            <VSegmentedButton
              v-model="step.approver_type"
              :aria-label="$t('approval_chains.drawer.approver_type')"
              :options="type_options"
              size="small"
            />

            <p v-if="step.approver_type === 'TEAM_LEAD'" class="chain-drawer__hint">
              <VIcon name="supervisor_account" :size="16" />
              {{ $t("approval_chains.approver.team_lead_hint") }}
            </p>
            <VSelect
              v-else-if="step.approver_type === 'ROLE'"
              v-model="step.role_id"
              :label="$t('approval_chains.drawer.role')"
              :placeholder="$t('approval_chains.drawer.role_placeholder')"
              :options="role_options"
            />
            <VSelect
              v-else
              v-model="step.user_id"
              :label="$t('approval_chains.drawer.person')"
              :placeholder="$t('approval_chains.drawer.person_placeholder')"
              :options="approval_chains_store.user_options"
            />

            <p v-if="show_errors && errors.step[step.key]" class="chain-drawer__error" role="alert">
              {{ errors.step[step.key] }}
            </p>
          </div>
        </li>
      </ol>

      <div class="chain-drawer__add">
        <VBaseButton
          appearance="text"
          :disabled="form.steps.length >= MAX_STEPS"
          @click="addStep"
        >
          <VIcon name="add_circle_outline" :size="16" />
          {{ $t("approval_chains.drawer.add_step") }}
        </VBaseButton>
        <span class="chain-drawer__hint">
          {{ $t("approval_chains.drawer.max_steps", { count: MAX_STEPS }) }}
        </span>
      </div>

      <p v-if="show_errors && errors.steps" class="chain-drawer__error" role="alert">
        {{ errors.steps }}
      </p>
    </section>

    <p v-if="error_message" ref="error_ref" class="chain-drawer__error" role="alert">
      {{ error_message }}
    </p>

    <template #footer>
      <VBaseButton
        v-if="chain"
        class="chain-drawer__delete"
        appearance="tonal"
        color="error"
        :disabled="is_saving"
        @click="emit('delete', chain)"
      >
        {{ $t("approval_chains.drawer.delete") }}
      </VBaseButton>
      <VBaseButton appearance="outlined" color="neutral" @click="is_open = false">
        {{ $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton :disabled="is_saving || (show_errors && !is_valid)" @click="save">
        {{ chain ? $t("common.actions.save_changes") : $t("approval_chains.drawer.save_add") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VCheckbox from "@/components/VCheckbox.vue";
import VDrawer from "@/components/VDrawer.vue";
import VIcon from "@/components/VIcon.vue";
import VSegmentedButton from "@/components/VSegmentedButton.vue";
import VSelect from "@/components/VSelect.vue";
import VStepNumber from "@/components/VStepNumber.vue";
import VSwitch from "@/components/VSwitch.vue";
import { script, t } from "@/i18n";
import { useApprovalChainsStore } from "@/stores/approval-chains";
import { APPROVER_TYPES, MAX_STEPS, chainErrorMessage } from "../approval-chain-config";

const NAME_MAX_LENGTH = 60;

const props = defineProps({
  // lanac iz store-a ili null za novi
  chain: { type: Object, default: null }
});

// brisanje potvrđuje roditelj
const emit = defineEmits(["delete"]);

const is_open = defineModel("open", { type: Boolean, default: false });

const approval_chains_store = useApprovalChainsStore();

// key drži red stabilnim kad se koraci pomjeraju
let step_key = 0;

const createStep = (step = {}) => ({
  key: ++step_key,
  approver_type: step.approver_type ?? "TEAM_LEAD",
  role_id: step.role_id ?? null,
  user_id: step.user_id ?? null
});

const createForm = () => ({
  name: props.chain?.name ?? "",
  is_active: props.chain?.is_active ?? true,
  scope: props.chain && !props.chain.applies_to_all ? "teams" : "all",
  team_ids: (props.chain?.teams ?? []).map((team) => team.id),
  steps: props.chain?.steps.length ? props.chain.steps.map(createStep) : [createStep()]
});

const form = ref(createForm());
const show_errors = ref(false);
const is_saving = ref(false);
const error_message = ref("");
const error_ref = ref(null);

watch(is_open, (open) => {
  if (!open) return;

  form.value = createForm();
  show_errors.value = false;
  error_message.value = "";
});

const scope_options = computed(() => [
  { value: "all", label: t("approval_chains.drawer.scope_all") },
  { value: "teams", label: t("approval_chains.drawer.scope_teams") }
]);

const type_options = computed(() =>
  APPROVER_TYPES.map((type) => ({ value: type, label: t(`approval_chains.approver.${type}`) }))
);

const role_options = computed(() =>
  approval_chains_store.role_options.map((option) => ({ ...option, label: script(option.label) }))
);

// timovi koji su već u drugom aktivnom lancu, samo kao napomena
const taken_teams = computed(() => {
  const map = new Map();

  for (const chain of approval_chains_store.chains) {
    if (chain.id === props.chain?.id || !chain.is_active || chain.applies_to_all) continue;

    chain.teams.forEach((team) => map.set(team.id, chain.name));
  }

  return map;
});

function toggleTeam(id, checked) {
  const rest = form.value.team_ids.filter((team_id) => team_id !== id);

  form.value.team_ids = checked ? [...rest, id] : rest;
}

function addStep() {
  if (form.value.steps.length >= MAX_STEPS) return;

  // posle vođe tima najčešće ide uloga
  const has_lead = form.value.steps.some((step) => step.approver_type === "TEAM_LEAD");

  form.value.steps.push(createStep({ approver_type: has_lead ? "ROLE" : "TEAM_LEAD" }));
}

function removeStep(index) {
  form.value.steps.splice(index, 1);
}

function moveStep(index, offset) {
  const steps = form.value.steps;
  const target = index + offset;

  if (target < 0 || target >= steps.length) return;

  [steps[index], steps[target]] = [steps[target], steps[index]];
}

const errors = computed(() => {
  const result = { name: "", teams: "", steps: "", step: {} };
  const { name, scope, team_ids, steps } = form.value;

  if (!name.trim()) result.name = t("approval_chains.errors.name_required");
  if (scope === "teams" && !team_ids.length) result.teams = t("approval_chains.errors.teams_required");
  if (!steps.length) result.steps = t("approval_chains.errors.steps_required");

  const seen = new Set();

  for (const step of steps) {
    const approver_id =
      step.approver_type === "ROLE" ? step.role_id : step.approver_type === "USER" ? step.user_id : 0;

    if (approver_id == null) {
      result.step[step.key] = t("approval_chains.errors.approver_required");
      continue;
    }

    const id = `${step.approver_type}:${approver_id}`;

    if (seen.has(id)) result.step[step.key] = t("approval_chains.errors.duplicate_step");
    seen.add(id);
  }

  return result;
});

const is_valid = computed(
  () =>
    !errors.value.name &&
    !errors.value.teams &&
    !errors.value.steps &&
    !Object.keys(errors.value.step).length
);

async function save() {
  show_errors.value = true;
  if (!is_valid.value) return;

  is_saving.value = true;
  error_message.value = "";

  try {
    const error = props.chain
      ? await approval_chains_store.updateChain(props.chain.id, form.value)
      : await approval_chains_store.createChain(form.value);

    if (error) {
      error_message.value = chainErrorMessage(error);

      // poruka je na dnu panela
      await nextTick();
      error_ref.value?.scrollIntoView({ block: "nearest" });
      return;
    }

    is_open.value = false;
  } finally {
    is_saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.chain-drawer {
  &__card {
    @include flex(flex-start, stretch, $space-16, column);
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__card-head {
    @include flex(flex-start, stretch, $space-4, column);
  }

  &__card-title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__hint {
    @include flex(flex-start, center, $space-4);
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__teams {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: $space-8;
  }

  &__team {
    @include flex(flex-start, flex-start, 0, column);
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;

    small {
      font-size: $text-11;
      line-height: $leading-xs;
      color: $fg-warning;
    }
  }

  &__steps {
    @include flex(flex-start, stretch, $space-12, column);
  }

  &__step {
    @include flex(flex-start, stretch, $space-12, column);
    padding: $space-12;
    background: $surface-default;
    border: 1px solid $border-default;
    border-radius: $radius-xs;

    &.is-invalid {
      border-color: $border-error;
    }
  }

  &__step-head {
    @include flex(flex-start, center, $space-8);
  }

  &__step-title {
    flex: 1;
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-heading;
  }

  &__step-actions {
    @include flex(flex-end, center, $space-2);
  }

  &__step-body {
    @include flex(flex-start, stretch, $space-12, column);
  }

  &__add {
    @include flex(space-between, center, $space-12);
    flex-wrap: wrap;
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  // obriši lijevo, ostala dugmad desno
  &__delete {
    margin-right: auto;
  }

  @include respond-to("mobile") {
    &__step-body :deep(.v-segmented) {
      flex-wrap: wrap;
    }
  }
}
</style>
