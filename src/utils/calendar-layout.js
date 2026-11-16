//raspored zahtjeva u mrezi kalendara
import { fromIso, toIso } from "@/utils/calendar-date";

const addDays = (iso, days) => {
  const date = fromIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
};

const diffDays = (a, b) => Math.round((fromIso(b) - fromIso(a)) / 86400000);

export const buildWeeks = (grid_from, grid_to) => {
  const weeks = [];

  for (let start = grid_from; start <= grid_to; start = addDays(start, 7)) {
    weeks.push({
      start,
      end: addDays(start, 6),
      days: Array.from({ length: 7 }, (_, index) => addDays(start, index))
    });
  }
  return weeks;
};

export const layoutWeek = (entries, week, max_lanes) => {
  const lane_ends = [];
  const hidden = Object.fromEntries(week.days.map((iso) => [iso, []]));
  const bars = [];

  entries
    .filter((entry) => entry.end_date >= week.start && entry.start_date <= week.end)
    .forEach((entry) => {
      const start = entry.start_date < week.start ? week.start : entry.start_date;
      const end = entry.end_date > week.end ? week.end : entry.end_date;

      let lane = lane_ends.findIndex((last) => last < start);
      if (lane === -1) lane = lane_ends.length;
      lane_ends[lane] = end;

      if (lane >= max_lanes) {
        for (let iso = start; iso <= end; iso = addDays(iso, 1)) hidden[iso].push(entry);
        return;
      }
      bars.push({
        entry,
        column: diffDays(week.start, start) + 1,
        span: diffDays(start, end) + 1,
        lane,
        cut_start: start !== entry.start_date,
        cut_end: end !== entry.end_date
      });
    });
  return { bars, hidden };
};
