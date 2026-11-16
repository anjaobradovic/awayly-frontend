import { useApi } from "@/composables/useApi";
import { leaveTypeName } from "@/utils/leave-type-name";
import { toApiDate } from "@/utils/api-date";
import { toIso } from "@/utils/calendar-date";
import { t, te, script } from "@/i18n";

// srpski naziv tipa (iz leaveTypeName) za prikaz na izabranom jeziku, custom tipovi samo mijenjaju pismo
export const leaveTypeLabel = (name) => {
  const key = `dashboard.leave_types.${name}`;

  return name && te(key) ? t(key) : script(name);
};

export const day = (value) => String(value ?? "").slice(0, 10);
export const number = (value) => Number(value) || 0;
export const fullName = (person) =>
  [person?.first_name, person?.last_name].filter(Boolean).join(" ");

// backend šalje samo mjesece sa danima
export const toMonths = (breakdown) =>
  Array.from({ length: 12 }, (_, index) =>
    number((breakdown ?? []).find((item) => Number(item.month) === index + 1)?.days_used)
  );

export const toAbsent = (person) => ({
  user_id: person.user_id,
  name: fullName(person),
  leave_type: leaveTypeName(person.leave_type_name),
  start_date: day(person.start_date),
  end_date: day(person.end_date)
});

// backend dozvoljava najviše 400 dana
export const fetchHeatmapEntries = async (year, leave_type_id) => {
  const { get } = useApi();

  const { data, error } = await get("calendar/getCalendarEntries", {
    auth: true,
    filters: {
      date_from: { value: toApiDate(`${year}-01-01`) },
      date_to: { value: toApiDate(`${year}-12-31`) },
      status: { value: "APPROVED" },
      leave_type_id: { value: leave_type_id }
    }
  });

  return error ? [] : (data?.data?.data?.entries ?? []);
};

// svaka osoba jednom po danu
export const groupAbsences = (entries) => {
  const days = {};

  entries.forEach((entry) => {
    const person = {
      user_id: entry.user_id,
      name: fullName(entry),
      leave_type: leaveTypeName(entry.leave_type_name),
      start_date: day(entry.start_date),
      end_date: day(entry.end_date)
    };
    const date = new Date(`${person.start_date}T00:00:00`);
    const end = new Date(`${person.end_date}T00:00:00`);

    for (; date <= end; date.setDate(date.getDate() + 1)) {
      const list = (days[toIso(date)] ??= []);

      if (!list.some((item) => item.user_id === person.user_id)) list.push(person);
    }
  });

  Object.values(days).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name, "sr")));

  return days;
};
