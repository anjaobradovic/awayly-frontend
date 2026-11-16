// datumi su stringovi YYYY-MM-DD, kao input type=date i API
// računa se lokalno bez sati, da zona ne pomjeri dan

import { intlLocale } from "@/i18n";

const capitalize = (text) => text.charAt(0).toLocaleUpperCase(intlLocale()) + text.slice(1);

// liste se prave jednom po jeziku
const cache = new Map();

const cached = (key, build) => {
  const id = `${intlLocale()}:${key}`;

  if (!cache.has(id)) cache.set(id, build());

  return cache.get(id);
};

// imena meseci po jeziku, "Januar" / "January"
export const monthNames = (format = "long") =>
  cached(`months-${format}`, () => {
    const formatter = new Intl.DateTimeFormat(intlLocale(), { month: format });

    return Array.from({ length: 12 }, (_, index) =>
      capitalize(formatter.format(new Date(2026, index, 1)).replace(/\.$/, ""))
    );
  });

// nedjelja počinje ponedjeljkom, 5.1.2026. je ponedjeljak
export const weekdayNames = () =>
  cached("weekdays", () => {
    const narrow = new Intl.DateTimeFormat(intlLocale(), { weekday: "narrow" });
    const long = new Intl.DateTimeFormat(intlLocale(), { weekday: "long" });

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2026, 0, 5 + index);

      return { short: capitalize(narrow.format(date)), label: capitalize(long.format(date)) };
    });
  });

// stari izvozi, čitaju jezik pri svakom pristupu pa rade i u šablonima (MONTHS[i], WEEKDAYS.map)
const localeList = (build) =>
  new Proxy([], {
    get: (_, prop) => {
      const list = build();
      const value = Reflect.get(list, prop);
      return typeof value === "function" ? value.bind(list) : value;
    },
    has: (_, prop) => prop in build(),
    ownKeys: () => Reflect.ownKeys(build()),
    getOwnPropertyDescriptor: (_, prop) => Reflect.getOwnPropertyDescriptor(build(), prop)
  });

export const MONTHS = localeList(() => monthNames());

export const WEEKDAYS = localeList(weekdayNames);

const pad = (value) => String(value).padStart(2, "0");

export const toIso = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromIso = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const isValidIso = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso ?? "");

export const todayIso = () => toIso(new Date());

// 17. mart 2026. / 17 March 2026
export const longLabel = (iso) =>
  new Intl.DateTimeFormat(intlLocale(), { day: "numeric", month: "long", year: "numeric" }).format(
    fromIso(iso)
  );

// 17.03.2026. kako se prikazuje u poljima
export const shortLabel = (iso) => {
  if (!isValidIso(iso)) return "";

  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}.`;
};

// 17.03.2026 ili 17.3.2026. -> 2026-03-17, neispravan unos -> prazno
export const parseShort = (text) => {
  const match = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s*$/.exec(text ?? "");
  if (!match) return "";

  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);

  // 31.02. ne postoji, Date bi ga prebacio na mart
  return date.getMonth() === month - 1 ? toIso(date) : "";
};

export const isOutsideLimits = (iso, min, max) =>
  (isValidIso(min) && iso < min) || (isValidIso(max) && iso > max);
