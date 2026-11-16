// PDF izveštaja o odsustvima (jsPDF), isti šablon za preuzimanje i novi izveštaj
// standardni jsPDF fontovi nemaju č/ć/đ ni ćirilicu, pa sav tekst ide kroz pdfText

import { APP_NAME } from "@/config";

// A4 u milimetrima
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 9;
const BOTTOM_LIMIT = PAGE_H - 20;

const COLORS = {
  accent: "#4f46e5",
  accent_dark: "#4338ca",
  accent_soft: "#5b53e9",
  accent_softer: "#6a63ec",
  accent_text: "#3730a3",
  accent_50: "#eef2ff",
  accent_100: "#e0e7ff",
  accent_200: "#c7d2fe",
  heading: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  line: "#e2e8f0",
  zebra: "#f8fafc",
  track: "#eef0f6",
  card: "#fafaff",
  white: "#ffffff"
};

// boje traka po tipu, redom po broju dana
const BAR_COLORS = [
  "#4f46e5",
  "#8b5cf6",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#14b8a6",
  "#94a3b8"
];

const STATUS_COLORS = {
  APPROVED: { text: "#047857", fill: "#d1fae5" },
  PENDING: { text: "#b45309", fill: "#fef3c7" },
  PENDING_CANCELLATION: { text: "#be123c", fill: "#ffe4e6" }
};

const MAX_TYPES = 7;

// tabela: ključ, širina (mm), poravnanje
const COLUMNS = [
  { key: "employee", width: 38 },
  { key: "team", width: 29 },
  { key: "type", width: 32 },
  { key: "from", width: 22 },
  { key: "to", width: 22 },
  { key: "days", width: 11, align: "right" },
  { key: "status", width: 24 }
];

const DIACRITICS = {
  č: "c",
  ć: "c",
  š: "s",
  ž: "z",
  đ: "dj",
  Č: "C",
  Ć: "C",
  Š: "S",
  Ž: "Z",
  Đ: "Dj",
  "–": "-",
  "—": "-",
  "„": '"',
  "“": '"',
  "”": '"',
  "’": "'",
  " ": " ",
  " ": " "
};

// samo znakovi koje Helvetica (WinAnsi) zna, ostalo se skida
export const pdfText = (value) =>
  String(value ?? "")
    .replace(/[čćšžđČĆŠŽĐ–—„“”’  ]/g, (char) => DIACRITICS[char])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\xff]/g, "");

const interpolate = (text, params) =>
  String(text).replace(/\{(\w+)\}/g, (match, name) => (name in params ? params[name] : match));

const dateFormatter = (locale, options) => {
  const format = new Intl.DateTimeFormat(locale, options);

  return (value) =>
    value ? format.format(new Date(String(value).slice(0, 10) + "T00:00:00")) : "";
};

/**
 * @param {object} options
 * @param {{ name, description, scope_label, date_from, date_to, generated_by, created_at }} options.report
 * @param {{ name: string }} options.company
 * @param {{ data_url: string, width: number, height: number } | null} options.logo
 * @param {Array<{ employee, team, type, from, to, days, status }>} options.rows
 * @param {object} options.labels reports.pdf poruke na jeziku korisnika
 * @param {string} options.locale Intl lokal za datume
 * @returns {Promise<Blob>}
 */
export async function buildReportPdf({ report, company, logo = null, rows, labels, locale }) {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const shortDate = dateFormatter(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
  const longDate = dateFormatter(locale, { day: "numeric", month: "short", year: "numeric" });
  const label = (key) =>
    pdfText(key.split(".").reduce((node, part) => node?.[part], labels) ?? key);

  // pomoćne za crtanje
  const font = (size, style = "normal", color = COLORS.body) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
  };

  const fill = (color) => pdf.setFillColor(color);

  // skraćuje tekst na širinu (mm) sa "..."
  const fit = (text, width) => {
    let value = pdfText(text);

    if (pdf.getTextWidth(value) <= width) return value;

    while (value.length > 1 && pdf.getTextWidth(`${value}...`) > width) value = value.slice(0, -1);

    return `${value.trimEnd()}...`;
  };

  const write = (text, x, y, width, options = {}) =>
    pdf.text(width ? fit(text, width) : pdfText(text), x, y, options);

  // zbirni podaci
  const total_days = rows.reduce((sum, row) => sum + row.days, 0);
  const people = new Set(rows.map((row) => row.employee)).size;
  const by_type = [
    ...rows.reduce((map, row) => map.set(row.type, (map.get(row.type) ?? 0) + row.days), new Map())
  ]
    .map(([type, days]) => ({ type, days }))
    .sort((a, b) => b.days - a.days);

  // repovi preko MAX_TYPES idu u "Ostalo"
  const breakdown =
    by_type.length > MAX_TYPES + 1
      ? [
          ...by_type.slice(0, MAX_TYPES),
          {
            type: labels.other,
            days: by_type.slice(MAX_TYPES).reduce((sum, item) => sum + item.days, 0),
            is_other: true
          }
        ]
      : by_type;

  const title = pdfText(report.name);
  const generated_at =
    `${shortDate(report.created_at)} ${String(report.created_at ?? "").slice(11, 16)}`.trim();

  pdf.setProperties({
    title,
    subject: label("document"),
    author: pdfText(report.generated_by),
    creator: APP_NAME
  });

  // ---- zaglavlje prve strane ----
  const HEADER_H = 68;

  fill(COLORS.accent);
  pdf.rect(0, 0, PAGE_W, HEADER_H, "F");
  // ukrasni krugovi u desnom uglu
  fill(COLORS.accent_soft);
  pdf.circle(PAGE_W - 18, 6, 40, "F");
  fill(COLORS.accent_softer);
  pdf.circle(PAGE_W + 4, HEADER_H - 4, 26, "F");
  // krug ne smije preći ispod trake
  fill(COLORS.white);
  pdf.rect(0, HEADER_H, PAGE_W, 30, "F");
  fill(COLORS.accent_dark);
  pdf.rect(0, HEADER_H - 1.2, PAGE_W, 1.2, "F");

  // logo na bijeloj pločici, bez loga samo ime firme
  if (logo?.data_url) {
    const logo_h = 7.5;
    const logo_w = Math.min(48, (logo.width / logo.height) * logo_h);

    fill(COLORS.white);
    pdf.roundedRect(MARGIN, 11, logo_w + 7, logo_h + 5, 2.4, 2.4, "F");
    pdf.addImage(logo.data_url, "PNG", MARGIN + 3.5, 13.5, logo_w, logo_h, "logo", "FAST");
  } else {
    font(12, "bold", COLORS.white);
    write(company.name, MARGIN, 19, 90);
  }

  font(9, "bold", COLORS.white);
  pdf.text(APP_NAME.toUpperCase(), PAGE_W - MARGIN, 16.5, { align: "right", charSpace: 0.8 });
  font(8, "normal", COLORS.accent_200);
  write(label("document"), PAGE_W - MARGIN, 21.5, 0, { align: "right" });

  font(8, "bold", COLORS.accent_200);
  pdf.text(pdfText(company.name).toUpperCase(), MARGIN, 35, { charSpace: 0.6 });

  font(22, "bold", COLORS.white);
  write(report.name, MARGIN, 45, CONTENT_W);

  if (report.description) {
    font(9, "normal", COLORS.accent_100);
    write(report.description, MARGIN, 51.5, CONTENT_W);
  }

  // period, opseg, generisano
  const meta = [
    [label("period"), `${shortDate(report.date_from)} - ${shortDate(report.date_to)}`, 52],
    [label("scope"), report.scope_label, 50],
    [label("generated"), `${generated_at} · ${report.generated_by}`, CONTENT_W - 112]
  ];
  let meta_x = MARGIN;

  meta.forEach(([meta_label, value, width]) => {
    font(6.5, "bold", COLORS.accent_200);
    pdf.text(meta_label.toUpperCase(), meta_x, 58.5, { charSpace: 0.4 });
    font(9, "bold", COLORS.white);
    write(value, meta_x, 63, width - 4);
    meta_x += width + 6;
  });

  // ---- KPI kutije ----
  let y = HEADER_H + 8;
  const KPI_GAP = 4;
  const KPI_W = (CONTENT_W - KPI_GAP * 3) / 4;
  const KPI_H = 25;
  const top_type = by_type[0]?.type ?? "-";

  const kpis = [
    [label("kpi.days"), String(total_days), label("days_short")],
    [label("kpi.requests"), String(rows.length)],
    [label("kpi.people"), String(people)],
    [label("kpi.top_type"), top_type, "", true]
  ];

  kpis.forEach(([kpi_label, value, suffix, is_text], index) => {
    const x = MARGIN + index * (KPI_W + KPI_GAP);

    fill(COLORS.card);
    pdf.setDrawColor(COLORS.accent_100);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, KPI_W, KPI_H, 2.5, 2.5, "FD");
    // akcent linija lijevo
    fill(COLORS.accent);
    pdf.roundedRect(x, y + 5, 1.2, KPI_H - 10, 0.6, 0.6, "F");

    font(6.5, "bold", COLORS.muted);
    write(kpi_label.toUpperCase(), x + 5, y + 7.5, KPI_W - 8);

    if (is_text) {
      font(10.5, "bold", COLORS.heading);
      const lines = pdf.splitTextToSize(pdfText(value), KPI_W - 9).slice(0, 2);

      lines.forEach((line, line_index) =>
        write(line, x + 5, y + 14.5 + line_index * 4.6, KPI_W - 9)
      );
    } else {
      font(20, "bold", COLORS.heading);
      pdf.text(value, x + 5, y + 18.5);

      if (suffix) {
        const value_w = pdf.getTextWidth(value);

        font(10, "bold", COLORS.muted);
        pdf.text(suffix, x + 6 + value_w, y + 18.5);
      }
    }
  });

  y += KPI_H + 12;

  const sectionTitle = (text) => {
    fill(COLORS.accent);
    pdf.roundedRect(MARGIN, y - 3.1, 2.6, 2.6, 0.6, 0.6, "F");
    font(11, "bold", COLORS.heading);
    write(text, MARGIN + 5, y - 0.5);
    y += 6;
  };

  // ---- raspodjela po tipu ----
  sectionTitle(label("by_type"));

  if (!breakdown.length) {
    font(9, "normal", COLORS.muted);
    write(label("empty"), MARGIN, y + 2);
    y += 10;
  } else {
    const LABEL_W = 50;
    const VALUE_W = 26;
    const track_x = MARGIN + LABEL_W + 4;
    const track_w = CONTENT_W - LABEL_W - VALUE_W - 8;
    const max_days = Math.max(...breakdown.map((item) => item.days), 1);

    breakdown.forEach((item, index) => {
      const color = item.is_other ? BAR_COLORS.at(-1) : BAR_COLORS[index % (BAR_COLORS.length - 1)];
      const percent = total_days ? Math.round((item.days / total_days) * 100) : 0;

      fill(color);
      pdf.circle(MARGIN + 1.2, y + 1.6, 1.1, "F");
      font(8.5, "normal", COLORS.body);
      write(item.type, MARGIN + 4, y + 2.6, LABEL_W - 4);

      fill(COLORS.track);
      pdf.roundedRect(track_x, y, track_w, 3.4, 1.7, 1.7, "F");
      fill(color);
      pdf.roundedRect(
        track_x,
        y,
        Math.max(3.4, (item.days / max_days) * track_w),
        3.4,
        1.7,
        1.7,
        "F"
      );

      font(8.5, "bold", COLORS.heading);
      const days_text = `${item.days} ${label("days_short")}`;

      pdf.text(days_text, PAGE_W - MARGIN - 11, y + 2.7, { align: "right" });
      font(8, "normal", COLORS.muted);
      pdf.text(`${percent}%`, PAGE_W - MARGIN, y + 2.7, { align: "right" });

      y += 6.6;
    });

    y += 6;
  }

  // ---- tabela odsustava ----
  const ROW_H = 7.4;
  const HEAD_H = 8;

  const tableHeader = () => {
    fill(COLORS.accent_50);
    pdf.roundedRect(MARGIN, y, CONTENT_W, HEAD_H, 1.6, 1.6, "F");
    font(6.8, "bold", COLORS.accent_text);

    let x = MARGIN;

    COLUMNS.forEach((column) => {
      const text = label(`columns.${column.key}`).toUpperCase();

      if (column.align === "right")
        pdf.text(text, x + column.width - 3, y + 5.2, { align: "right" });
      else write(text, x + 3, y + 5.2, column.width - 4);

      x += column.width;
    });

    y += HEAD_H;
  };

  // nastavak na novoj strani: tanka traka sa naslovom
  const newPage = () => {
    pdf.addPage();
    fill(COLORS.accent);
    pdf.rect(0, 0, PAGE_W, 14, "F");
    font(9, "bold", COLORS.white);
    write(report.name, MARGIN, 8.8, 120);
    font(8, "normal", COLORS.accent_200);
    write(company.name, PAGE_W - MARGIN, 8.8, 0, { align: "right" });
    y = 24;
  };

  // naslov sekcije ne ostaje sam na dnu strane
  if (y + 6 + HEAD_H + ROW_H * 2 > BOTTOM_LIMIT) newPage();

  sectionTitle(`${label("absences")} (${rows.length})`);
  tableHeader();

  if (!rows.length) {
    font(9, "normal", COLORS.muted);
    write(label("empty"), MARGIN + 3, y + 6.5);
    y += 12;
  }

  rows.forEach((row, index) => {
    if (y + ROW_H > BOTTOM_LIMIT) {
      newPage();
      tableHeader();
    }

    if (index % 2 === 1) {
      fill(COLORS.zebra);
      pdf.rect(MARGIN, y, CONTENT_W, ROW_H, "F");
    }

    pdf.setDrawColor(COLORS.line);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, y + ROW_H, PAGE_W - MARGIN, y + ROW_H);

    const values = {
      employee: row.employee,
      team: row.team,
      type: row.type,
      from: shortDate(row.from),
      to: shortDate(row.to),
      days: String(row.days)
    };
    const text_y = y + 4.9;
    let x = MARGIN;

    COLUMNS.forEach((column) => {
      if (column.key === "status") {
        const colors = STATUS_COLORS[row.status] ?? { text: COLORS.muted, fill: COLORS.track };
        const text = labels.status?.[row.status] ?? row.status;

        font(6.8, "bold", colors.text);
        const pill_w = Math.min(
          column.width - 3,
          pdf.getTextWidth(fit(text, column.width - 7)) + 4
        );

        fill(colors.fill);
        pdf.roundedRect(x + 2, y + 1.7, pill_w, 4, 2, 2, "F");
        write(text, x + 4, y + 4.6, column.width - 7);
      } else if (column.key === "employee") {
        font(8.2, "bold", COLORS.heading);
        write(values.employee, x + 3, text_y, column.width - 4);
      } else {
        font(8.2, "normal", COLORS.body);

        if (column.align === "right") {
          font(8.2, "bold", COLORS.heading);
          pdf.text(values[column.key], x + column.width - 3, text_y, { align: "right" });
        } else {
          write(values[column.key], x + 3, text_y, column.width - 4);
        }
      }

      x += column.width;
    });

    y += ROW_H;
  });

  // ukupno ispod tabele
  if (rows.length) {
    if (y + 8 > BOTTOM_LIMIT) newPage();

    font(8.2, "bold", COLORS.heading);
    const days_x = MARGIN + COLUMNS.slice(0, 6).reduce((sum, column) => sum + column.width, 0) - 3;

    write(labels.total ?? "", days_x - 30, y + 5.5, 0, { align: "right" });
    pdf.text(String(total_days), days_x, y + 5.5, { align: "right" });
  }

  // ---- podnožje na svakoj strani ----
  const pages = pdf.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(COLORS.line);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, FOOTER_Y - 5, PAGE_W - MARGIN, FOOTER_Y - 5);

    font(7.5, "bold", COLORS.accent);
    pdf.text(APP_NAME, MARGIN, FOOTER_Y);
    const app_w = pdf.getTextWidth(APP_NAME);

    font(7.5, "normal", COLORS.muted);
    write(` · ${interpolate(labels.page, { page, total: pages })}`, MARGIN + app_w, FOOTER_Y);
    write(`${company.name} · ${longDate(report.created_at)}`, PAGE_W - MARGIN, FOOTER_Y, 0, {
      align: "right"
    });
  }

  return pdf.output("blob");
}
