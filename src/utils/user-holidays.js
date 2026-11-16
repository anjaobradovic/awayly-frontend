import { useApi } from "@/composables/useApi";
import { useAuthStore } from "@/stores/auth";
import { fetchAllPages } from "@/utils/fetch-all-pages";
import { toApiDate } from "@/utils/api-date";

// praznici za ulogovanog korisnika u periodu, [{ date, name }]
// show_holidays na backendu trenutno vraća 500, pa tada računamo ovdje iz 3.1 i 3.2
const day = (value) => String(value ?? "").slice(0, 10);

async function fromCalendar(date_from, date_to) {
  const { get } = useApi();
  const { data, error } = await get("calendar/getCalendarEntries", {
    auth: true,
    filters: {
      date_from: { value: toApiDate(date_from) },
      date_to: { value: toApiDate(date_to) },
      show_holidays: { value: true }
    }
  });

  return error ? null : (data?.data?.data?.holidays ?? []);
}

async function fromHolidayLists(date_from, date_to) {
  const religion = useAuthStore().profile?.religion ?? null;
  const years = [];

  // mesečna mreža može da počne u decembru prethodne godine
  for (
    let year = Number(day(date_from).slice(0, 4));
    year <= Number(day(date_to).slice(0, 4));
    year += 1
  ) {
    years.push(year);
  }

  const results = await Promise.all(
    years.flatMap((year) => [
      fetchAllPages("holiday/getGlobalHolidays", "holidays", { year: { value: year } }),
      fetchAllPages("holiday/getCompanyHolidays", "holidays", { year: { value: year } })
    ])
  );

  return results
    .flatMap((result) => result.items)
    .filter((holiday) => holiday.type !== "RELIGIOUS" || holiday.religion === religion);
}

export async function fetchUserHolidays(date_from, date_to) {
  const holidays =
    (await fromCalendar(date_from, date_to)) ?? (await fromHolidayLists(date_from, date_to));
  const from = day(date_from);
  const to = day(date_to);

  return holidays
    .map((holiday) => ({ date: day(holiday.date), name: holiday.name }))
    .filter((holiday) => holiday.date >= from && holiday.date <= to);
}
