<template>
  <VAuthCard :title="$t('auth.backup.title')" :description="$t('auth.backup.description')">
    <div class="backup">
      <ul class="backup__codes" :style="{ gridTemplateRows: `repeat(${rows}, auto)` }">
        <li v-for="item in codes" :key="item" class="backup__code">{{ item }}</li>
      </ul>

      <div class="backup__tools">
        <VBaseButton appearance="outlined" color="neutral" class="backup__tool" @click="saveAsPdf">
          {{ $t("auth.backup.save_pdf") }}
        </VBaseButton>
        <VBaseButton appearance="outlined" color="neutral" class="backup__tool" @click="copyCodes">
          {{ $t(`auth.backup.copy.${copy_state}`) }}
        </VBaseButton>
      </div>
    </div>

    <div class="backup__actions">
      <VBaseButton size="large" block @click="router.push('/home')">
        {{ $t("auth.backup.continue", { app: APP_NAME }) }}
      </VBaseButton>
    </div>
  </VAuthCard>
</template>

<script setup>
import { APP_NAME } from "@/config";
import { computed, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import VAuthCard from "@/components/VAuthCard.vue";
import VBaseButton from "@/components/VBaseButton.vue";
import { useAuthStore } from "@/stores/auth";
import { currentLocale } from "@/i18n";
import auth_messages from "@/i18n/messages/auth";

const COPY_RESET_MS = 2000;

const router = useRouter();
const auth_store = useAuthStore();

// Kodovi stižu sa verifyTotp posle prvog podešavanja 2FA
const codes = computed(() => auth_store.backup_codes);

// Dve kolone, popunjavaju se odozgo nadole
const rows = computed(() => Math.ceil(codes.value.length / 2));

// idle | copied | failed, ključ u auth.backup.copy
const copy_state = ref("idle");
let copy_timer = null;

async function copyCodes() {
  try {
    await navigator.clipboard.writeText(codes.value.join("\n"));
    copy_state.value = "copied";
  } catch {
    copy_state.value = "failed";
  }

  clearTimeout(copy_timer);
  copy_timer = setTimeout(() => (copy_state.value = "idle"), COPY_RESET_MS);
}

// jsPDF fontovi nemaju ćirilicu, pa PDF ide latinicom i za sr-Cyrl (bez t())
const pdfText = (key) =>
  auth_messages[currentLocale().messages].backup.pdf[key].replace("{app}", APP_NAME);

async function saveAsPdf() {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(pdfText("title"), 20, 25);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(pdfText("hint"), 20, 33);
  pdf.setFont("courier", "normal");
  pdf.setFontSize(14);

  codes.value.forEach((code, index) => {
    pdf.text(code, 20, 50 + index * 10);
  });

  pdf.save(`${APP_NAME.toLowerCase()}-${pdfText("file")}.pdf`);
}

onUnmounted(() => clearTimeout(copy_timer));
</script>

<style scoped lang="scss">
.backup {
  @include flex(flex-start, stretch, $space-16, column);

  &__codes {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 1fr 1fr;
    column-gap: $space-36;
    row-gap: $space-16;
    padding: $space-24;
    background: $cold-50;
    border: 1px solid $border-default;
    border-radius: $radius-sm;
  }

  &__code {
    text-align: center;
    font-size: $text-16;
    font-weight: $weight-semibold;
    line-height: $leading-sm;
    font-variant-numeric: tabular-nums;
    color: $fg-heading;
    user-select: all;
  }

  &__tools {
    @include flex(flex-start, stretch, $space-16);
  }

  &__tool {
    flex: 1;
  }

  &__actions {
    padding: $space-12 0;
  }
}
</style>
