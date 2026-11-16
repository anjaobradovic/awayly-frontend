import { t } from "@/i18n";
import messages from "@/i18n/messages/absence_types";

// sistemski tipovi stižu na engleskom -> ključ prevoda (custom tipovi ostaju kako jesu)
const LEAVE_TYPE_CODES = {
  "annual leave": "annual_leave",
  "work from home": "work_from_home",
  "sick leave": "sick_leave",
  "sick day": "sick_day",
  "pregnancy sick leave": "pregnancy_sick_leave",
  "maternity leave": "maternity_leave",
  "parental leave": "parental_leave",
  "paid leave-general": "paid_leave_general",
  "paid leave-blood donation": "paid_leave_blood_donation",
  "paid leave-family death": "paid_leave_family_death",
  "slava/krsna slava-family patron saint day": "slava",
  "unpaid leave": "unpaid_leave"
};

// razmaci i crtice ne utiču na ključ
const normalize = (name) =>
  String(name ?? "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s*([-/])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

// prepoznajemo i već prevedene nazive (sr i en), da kod ne zavisi od jezika
const NORMALIZED_CODES = Object.fromEntries(
  [
    ...Object.entries(LEAVE_TYPE_CODES),
    ...Object.entries(messages.sr.names).map(([code, label]) => [label, code]),
    ...Object.entries(messages.en.names).map(([code, label]) => [label, code])
  ].map(([name, code]) => [normalize(name), code])
);

// stabilan kod sistemskog tipa ("annual_leave"), null za custom tip
export const leaveTypeCode = (name) => NORMALIZED_CODES[normalize(name)] ?? null;

// srpski (latinica) naziv, za mape koje su ključane srpskim nazivima (ikonice, grupe)
export const leaveTypeSourceName = (name) => {
  const code = leaveTypeCode(name);

  return code ? messages.sr.names[code] : (name ?? "");
};

// naziv na trenutnom jeziku; reaktivno samo ako se zove pri renderu / u computed
export const leaveTypeName = (name) => {
  const code = leaveTypeCode(name);

  return code ? t(`absence_types.names.${code}`) : (name ?? "");
};
