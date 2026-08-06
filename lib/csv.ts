/**
 * CSV export.
 *
 * Every admin table exports through this one function so the escaping is
 * correct everywhere rather than nearly correct in six places.
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | boolean | Date | null | undefined;
};

/**
 * Escape one field per RFC 4180: quote it when it contains a comma, a quote,
 * or a newline, and double any internal quotes.
 *
 * The leading-character check defends against CSV injection — a value starting
 * with =, +, -, or @ is executed as a formula when the file is opened in Excel
 * or Sheets. Prefixing a tab neutralizes that without changing what a person
 * reads in the cell.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "boolean"
        ? value
          ? "yes"
          : "no"
        : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `\t${text}`;
  }

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvValue(column.value(row))).join(","),
  );
  // CRLF is what Excel expects; a UTF-8 BOM keeps accented characters intact
  // when the file is opened by double-clicking on Windows.
  return `﻿${[header, ...body].join("\r\n")}\r\n`;
}

/** A Response that downloads as a .csv file. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
