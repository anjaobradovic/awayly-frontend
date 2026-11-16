import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { i18nPlugin } from "@/i18n";
import { useThemeStore } from "@/stores/theme";
import { useLocaleStore } from "@/stores/locale";
import { USE_MOCKS } from "@/config";
import "@fontsource-variable/plus-jakarta-sans";
import "@/assets/css/vendor.css";
import "@/assets/scss/main.scss";

const app = createApp(App);

app.use(createPinia());
app.use(i18nPlugin);

// tema i jezik se primjenjuju prije prvog crtanja
useThemeStore().init();
useLocaleStore().init();

// mock mora prije routera jer guard odmah trazi token
const start = async () => {
  if (USE_MOCKS) await import("@/mocks");

  app.use(router);
  app.mount("#app");
};

start();
