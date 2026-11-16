import { script, t } from "@/i18n";
import { getErrorCode, getErrorMessage } from "@/utils/api-error";

// TEAM_LEAD je vođa tima podnosioca, ROLE bilo ko sa ulogom, USER tačno ta osoba
export const APPROVER_TYPES = ["TEAM_LEAD", "ROLE", "USER"];

export const APPROVER_ICONS = {
  TEAM_LEAD: "supervisor_account",
  ROLE: "badge",
  USER: "person"
};

export const MAX_STEPS = 5;

// greške iz mocka -> poruke za korisnika
const ERROR_KEYS = {
  "400.001.003": "approval_chains.errors.name_required",
  "400.022.001": "approval_chains.errors.teams_required",
  "400.022.002": "approval_chains.errors.steps_required",
  "400.022.003": "approval_chains.errors.invalid_approver",
  "403.022.001": "approval_chains.errors.disabled",
  "409.022.001": "approval_chains.errors.name_taken"
};

export const chainErrorMessage = (error) => {
  const key = ERROR_KEYS[getErrorCode(error)];

  return key ? t(key) : getErrorMessage(error, t("common.states.error"));
};

// naziv koraka na kartici
export const stepLabel = (step) => {
  if (step.approver_type === "TEAM_LEAD") return t("approval_chains.approver.TEAM_LEAD");
  if (step.approver_type === "ROLE" && step.role_name) return script(step.role_name);
  if (step.approver_type === "USER" && step.user_name) return step.user_name;

  return t("approval_chains.approver.unknown");
};
