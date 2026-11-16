// broj primijenjenih filtera za crveni broj na dugmetu Filteri
// prazno je null, "" ili prazan niz
export const countFilters = (filters) =>
  Object.values(filters).filter(
    (value) => value !== null && value !== "" && !(Array.isArray(value) && !value.length)
  ).length;
