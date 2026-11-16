import { t } from "@/i18n";

// srpski brojevi telefona, provjera i jedinstven zapis za API
// prihvata 064 123 4567, +381 64 1234567, 00381641234567 i slično

const SEPARATORS = /[\s\-/().]/g;
const NATIONAL_NUMBER = /^(6\d{7,9}|[1-3]\d{7,8})$/;

// +381 64 123-4567 -> 641234567, null ako nije srpski broj
const toNationalNumber = (value) => {
  const digits = String(value ?? "").replace(SEPARATORS, "");

  if (digits.startsWith("+381")) return digits.slice(4);
  if (digits.startsWith("00381")) return digits.slice(5);
  if (digits.startsWith("0")) return digits.slice(1);

  return null;
};

export const isValidPhone = (value) => NATIONAL_NUMBER.test(toNationalNumber(value) ?? "");

// zapis koji šaljemo backendu: +381641234567
export const normalizePhone = (value) =>
  isValidPhone(value) ? `+381${toNationalNumber(value)}` : String(value ?? "").trim();

export const phoneError = () => t("ui.phone_error");
