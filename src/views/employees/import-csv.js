// uvoz zaposlenih iz CSV-a: jednostavno parsiranje na klijentu za pregled prije slanja
// vrijednosti odvojene zarezom ili tačkom-zarezom, navodnici samo oko cijele vrijednosti

export const IMPORT_FIELDS = ["first_name", "last_name", "email", "hire_date", "team"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// nazivi kolona koje prepoznajemo u zaglavlju (šablon, srpski i engleski)
const HEADER_ALIASES = {
  first_name: ["first_name", "firstname", "first name", "ime"],
  last_name: ["last_name", "lastname", "last name", "prezime", "surname"],
  email: ["email", "e-mail", "email adresa", "mail"],
  hire_date: ["hire_date", "hire date", "datum zaposlenja", "datum_zaposlenja", "start date"],
  team: ["team", "tim", "team name", "naziv tima"]
};

// zaglavlje malim slovima i bez dijakritika
const normalize = (value) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const fieldOf = (header) => {
  const name = normalize(header);

  return IMPORT_FIELDS.find((field) => HEADER_ALIASES[field].includes(name)) ?? null;
};

// separator je onaj kojeg ima više u prvom redu
const detectSeparator = (line) =>
  (line.match(/;/g)?.length ?? 0) > (line.match(/,/g)?.length ?? 0) ? ";" : ",";

const splitLine = (line, separator) =>
  line.split(separator).map((cell) => cell.trim().replace(/^"(.*)"$/, "$1").trim());

// 2024-03-01 ili 01.03.2024. -> 2024-03-01, inače null
export const toIsoDate = (value) => {
  const text = value.trim();
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let parts = match && [match[1], match[2], match[3]];

  if (!parts) {
    match = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})\.?$/);
    parts = match && [match[3], match[2], match[1]];
  }

  if (!parts) return null;

  const [year, month, day] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  return date.toISOString().slice(0, 10);
};

// tekst -> { rows: [{ line, values, errors }], has_header }
// errors su ključevi iz employees.import.errors
export const parseEmployeesCsv = (text, { existing_emails = [], teams = null, today } = {}) => {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line, index) => ({ text: line, line: index + 1 }))
    .filter((item) => item.text.trim());

  if (!lines.length) return { rows: [], has_header: false };

  const separator = detectSeparator(lines[0].text);
  const first = splitLine(lines[0].text, separator).map(fieldOf);
  const has_header = first.some(Boolean);
  // bez zaglavlja kolone idu redom kao u šablonu
  const columns = has_header ? first : IMPORT_FIELDS;
  const body = has_header ? lines.slice(1) : lines;

  const taken = new Set(existing_emails.map((email) => email.toLowerCase()));
  const seen = new Set();
  const team_names = teams && new Set(teams.map(normalize));

  const rows = body.map(({ text: line_text, line }) => {
    const cells = splitLine(line_text, separator);
    const values = Object.fromEntries(IMPORT_FIELDS.map((field) => [field, ""]));

    columns.forEach((field, index) => {
      if (field) values[field] = cells[index] ?? "";
    });

    const errors = [];
    const email = values.email.toLowerCase();

    if (!values.first_name || !values.last_name) errors.push("missing_name");

    if (!EMAIL_PATTERN.test(values.email)) errors.push("invalid_email");
    else if (taken.has(email)) errors.push("email_exists");
    else if (seen.has(email)) errors.push("duplicate_email");

    seen.add(email);

    const hire_date = toIsoDate(values.hire_date);

    if (!hire_date) errors.push("invalid_date");
    else if (today && hire_date > today) errors.push("future_date");
    else values.hire_date = hire_date;

    // tim nije obavezan, ali ako je upisan mora postojati
    if (values.team && team_names && !team_names.has(normalize(values.team))) {
      errors.push("unknown_team");
    }

    return { line, values, errors };
  });

  return { rows, has_header };
};
