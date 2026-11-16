import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { intlLocale, t } from "@/i18n";

const FALLBACK_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const isValidTimeZone = (timezone) => {
  if (!timezone) return false;

  try {
    new Intl.DateTimeFormat(undefined, {
      timeZone: timezone
    });

    return true;
  } catch {
    return false;
  }
};

const TIME_AGO_RANGES = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 604800, divisor: 86400, unit: "day" },
  { limit: 2629800, divisor: 604800, unit: "week" },
  { limit: 31557600, divisor: 2629800, unit: "month" },
  { limit: Infinity, divisor: 31557600, unit: "year" }
];

export const useDate = () => {
  const auth_store = useAuthStore();

  const timezone = computed(() => {
    const user_timezone = auth_store.user?.organization?.timezone;

    return isValidTimeZone(user_timezone) ? user_timezone : FALLBACK_TZ;
  });

  const formatDate = (utcIsoString, { dateOnly = false, includeSeconds = false } = {}) => {
    if (!utcIsoString) return "";

    const date = new Date(utcIsoString);

    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone.value,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      ...(!dateOnly && {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        ...(includeSeconds && {
          second: "2-digit"
        })
      })
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

    const formatted_date = `${values.day}.${values.month}.${values.year}.`;

    if (dateOnly) return formatted_date;

    const formatted_time = includeSeconds
      ? `${values.hour}:${values.minute}:${values.second}`
      : `${values.hour}:${values.minute}`;

    return `${formatted_date} ${formatted_time}`;
  };

  const formatLongDate = (utcIsoString) => {
    if (!utcIsoString) return "";

    const date = new Date(utcIsoString);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(intlLocale(), {
      timeZone: timezone.value,
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const formatTimeAgo = (utcIsoString) => {
    if (!utcIsoString) return "";

    const date = new Date(utcIsoString);

    if (Number.isNaN(date.getTime())) return "";

    const difference_in_seconds = Math.round((date.getTime() - Date.now()) / 1000);

    const absolute_difference = Math.abs(difference_in_seconds);
    const range = TIME_AGO_RANGES.find(({ limit }) => absolute_difference < limit);

    const value = Math.round(difference_in_seconds / range.divisor);

    // pravi se pri pozivu da prati izabrani jezik
    return new Intl.RelativeTimeFormat(intlLocale(), { numeric: "auto" }).format(value, range.unit);
  };

  const getGreeting = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone.value,
      hour: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    const hour = Number(parts.find(({ type }) => type === "hour")?.value);

    if (hour < 12) return t("ui.greeting.morning");
    if (hour < 18) return t("ui.greeting.afternoon");

    return t("ui.greeting.evening");
  };

  return {
    timezone,
    formatDate,
    formatLongDate,
    formatTimeAgo,
    getGreeting
  };
};
