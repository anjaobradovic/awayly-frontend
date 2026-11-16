import { intlLocale } from "@/i18n";

// zajednička podešavanja za lični i timski panel
// tabovi su stranice iz menija Panel, label je ključ prevoda
export const PANEL_TABS = [
  { value: "/home", label: "dashboard.tabs.personal" },
  { value: "/panel/team", label: "dashboard.tabs.team" },
  { value: "/panel/company", label: "dashboard.tabs.company" }
];

const parts = (iso) => {
  const [year, month, date] = iso.split("-").map(Number);
  return { year, month, date };
};

const toDate = (iso) => {
  const { year, month, date } = parts(iso);
  return new Date(year, month - 1, date);
};

// formateri se prave pri pozivu da prate izabrani jezik
const format = (iso, options) => new Intl.DateTimeFormat(intlLocale(), options).format(toDate(iso));

const capitalize = (text) => text.charAt(0).toLocaleUpperCase(intlLocale()) + text.slice(1);

// "Jan", "Feb" ... za grafikon
export const shortMonth = (index) =>
  capitalize(new Intl.DateTimeFormat(intlLocale(), { month: "short" }).format(new Date(2026, index, 1)));

// "Januar" ... za mapu odsustva
export const longMonth = (index) =>
  capitalize(new Intl.DateTimeFormat(intlLocale(), { month: "long" }).format(new Date(2026, index, 1)));

// "8. avg 2026.", "15. jun - 19. jun 2026.", preko godine sa obje godine
export const formatPeriod = (start, end) => {
  const with_year = { day: "numeric", month: "short", year: "numeric" };

  if (start === end) return { from: format(start, with_year), to: "" };

  const same_year = parts(start).year === parts(end).year;

  return {
    from: format(start, same_year ? { day: "numeric", month: "short" } : with_year),
    to: format(end, with_year)
  };
};

// datum kao 01.06.2026.
export const formatDate = (iso) =>
  format(iso, { day: "2-digit", month: "2-digit", year: "numeric" });

export const CHART_OPTIONS = [
  { value: "work_from_home", label: "dashboard.chart.work_from_home" },
  { value: "annual_leave", label: "dashboard.chart.annual_leave" }
];

// timski panel

// datum kao "10. jun 2026."
export const formatLongDate = (iso) =>
  format(iso, { day: "numeric", month: "long", year: "numeric" });

// period kao "10.–26. jun 2026."
export const formatLongPeriod = (start, end) => {
  if (start === end) return formatLongDate(start);

  return new Intl.DateTimeFormat(intlLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).formatRange(toDate(start), toDate(end));
};

export const HEATMAP_VIEWS = [
  { value: "year", label: "dashboard.heatmap.year_view" },
  { value: "quarter", label: "dashboard.heatmap.quarter_view" }
];

// legenda: 0 odsutnih, pa 4 nijanse boje akcenta
export const HEATMAP_LEVELS = 4;

// nijansa po broju odsutnih: 1, 2-3, 4-5, 6 i više
export const heatmapLevel = (count) => {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
};

// 09. jan 2026.
export const formatDayTitle = (iso) =>
  format(iso, { day: "2-digit", month: "short", year: "numeric" });

export const weekdayOf = (iso) => capitalize(format(iso, { weekday: "long" }));

// ostali se vide u panelu dana
export const HEATMAP_PREVIEW = 5;
