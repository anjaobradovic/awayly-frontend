import { defineStore } from "pinia";

// izgled: svijetla, tamna ili kao u sistemu
export const MODES = ["light", "dark", "system"];

// boje akcenta, vrijednosti su u assets/scss/_palette.scss
export const ACCENTS = [
  { value: "indigo", accent: "#4f46e5" },
  { value: "teal", accent: "#0d9488" },
  { value: "sapphire", accent: "#1d5fc8" },
  { value: "amber", accent: "#d97f06" },
  { value: "rose", accent: "#d63864" }
];

export const DEFAULT_ACCENT = "indigo";

const MODE_KEY = "awayly-theme";
const ACCENT_KEY = "awayly-accent";

const system_dark = window.matchMedia?.("(prefers-color-scheme: dark)");

const read = (key, allowed, fallback) => {
  try {
    const value = localStorage.getItem(key);

    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: read(MODE_KEY, MODES, "system"),
    accent: read(
      ACCENT_KEY,
      ACCENTS.map((item) => item.value),
      DEFAULT_ACCENT
    ),
    system_is_dark: Boolean(system_dark?.matches)
  }),

  getters: {
    // stvarna tema kad je izabrano "system"
    resolved: (state) =>
      state.mode === "system" ? (state.system_is_dark ? "dark" : "light") : state.mode,

    is_dark() {
      return this.resolved === "dark";
    }
  },

  actions: {
    // poziva se jednom iz main.js, prije mount-a da ne bljesne pogrešna tema
    init() {
      system_dark?.addEventListener?.("change", (event) => {
        this.system_is_dark = event.matches;
        this.apply();
      });

      this.apply();
    },

    apply() {
      const root = document.documentElement;

      root.dataset.theme = this.resolved;
      root.dataset.accent = this.accent;
    },

    setMode(mode) {
      this.mode = mode;
      write(MODE_KEY, mode);
      this.apply();
    },

    toggleMode() {
      this.setMode(this.is_dark ? "light" : "dark");
    },

    setAccent(accent) {
      this.accent = accent;
      write(ACCENT_KEY, accent);
      this.apply();
    }
  }
});
