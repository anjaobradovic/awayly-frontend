// datumi praznika: ključevi "YYYY-MM-DD", formatiraju se u UTC da dan ne "pobjegne"
import { intlLocale, t } from "@/i18n";
import { dayNumber, todayKey } from "@/stores/holidays";

export const toDate = (key) => {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12));
};

const format = (key, options) =>
  new Intl.DateTimeFormat(intlLocale(), { timeZone: "UTC", ...options }).format(toDate(key));

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// "dec" / "Dec", bez tačke koju neki lokali dodaju
export const monthShort = (key) => format(key, { month: "short" }).replace(".", "");

export const monthLong = (key) => capitalize(format(key, { month: "long" }));

// "25" ili "1–2" za višednevne
export const dayLabel = (span) => {
  const start = Number(span.start.slice(8, 10));
  const end = Number(span.end.slice(8, 10));

  return span.start === span.end ? String(start) : `${start}–${end}`;
};

// "četvrtak" ili "čet – pet"
export const weekdayLabel = (span) => {
  if (span.start === span.end) return capitalize(format(span.start, { weekday: "long" }));

  const start = capitalize(format(span.start, { weekday: "short" }));
  const end = format(span.end, { weekday: "short" });

  return `${start} – ${end}`;
};

// "25. decembar 2026." ili raspon "1–2. januar 2026."
export const fullDateLabel = (span) => {
  const formatter = new Intl.DateTimeFormat(intlLocale(), {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return span.start === span.end
    ? formatter.format(toDate(span.start))
    : formatter.formatRange(toDate(span.start), toDate(span.end));
};

// prošao / danas / budući, u odnosu na lokalni današnji dan
export const spanTiming = (span) => {
  const today = todayKey();

  if (span.end < today) return "past";
  if (span.start <= today) return "today";

  return "upcoming";
};

// "Danas", "Sutra", "za 9 dana", za višednevni u toku "U toku · još 1 dan"
export const countdownLabel = (span) => {
  const today = dayNumber(todayKey());
  const start = dayNumber(span.start);
  const end = dayNumber(span.end);

  if (today >= start && today <= end) {
    if (start === end) return t("holidays.next.today");

    return `${t("holidays.next.ongoing")} · ${t("holidays.next.ends_in", { count: end - today + 1 })}`;
  }

  const diff = start - today;

  if (diff === 1) return t("holidays.next.tomorrow");

  return t("holidays.next.in_days", { count: diff });
};
