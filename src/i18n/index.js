// mali i18n bez biblioteke
// prevodi su u messages/*.js, ime fajla je prvi dio ključa: t("common.save")
// ćirilica se ne piše ručno, pravi se iz latinice (transliterate.js)

import { useLocaleStore } from "@/stores/locale";
import { toCyrillic } from "./transliterate";

const modules = import.meta.glob("./messages/*.js", { eager: true });

// { sr: { common: {...} }, en: { common: {...} } }
const MESSAGES = { sr: {}, en: {} };

for (const [path, module] of Object.entries(modules)) {
  const namespace = path.split("/").pop().replace(".js", "");

  MESSAGES.sr[namespace] = module.default.sr ?? {};
  MESSAGES.en[namespace] = module.default.en ?? {};
}

// jezik iz menija -> jezik poruka i Intl lokal
const LOCALES = {
  "sr-Latn": { messages: "sr", intl: "sr-Latn-RS" },
  "sr-Cyrl": { messages: "sr", intl: "sr-Cyrl-RS" },
  en: { messages: "en", intl: "en-GB" }
};

const lookup = (messages, key) =>
  key.split(".").reduce((node, part) => (node == null ? node : node[part]), messages);

// "dan | dana | dana" ili { one, few, other }, redoslijed prati Intl.PluralRules
const PLURAL_ORDER = { sr: ["one", "few", "other"], en: ["one", "other"] };

const pickPlural = (message, count, lang, intl) => {
  const category = new Intl.PluralRules(intl).select(count);

  if (typeof message === "object") return message[category] ?? message.other;

  const forms = message.split(" | ");

  if (forms.length === 1) return message;

  const index = PLURAL_ORDER[lang].indexOf(category);

  return forms[index] ?? forms[forms.length - 1];
};

const interpolate = (message, params) =>
  message.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));

const cyrillic_cache = new Map();

const cyrillic = (text) => {
  if (!cyrillic_cache.has(text)) cyrillic_cache.set(text, toCyrillic(text));

  return cyrillic_cache.get(text);
};

export const currentLanguage = () => useLocaleStore().language;

export const currentLocale = () => LOCALES[currentLanguage()] ?? LOCALES["sr-Latn"];

// Intl lokal za datume i brojeve
export const intlLocale = () => currentLocale().intl;

export const t = (key, params = {}) => {
  const language = currentLanguage();
  const { messages: lang, intl } = currentLocale();

  let message = lookup(MESSAGES[lang], key) ?? lookup(MESSAGES.sr, key);

  if (message == null) {
    if (import.meta.env.DEV) console.warn(`[i18n] nedostaje prevod: ${key}`);
    return key;
  }

  if (Array.isArray(message)) return message;

  if (typeof params.count === "number" && (typeof message === "string" || message.other)) {
    message = pickPlural(message, params.count, lang, intl);
  }

  if (typeof message !== "string") return message;

  const text = interpolate(message, params);

  return language === "sr-Cyrl" ? cyrillic(text) : text;
};

// da li ključ postoji, za opcione prevode (npr. naziv iz backenda)
export const te = (key) => {
  const { messages: lang } = currentLocale();

  return lookup(MESSAGES[lang], key) != null || lookup(MESSAGES.sr, key) != null;
};

// za tekst koji ne dolazi iz messages (npr. podaci), samo prebacuje pismo
export const script = (text) =>
  currentLanguage() === "sr-Cyrl" && typeof text === "string" ? cyrillic(text) : text;

export const useI18n = () => ({ t, te, script, intlLocale });

// $t i $te u šablonima
export const i18nPlugin = {
  install(app) {
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$te = te;
  }
};
