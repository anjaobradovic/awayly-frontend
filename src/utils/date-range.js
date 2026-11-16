import { monthNames } from "@/utils/calendar-date";

// datumi iz API-ja (2026-06-15) u kratak oblik, mesec po izabranom jeziku

const toDay = (value) => String(value).slice(0, 10);

const parseDate = (value) => {
  const [year, month, day] = toDay(value).split("-").map(Number);
  return { year, label: `${String(day).padStart(2, "0")} ${monthNames("short")[month - 1]}` };
};

export const formatDateRange = (start, end) => {
  if (!start) return "";

  const from = parseDate(start);

  if (!end || toDay(end) === toDay(start)) return `${from.label} ${from.year}`;

  const to = parseDate(end);

  // godina samo na kraju, osim kad period prelazi u sledeću godinu
  if (from.year === to.year) return `${from.label} - ${to.label} ${to.year}`;
  return `${from.label} ${from.year} - ${to.label} ${to.year}`;
};

// radni dani od start do end, uključujući oba
// holidays su neradni dani koji ne troše saldo
export const countWorkingDays = (start, end, holidays = []) => {
  if (!start || !end || toDay(end) < toDay(start)) return 0;

  const day = new Date(`${toDay(start)}T00:00:00Z`);
  const last = new Date(`${toDay(end)}T00:00:00Z`);
  let count = 0;

  while (day <= last) {
    const weekday = day.getUTCDay();
    const is_holiday = holidays.includes(day.toISOString().slice(0, 10));

    if (weekday !== 0 && weekday !== 6 && !is_holiday) count++;
    day.setUTCDate(day.getUTCDate() + 1);
  }

  return count;
};
