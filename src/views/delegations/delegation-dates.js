import { intlLocale } from "@/i18n";

// datumi delegacije su ponoć UTC, pa se formatiraju u UTC da ne pobjegne dan
const toDate = (value) => new Date(`${String(value).slice(0, 10)}T00:00:00Z`);

const formatter = (options) =>
  new Intl.DateTimeFormat(intlLocale(), { timeZone: "UTC", ...options });

// npr. "12–26. nov 2026." ili "28. okt – 3. nov 2026."
export const periodLabel = (start, end) => {
  const format = formatter({ day: "numeric", month: "short", year: "numeric" });

  return typeof format.formatRange === "function"
    ? format.formatRange(toDate(start), toDate(end))
    : `${format.format(toDate(start))} – ${format.format(toDate(end))}`;
};

export const dateLabel = (value) =>
  formatter({ day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

// ista osoba uvijek dobije istu nijansu
export const hue = (name = "") =>
  [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
