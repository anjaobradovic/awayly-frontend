<template>
  <!-- dugme Podnesi zahtev u navbaru, meni nudi najčešće tipove -->
  <Teleport defer to="#navbar-actions">
    <div class="submit-request">
      <VBaseButton class="submit-request__main" size="header" @click="open()">
        <VIcon name="add" :size="16" />
        {{ $t("requests.submit_button.label") }}
      </VBaseButton>

      <VDropdown class="submit-request__more" :label="$t('requests.submit_button.quick')">
        <template #trigger>
          <VIcon name="expand_more" :size="20" />
        </template>

        <VMenu>
          <VMenuItem
            v-for="type in quick_types"
            :key="type.id"
            :label="script(type.name)"
            @click="open(type.id)"
          />
        </VMenu>
      </VDropdown>
    </div>
  </Teleport>

  <SubmitRequestDrawer
    v-model:open="is_open"
    :leave-types="requests_store.leave_types"
    v-model:error="error"
    :initial-type-id="type_id"
    :busy="is_submitting"
    @submit="submit"
  />
</template>

<script setup>
import { computed, ref } from "vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VIcon from "@/components/VIcon.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import SubmitRequestDrawer from "./SubmitRequestDrawer.vue";
import { useRequestsStore } from "@/stores/requests";
import { getLeaveRequestErrorMessage } from "@/utils/api-error";
import { script } from "@/i18n";
import { leaveTypeSourceName } from "@/utils/leave-type-name";

// tipove učitava stranica u onMounted
// posle uspešnog slanja stranica osvežava svoje podatke (npr. kalendar)
const emit = defineEmits(["submitted"]);

const requests_store = useRequestsStore();

const is_open = ref(false);
const is_submitting = ref(false);
const error = ref("");
const type_id = ref(null);

// brzi izbor u meniju, tipove kojih kompanija nema preskačemo
const QUICK_TYPE_NAMES = ["Godišnji odmor", "Rad od kuće", "Bolovanje"];

const quick_types = computed(() =>
  QUICK_TYPE_NAMES.map((name) =>
    requests_store.leave_types.find((type) => leaveTypeSourceName(type.name) === name)
  ).filter(Boolean)
);

// bez argumenta: obična forma od 1. koraka; sa id-jem: tip je već izabran
function open(id = null) {
  type_id.value = id;
  is_open.value = true;
}

async function submit(payload) {
  is_submitting.value = true;
  const { error: submit_error, created } = await requests_store.submitRequest(payload);
  is_submitting.value = false;

  // greška ostaje u formi (prevedena), forma se ne zatvara
  if (submit_error) {
    error.value = getLeaveRequestErrorMessage(submit_error);
    return;
  }

  is_open.value = false;
  // novi zahtjev, stranica po njemu zna kad je osvježena
  emit("submitted", created);
}
</script>

<style lang="scss" scoped>
// split dugme kao Dodaj zaposlenog: glavni dio + strelica
.submit-request {
  display: flex;
  gap: 1px;

  &__main.v-btn {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  &__more :deep(.v-dropdown__trigger) {
    width: 2rem;
    height: $size-header;
    color: $fg-on-action;
    background: $surface-action;
    border-radius: 0 $radius-sm $radius-sm 0;

    &:hover {
      color: $fg-on-action;
      background: $surface-action-hover;
    }
  }
}
</style>
