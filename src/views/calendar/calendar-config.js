// podesavanja za stranicu kalendar
import { REQUEST_GROUPS, iconOf } from "@/views/requests/request-config";
import { leaveTypeName, leaveTypeSourceName } from "@/utils/leave-type-name";

const SUMMARY_TYPES = {
  vacation: ["Godišnji odmor", "Rad od kuće"],
  family: ["Bolovanje", "Trudničko", "Roditeljsko", "Porodiljsko"],
  paid: ["Privatni poslovi", "Davanje krvi", "Krsna slava", "Smrtni slučaj"],
  other: ["Neplaćeno odsustvo"]
};

// counts može biti ključan nazivom na bilo kom jeziku
export const summaryGroups = (counts) => {
  const by_source = {};

  Object.entries(counts).forEach(([name, count]) => {
    const source = leaveTypeSourceName(name);
    by_source[source] = (by_source[source] ?? 0) + count;
  });

  return REQUEST_GROUPS.map((group) => ({
    ...group,
    types: SUMMARY_TYPES[group.key].map((name) => ({
      name,
      label: leaveTypeName(name),
      icon: iconOf(name),
      count: by_source[name] || null
    }))
  }));
};


// label je ključ prevoda, prevodi se tek u getteru store-a
export const STATUS_FILTERS = [
  { value: "all", label: "calendar.status_filters.all", api_status: null, count_key: "total_count" },
  {
    value: "pending",
    label: "calendar.status_filters.pending",
    api_status: "PENDING",
    count_key: "pending_count"
  },
  {
    value: "approved",
    label: "calendar.status_filters.approved",
    api_status: "APPROVED",
    count_key: "approved_count"
  }
];


export const compareEntries = (a, b) =>
  a.start_date.localeCompare(b.start_date) ||
  b.end_date.localeCompare(a.end_date) ||
  a.employee.localeCompare(b.employee, "sr");
