import { t } from "@/i18n";

// naslovi kolona su ključevi u teams.columns, prevode se pri prikazu
export const COLUMNS = [
  { key: "select", label: "", width: "3.125rem", minWidth: "3.125rem" },
  { key: "name", label: "teams.columns.name", width: "339px", minWidth: "10rem" },
  { key: "role", label: "teams.columns.role", width: "368px", minWidth: "7rem", sortable: true },
  { key: "email", label: "teams.columns.email", width: "394px", minWidth: "13rem" },
  // padding i naslov u jednom redu, plus strelica za sort
  {
    key: "hire_date",
    label: "teams.columns.hire_date",
    width: "180px",
    minWidth: "11.5rem",
    nowrap: true,
    sortable: true
  }
];

// prevod sa jednim podebljanim dijelom: vraća [prije, poslije] oko parametra
// znak \u0001 preživi i prebacivanje u ćirilicu, pa se po njemu sječe
const MARK = "\u0001";

export const splitAround = (key, param, params = {}) => {
  const [before = "", after = ""] = t(key, { ...params, [param]: MARK }).split(MARK);

  return [before, after];
};
