export type Fmt = "usd0" | "usd2" | "usd4" | "usdShort" | "pct0" | "pct1" | "pct2" | "int" | "bps" | "ratio" | "x1" | "x2" | "days" | "months";

const nf = (min: number, max: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });

// A negative that rounds to zero is shown as zero, not as ($0).
const paren = (value: number, text: string) => (value < 0 && /[1-9]/.test(text) ? `(${text})` : text);

/** Formats a number for display. Non-finite values show a dash, never NaN or Infinity. */
export function fmt(value: number, format: Fmt): string {
  if (!Number.isFinite(value)) return "–";
  const neg = value < 0 ? "−" : "";
  const a = Math.abs(value);
  switch (format) {
    // Negative dollar amounts use accounting parentheses: ($771,739).
    case "usd0":
      return paren(value, `$${nf(0, 0).format(a)}`);
    case "usd2":
      return paren(value, `$${nf(2, 2).format(a)}`);
    case "usd4":
      return paren(value, `$${nf(4, 4).format(a)}`);
    case "usdShort":
      // $15.0M, $726K, $940: for chart axes and compact summaries.
      if (a >= 1e6) return paren(value, `$${nf(1, 1).format(a / 1e6)}M`);
      if (a >= 1e3) return paren(value, `$${nf(0, 0).format(a / 1e3)}K`);
      return paren(value, `$${nf(0, 0).format(a)}`);
    case "pct0":
      return `${neg}${nf(0, 0).format(a * 100)}%`;
    case "pct1":
      return `${neg}${nf(1, 1).format(a * 100)}%`;
    case "pct2":
      return `${neg}${nf(2, 2).format(a * 100)}%`;
    case "int":
      return `${neg}${nf(0, 0).format(a)}`;
    case "bps":
      return `${neg}${nf(1, 1).format(a)} bps`;
    case "ratio":
      return `${neg}${nf(2, 2).format(a)}`;
    case "x1":
      return `${neg}${nf(1, 1).format(a)}x`;
    case "x2":
      return `${neg}${nf(2, 2).format(a)}x`;
    case "days":
      return `${neg}${nf(0, 0).format(a)} ${a === 1 ? "day" : "days"}`;
    case "months":
      return `${neg}${nf(0, 1).format(a)} mo`;
  }
}

/** The plain string a person edits for a value in this format (percentages are edited as percentages). */
export function toEditable(value: number, format: Fmt): string {
  if (!Number.isFinite(value)) return "";
  const v = format.startsWith("pct") ? value * 100 : value;
  return String(Number(v.toFixed(6)));
}

export function fromEditable(text: string, format: Fmt): number {
  const v = Number(text.replace(/[$,%\sxa-z]/gi, ""));
  if (text.trim() === "" || !Number.isFinite(v)) return NaN;
  return format.startsWith("pct") ? v / 100 : v;
}

export const prefix = (f: Fmt) => (f.startsWith("usd") ? "$" : "");
export const suffix = (f: Fmt) =>
  f.startsWith("pct") ? "%" : f === "bps" ? "bps" : f === "x1" || f === "x2" ? "x" : f === "days" ? "days" : f === "months" ? "mo" : "";
