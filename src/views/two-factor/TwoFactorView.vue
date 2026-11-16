<template>
  <VAuthCard
    :title="$t('auth.two_factor.title')"
    :description="$t('auth.two_factor.description')"
    description-size="small"
  >
    <div class="two-factor">
      <ol class="two-factor__steps">
        <li v-for="(step, index) in STEPS" :key="step" class="two-factor__step">
          <VStepNumber :number="index + 1" size="small" />
          <span>{{ $t(`auth.two_factor.steps.${step}`) }}</span>
        </li>
      </ol>

      <div class="two-factor__qr">
        <img v-if="qr_code" class="two-factor__qr-image" :src="qr_code" :alt="$t('auth.two_factor.qr_alt')" />
        <span v-else class="two-factor__qr-placeholder material-icons-outlined" aria-hidden="true">
          qr_code_2
        </span>
      </div>
    </div>

    <div class="two-factor__actions">
      <VBaseButton size="large" block @click="onActivate">
        {{ $t("auth.two_factor.submit") }}
      </VBaseButton>
    </div>
  </VAuthCard>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import VAuthCard from "@/components/VAuthCard.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import VStepNumber from "@/components/VStepNumber.vue";
import { useAuthStore } from "@/stores/auth";

// ključevi u auth.two_factor.steps
const STEPS = ["open", "scan", "enter"];

const router = useRouter();
const auth_store = useAuthStore();

const qr_code = computed(() => auth_store.qr_code);

onMounted(() => {
  auth_store.retrieveTotp();
});

function onActivate() {
  router.push({ name: "two-factor-verify", query: { setup: "1" } });
}
</script>

<style scoped lang="scss">
$qr-size: 16.875rem;

.two-factor {
  @include flex(flex-start, center, $space-24, column);

  &__steps {
    @include flex(flex-start, flex-start, $space-16, column);
  }

  &__step {
    @include flex(flex-start, center, $space-8);
    font-size: $text-16;
    line-height: $leading-sm;
    color: $fg-heading;
  }

  &__qr {
    padding: $space-12;
    background: $cold-25;
    border: 1px solid $border-default;
    border-radius: $radius-lg;
  }

  &__qr-image,
  &__qr-placeholder {
    width: $qr-size;
    height: $qr-size;
    max-width: 100%;
    border-radius: $radius-sm;
  }

  &__qr-image {
    object-fit: contain;
    mix-blend-mode: multiply;
  }

  &__qr-placeholder {
    @include flex(center, center);
    font-size: $text-48;
    color: $icon-default;
  }

  &__actions {
    padding: $space-12;
  }

  @include respond-to("mobile") {
    &__qr-image,
    &__qr-placeholder {
      width: 12rem;
      height: 12rem;
    }
  }
}
</style>
