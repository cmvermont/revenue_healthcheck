"use client";

import { useState } from "react";
import { fmt, fromEditable, prefix, suffix, toEditable, type Fmt } from "@/lib/format";

/** An editable number shown in its display format. Holds only the in-progress text; the value lives in the caller. */
export function NumberField({
  value,
  format,
  onChange,
  ariaLabel,
  min,
  max,
  width = "7.5rem",
}: {
  value: number;
  format: Fmt;
  onChange: (v: number) => void;
  ariaLabel: string;
  min?: number;
  max?: number;
  width?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && !inRange(fromEditable(draft, format), min, max);
  return (
    <span className="inline-flex flex-col">
      <span className="field field-input inline-flex items-baseline gap-0.5 px-2 py-1 text-sm" style={{ width }}>
        {prefix(format) && <span className="text-ink-3">{prefix(format)}</span>}
        <input
          className="w-full min-w-0 bg-transparent text-right outline-none"
          inputMode="decimal"
          aria-label={ariaLabel}
          aria-invalid={invalid}
          value={draft ?? stripAffixes(fmt(value, format))}
          onFocus={(e) => {
            setDraft(toEditable(value, format));
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const v = fromEditable(e.target.value, format);
            if (inRange(v, min, max)) onChange(v);
          }}
          onBlur={() => setDraft(null)}
        />
        {suffix(format) && <span className="text-ink-3">{suffix(format)}</span>}
      </span>
      {invalid && <span className="mt-0.5 text-[0.6875rem] text-critical">{rangeMessage(format, min, max)}</span>}
    </span>
  );
}

function inRange(v: number, min?: number, max?: number) {
  return Number.isFinite(v) && (min === undefined || v >= min) && (max === undefined || v <= max);
}

function stripAffixes(s: string) {
  // An accounting negative such as ($1.50) is shown in the field as -1.50.
  return s.replace(/^\(\$(.*)\)$/, "-$1").replace(/^\$/, "").replace(/%$| bps$|x$| days?$| mo$/, "");
}

function rangeMessage(format: Fmt, min?: number, max?: number) {
  if (min !== undefined && max !== undefined) return `Enter ${fmt(min, format)} to ${fmt(max, format)}`;
  if (min !== undefined) return `Must be at least ${fmt(min, format)}`;
  return "Enter a number";
}
