import { defineStore } from "pinia";

export const LANGUAGES = [
  { value: "sr-Latn", label: "Srpski", hint: "(Latinica)", code: "RS", flag: "rs" },
  { value: "sr-Cyrl", label: "Српски", hint: "(Ћирилица)", code: "RS", flag: "rs" },
  { value: "en", label: "English", hint: "(International)", code: "EN", flag: "uk" }
];

const STORAGE_KEY = "awayly-language";
const DEFAULT_LANGUAGE = "sr-Latn";

const readStoredLanguage = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return LANGUAGES.some((language) => language.value === value) ? value : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

// prevodi su u src/i18n, ovdje se samo pamti izbor
export const useLocaleStore = defineStore("locale", {
  state: () => ({
    language: readStoredLanguage()
  }),

  getters: {
    current: (state) => LANGUAGES.find((language) => language.value === state.language)
  },

  actions: {
    init() {
      document.documentElement.lang = this.language;
    },

    setLanguage(value) {
      this.language = value;
      document.documentElement.lang = value;

      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {}
    }
  }
});
