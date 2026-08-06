import type { PDFFont } from "pdf-lib";

/**
 * Text helpers for PDF layout.
 *
 * The important one is `toPdfSafe`. pdf-lib's standard fonts can only encode
 * WinAnsi characters, and it THROWS on anything else. Client-entered data can
 * contain anything — an emoji in a business name, a curly apostrophe pasted
 * from Word, an accented character outside the set — and a packet that crashes
 * instead of generating is a support call. So every string is normalized before
 * it reaches the page.
 */

/** Characters we can map to a sensible WinAnsi equivalent rather than dropping. */
const REPLACEMENTS: [RegExp, string][] = [
  [/[‘’‚‛]/g, "'"], // curly single quotes
  [/[“”„‟]/g, '"'], // curly double quotes
  [/[–]/g, "-"], // en dash
  [/[—]/g, "—"], // em dash is valid WinAnsi; keep it
  [/[…]/g, "..."], // ellipsis
  [/[   ]/g, " "], // non-breaking spaces
  [/[•]/g, "•"], // bullet is valid WinAnsi; keep it
  [/[−]/g, "-"], // minus sign
  [/\t/g, "    "],
];

/**
 * WinAnsi covers ASCII plus most of Latin-1 and a handful of punctuation in the
 * 0x80–0x9F range. Anything outside becomes "?" rather than throwing.
 */
const WIN_ANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152,
  0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
  0x0153, 0x017e, 0x0178,
]);

export function toPdfSafe(input: string): string {
  let text = input;
  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  let output = "";
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    // Newlines survive: wrapText splits paragraphs on them, and turning them
    // into "?" would collapse multi-line text into one run of gibberish.
    // wrapText never passes a newline to drawText, so this is safe.
    const encodable =
      code === 0x0a ||
      (code >= 0x20 && code <= 0x7e) ||
      (code >= 0xa0 && code <= 0xff) ||
      WIN_ANSI_EXTRAS.has(code);
    output += encodable ? character : "?";
  }
  return output;
}

/**
 * Break text into lines that fit `maxWidth`.
 *
 * A single word longer than the line (a pasted URL, an unbroken reference
 * number) is split by character rather than allowed to run off the page.
 */
export function wrapText(
  input: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const safe = toPdfSafe(input);
  if (safe.length === 0) return [""];

  const lines: string[] = [];

  for (const paragraph of safe.split("\n")) {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) lines.push(current);

      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        current = word;
      } else {
        // Too long even alone — break it across lines.
        let chunk = "";
        for (const character of word) {
          if (font.widthOfTextAtSize(chunk + character, size) > maxWidth) {
            lines.push(chunk);
            chunk = character;
          } else {
            chunk += character;
          }
        }
        current = chunk;
      }
    }

    if (current) lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}

/**
 * Sanitize for a context that draws exactly one line.
 *
 * `toPdfSafe` keeps newlines so `wrapText` can split paragraphs on them, but a
 * newline handed straight to drawText produces broken output — so anything
 * going directly to the page uses this instead.
 */
export function toPdfSafeLine(input: string): string {
  return toPdfSafe(input).replace(/\n+/g, " ");
}

/** Shorten to fit one line, ending in an ellipsis. */
export function truncate(input: string, font: PDFFont, size: number, maxWidth: number): string {
  const safe = toPdfSafeLine(input);
  if (font.widthOfTextAtSize(safe, size) <= maxWidth) return safe;

  let result = safe;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}...`;
}
