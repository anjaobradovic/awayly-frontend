<template>
  <!-- nova uloga, izmjena prilagođene ili samo pregled sistemske (7.4 / 7.5 vraćaju 403) -->
  <VDrawer
    v-model:open="is_open"
    :title="role ? $t('roles.drawer.title_details') : $t('roles.drawer.title_add')"
    width="35rem"
  >
    <section v-if="role" class="role-drawer__summary">
      <div class="role-drawer__summary-text">
        <p class="role-drawer__summary-name">{{ role.name }} ({{ role.user_count }})</p>
        <p v-if="role.description" class="role-drawer__summary-description">
          {{ role.description }}
        </p>
      </div>

      <VChip :tone="role.is_system ? 'action' : 'default'">
        {{ role.is_system ? $t("roles.type.system") : $t("roles.type.custom") }}
      </VChip>
    </section>

    <section class="role-drawer__card">
      <h3 class="role-drawer__card-title">{{ $t("roles.drawer.basics") }}</h3>

      <VBaseInput
        v-model="form.name"
        :label="$t('roles.drawer.name')"
        required
        :placeholder="$t('roles.drawer.name_placeholder')"
        appearance="outlined"
        :readonly="is_readonly"
      />

      <VTextarea
        v-model="form.description"
        :label="$t('roles.drawer.description')"
        :placeholder="$t('roles.drawer.description_placeholder')"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :readonly="is_readonly"
      />
    </section>

    <section class="role-drawer__card">
      <h3 class="role-drawer__card-title">{{ $t("roles.drawer.permissions") }}</h3>

      <ul class="role-drawer__permissions">
        <li v-for="permission in PERMISSIONS" :key="permission.key" class="role-drawer__permission">
          <VCheckbox
            :model-value="form.permissions.includes(permission.key)"
            :disabled="is_readonly"
            @update:model-value="togglePermission(permission.key, $event)"
          >
            <strong>{{ permission.form_label ?? permission.label }}</strong>
            <span>{{ permission.description }}</span>
          </VCheckbox>
        </li>
      </ul>
    </section>

    <p v-if="error_message" ref="error_ref" class="role-drawer__error" role="alert">
      {{ error_message }}
    </p>

    <template #footer>
      <VBaseButton
        v-if="is_custom"
        class="role-drawer__delete"
        appearance="tonal"
        color="error"
        :disabled="is_saving"
        @click="remove"
      >
        {{ $t("roles.drawer.remove") }}
      </VBaseButton>

      <VBaseButton appearance="tonal" color="neutral" @click="is_open = false">
        {{ is_readonly ? $t("common.actions.close") : $t("common.actions.cancel") }}
      </VBaseButton>
      <VBaseButton v-if="!is_readonly" :disabled="!can_save || is_saving" @click="save">
        {{ is_custom ? $t("roles.drawer.save") : $t("roles.drawer.create") }}
      </VBaseButton>
    </template>
  </VDrawer>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import VDrawer from "@/components/VDrawer.vue";
import VBaseInput from "@/components/VBaseInput.vue";
import VTextarea from "@/components/VTextarea.vue";
import VCheckbox from "@/components/VCheckbox.vue";
import VChip from "@/components/VChip.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useRolesStore } from "@/stores/roles";
import { getErrorMessage } from "@/utils/api-error";
import { PERMISSIONS } from "../permissions";
import { t } from "@/i18n";

// brojač ispod opisa
const DESCRIPTION_MAX_LENGTH = 120;

const props = defineProps({
  // red iz tabele ili null za novu ulogu
  role: { type: Object, default: null }
});

const is_open = defineModel("open", { type: Boolean, default: false });

const roles_store = useRolesStore();

const is_readonly = computed(() => Boolean(props.role?.is_system));
const is_custom = computed(() => Boolean(props.role && !props.role.is_system));

const createForm = () => ({
  name: props.role?.name ?? "",
  description: props.role?.description ?? "",
  permissions: [...(props.role?.permissions ?? [])]
});

const form = ref(createForm());
const is_saving = ref(false);
const error_message = ref("");
const error_ref = ref(null);

// svako otvaranje kreće od izabrane uloge ili praznog formulara
watch(is_open, (open) => {
  if (!open) return;

  form.value = createForm();
  error_message.value = "";
});

// redosled dozvola uvijek prati PERMISSIONS, pa poređenje radi i kad
// korisnik isključi pa ponovo uključi istu dozvolu
function togglePermission(key, checked) {
  const selected = new Set(form.value.permissions);

  if (checked) selected.add(key);
  else selected.delete(key);

  form.value.permissions = PERMISSIONS.map((permission) => permission.key).filter((permission) =>
    selected.has(permission)
  );
}

// api 7.3: naziv je obavezan i mora postojati bar jedna dozvola
const is_valid = computed(
  () => Boolean(form.value.name.trim()) && form.value.permissions.length > 0
);

// Izmijeni ulogu ima smisla tek kad se nešto promijenilo
const is_changed = computed(() => {
  const initial = createForm();
  const sorted = (keys) => [...keys].sort().join(",");

  return (
    form.value.name.trim() !== initial.name ||
    form.value.description.trim() !== initial.description ||
    sorted(form.value.permissions) !== sorted(initial.permissions)
  );
});

const can_save = computed(() => is_valid.value && (!is_custom.value || is_changed.value));

async function save() {
  if (!can_save.value) return;

  await submit(() =>
    is_custom.value
      ? roles_store.updateRole(props.role, form.value)
      : roles_store.createRole(form.value)
  );
}

// brisanje je trajno (7.5), korisnici te uloge prelaze na Employee
async function remove() {
  const question = t("roles.delete_confirm", {
    name: props.role.name,
    employee: t("roles.system.employee.name")
  });

  if (!window.confirm(question)) return;

  await submit(() => roles_store.deleteRole(props.role.id));
}

// panel ostaje otvoren sa porukom ako server ili forma vrati grešku
async function submit(request) {
  is_saving.value = true;
  error_message.value = "";

  try {
    const error = await request();

    if (error) {
      error_message.value = getErrorMessage(error);

      // poruka je ispod liste dozvola, bez ovoga se ne bi vidjela
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
.role-drawer {
  // svijetle kartice za zaglavlje uloge i obje grupe polja
  &__summary,
  &__card {
    padding: $space-16;
    background: $cold-25;
    border: 1px solid $cold-50;
    border-radius: $radius-sm;
  }

  &__summary {
    @include flex(space-between, flex-start, $space-16);
  }

  &__summary-text {
    @include flex(flex-start, stretch, $space-4, column);
    min-width: 0;
  }

  &__summary-name {
    font-size: $text-16;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__summary-description {
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-body;
  }

  &__card {
    @include flex(flex-start, stretch, $space-16, column);
  }

  &__card-title {
    font-size: $text-14;
    font-weight: $weight-semibold;
    line-height: $leading-xs;
    color: $fg-body;
  }

  &__permission {
    padding: $space-8;
    border-bottom: 1px solid $border-default;

    strong,
    span {
      display: block;
      font-size: $text-12;
      line-height: $leading-xs;
    }

    strong {
      font-weight: $weight-semibold;
      color: $fg-heading;
    }

    span {
      color: $fg-body;
    }
  }

  &__error {
    font-size: $text-12;
    line-height: $leading-xs;
    color: $fg-error;
  }

  // Ukloni ulogu lijevo, ostala dugmad desno
  &__delete {
    margin-right: auto;
  }
}
</style>
