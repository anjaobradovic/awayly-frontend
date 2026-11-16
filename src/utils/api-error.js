import { t } from "@/i18n";

// greške stižu kao StatusCode, Message, Code, Details
const unwrap = (error) => error?.error ?? error?.data ?? error;

// kod greške, npr. 401.002.002
export const getErrorCode = (error) => unwrap(error)?.code ?? error?.code ?? null;

export const getErrorMessage = (error, fallback = t("errors.generic")) => {
  const body = unwrap(error);

  return body?.details || body?.message || error?.details || error?.message || fallback;
};

// 1.7 changePassword i 1.10 resetTotp, greške koje korisnik može sam da ispravi
// vrednost je ključ u errors.password
const PASSWORD_MESSAGES = {
  "401.002.008": "wrong_current",
  "400.002.002": "mismatch",
  "403.002.002": "ad_account"
};

export const getPasswordErrorMessage = (error) => {
  const key = PASSWORD_MESSAGES[getErrorCode(error)];

  return key ? t(`errors.password.${key}`) : getErrorMessage(error);
};

// 9.1 createLeaveRequest, greške za formu Podnesi zahtjev
// vrednost je ključ u errors.leave_request
const LEAVE_REQUEST_MESSAGES = {
  "400.010.001": "end_before_start",
  "400.010.002": "reason_required",
  "400.010.003": "notice_too_short",
  "400.010.004": "past_dates",
  "404.011.001": "type_missing",
  "409.010.001": "overlap",
  "409.010.002": "not_enough_days",
  "400.010.005": "maternity_details",
  "400.010.006": "child_number",
  "400.010.010": "end_required",
  "400.010.011": "end_automatic",
  "400.010.012": "min_employment",
  "400.010.013": "wfh_limit",
  "400.010.014": "first_annual_short",
  // nije u dokumentaciji, viđeno na backendu
  "400.010.019": "due_date_before_start"
};

export const getLeaveRequestErrorMessage = (error) => {
  const code = getErrorCode(error);

  // 400.010.014 nosi broj dana u poruci
  if (code === "400.010.014") {
    const days = String(getErrorMessage(error)).match(/\d+/)?.[0];

    if (days) return t("errors.leave_request.first_annual_min", { count: Number(days) });
  }

  const key = LEAVE_REQUEST_MESSAGES[code];

  return key ? t(`errors.leave_request.${key}`) : getErrorMessage(error);
};
