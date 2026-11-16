<template>
  <header class="navbar">
    <div class="navbar__titles">
      <VCompanyLogo
        class="navbar__company"
        :src="company_store.company?.logo_url"
        :name="company_store.name"
        :view-box="company_store.company?.logo_crop"
        :width="company_store.company?.logo_size?.[0]"
        :image-height="company_store.company?.logo_size?.[1]"
        :height="34"
      />
      <VBreadcrumbs v-if="breadcrumbs.length" :items="breadcrumbs" />
    </div>

    <div id="navbar-actions" class="navbar__actions" />

    <NotificationsMenu />

    <ThemeToggle />

    <LanguageSelect />

    <VDropdown class="navbar__user-menu" :label="$t('common.user_menu')">
      <template #trigger>
        <span class="navbar__user">
          <span class="navbar__avatar" aria-hidden="true">{{ initials }}</span>
          <span class="navbar__user-name">{{ display_name }}</span>
          <span class="navbar__chevron material-icons-outlined" aria-hidden="true">
            expand_more
          </span>
        </span>
      </template>

      <VMenu>
        <VMenuItem :label="$t('common.profile_settings')" @click="openProfileSettings" />
        <VMenuItem :label="$t('common.logout')" danger @click="auth_store.logout()" />
      </VMenu>
    </VDropdown>

    <ProfileSettingsDialog
      ref="profile_dialog_ref"
      :open="active_dialog === 'profile'"
      @update:open="(open) => setDialog('profile', open)"
      @reset-totp="active_dialog = 'totp'"
      @change-password="active_dialog = 'password'"
    />
    <ResetTotpDialog
      :open="active_dialog === 'totp'"
      @update:open="(open) => setDialog('totp', open)"
      @back="active_dialog = 'profile'"
    />
    <ChangePasswordDialog
      :open="active_dialog === 'password'"
      @update:open="(open) => setDialog('password', open)"
      @back="active_dialog = 'profile'"
    />
  </header>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useCompanyStore } from "@/stores/company";
import VBreadcrumbs from "@/components/VBreadcrumbs.vue";
import VCompanyLogo from "@/components/VCompanyLogo.vue";
import VDropdown from "@/components/VDropdown.vue";
import VMenu from "@/components/VMenu.vue";
import VMenuItem from "@/components/VMenuItem.vue";
import { findActiveItem } from "../navigation";
import LanguageSelect from "./LanguageSelect.vue";
import ThemeToggle from "./ThemeToggle.vue";
import { t } from "@/i18n";
import NotificationsMenu from "./NotificationsMenu.vue";
import ProfileSettingsDialog from "./ProfileSettingsDialog.vue";
import ResetTotpDialog from "./ResetTotpDialog.vue";
import ChangePasswordDialog from "./ChangePasswordDialog.vue";

const route = useRoute();
const auth_store = useAuthStore();
const company_store = useCompanyStore();

onMounted(() => {
  if (!company_store.company) company_store.fetchCompany();
});

// breadcrumbs se računaju iz navigation.js, ne pišu se ručno
const breadcrumbs = computed(() => {
  const active = findActiveItem(route.path);

  if (!active) return [];

  if (active.child === active.group)
    return [{ label: t(active.group.label), icon: active.group.icon }];

  return [
    { label: t(active.group.label), icon: active.group.icon },
    { label: t(active.child.label) }
  ];
});

const display_name = computed(() => auth_store.user_full_name || t("common.user"));

const initials = computed(() =>
  display_name.value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
);

const active_dialog = ref(null);

const profile_dialog_ref = ref(null);

// prvo podaci pa dijalog, da se ne otvori prazan
async function openProfileSettings() {
  await profile_dialog_ref.value?.load();
  active_dialog.value = "profile";
}

function setDialog(name, open) {
  if (open) active_dialog.value = name;
  else if (active_dialog.value === name) active_dialog.value = null;
}
</script>

<style lang="scss" scoped>
.navbar {
  position: relative;
  @include flex(flex-start, center, $space-24);
  padding: $space-12 $space-16;
  // staklo: providna podloga sa zamućenjem, bez senke
  background: alpha($surface-default, 0.55);
  backdrop-filter: blur(14px) saturate(1.4);
  border-bottom: 1px solid alpha($border-default, 0.7);

  &__titles {
    @include flex(center, flex-start, $space-8, column);
    flex: 1;
    min-width: 0;
  }

  &__company {
    @include truncate;
    max-width: 100%;
    font-size: $text-20;
    font-weight: $weight-semibold;
    line-height: $leading-24;
    color: $fg-action;
  }

  &__actions {
    @include flex(flex-end, center, $space-16);
  }

  &__actions:empty {
    display: none;
  }

  // breadcrumbs se ne lome u dva reda, višak se odsiječe
  &__titles :deep(.v-breadcrumbs) {
    max-width: 100%;
    overflow: hidden;
  }

  // tablet: ime korisnika ostaje samo kao avatar, dugmad stranice prelaze u drugi red
  @include respond-to("tablet") {
    flex-wrap: wrap;
    gap: $space-12 $space-16;

    &__actions {
      order: 1;
      width: 100%;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: $space-12;
    }

    &__user-name {
      display: none;
    }
  }

  // telefon: 1. red ime firme + ikonice, 2. red breadcrumbs, 3. red dugmad stranice
  @include respond-to("mobile") {
    gap: $space-8 $space-12;
    padding: $space-12;

    &__titles {
      display: contents;
    }

    &__company {
      flex: 1;
      min-width: 0;
      font-size: $text-18;
    }

    &__titles :deep(.v-breadcrumbs) {
      order: 1;
      width: 100%;
    }

    &__actions {
      order: 2;
      justify-content: flex-start;
    }

    &__chevron {
      display: none;
    }
  }

  &__user-menu :deep(.v-dropdown__trigger) {
    padding: $space-4;
  }

  &__user {
    @include flex(flex-start, center, $space-10);
    font-size: $text-14;
    line-height: $leading-18;
    color: $fg-heading;
    white-space: nowrap;
  }

  &__avatar {
    @include flex(center, center);
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    font-size: $text-11;
    font-weight: $weight-semibold;
    color: $fg-action;
    background: $alpha-primary-10;
    border-radius: $radius-pill;
  }

  &__chevron {
    font-size: $text-20;
    color: $icon-default;
  }
}
</style>
