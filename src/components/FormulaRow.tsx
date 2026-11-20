"use client";

import { fmt, type Fmt } from "@/lib/format";
import { FORMULAS } from "@/lib/glossary/formulas";
import { NumberField } from "./NumberField";
import { Term } from "./Term";

type Limits = Record<string, { min?: number; max?: number }>;

/**
 * Renders a formula as labeled fields with the operators between them and the result at the end.
 * The row holds no state: values come in, edits go out, and the result is computed from the same
 * definition the tests compare against the engine.
 */
export function FormulaRow({
  formula,
  values,
  onChange,
  editable = [],
  labels = {},
  terms = {},
  resultLabel,
  resultTerm,
  limits = {},
  formats = {},
  resultFormat,
}: {
  formula: string;
  values: Record<string, number>;
  onChange?: (key: string, value: number) => void;
  /** Operand keys the reader can edit. */
  editable?: string[];
  /** Label overrides, for a generic formula used for a specific case. */
  labels?: Record<string, string>;
  /** Glossary term overrides for operands. */
  terms?: Record<string, string>;
  resultLabel?: string;
  resultTerm?: string;
  limits?: Limits;
  /** Display format overrides, for a generic formula whose precision depends on the case. */
  formats?: Record<string, Fmt>;
  resultFormat?: Fmt;
}) {
  const f = FORMULAS[formula];
  const result = f.compute(values);
  const seen = new Set<string>();
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-3 py-2">
      {f.tokens.map((t, i) => {
        if (t.kind === "op")
          return (
            <span key={i} className="op" aria-hidden>
              {t.text}
            </span>
          );
        const operand = f.vars[t.key];
        const canEdit = !!onChange && editable.includes(t.key) && !seen.has(t.key);
        seen.add(t.key);
        const termId = terms[t.key] ?? operand.termId;
        return (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-2">
              <Term id={termId} label={labels[t.key]} />
            </span>
            {canEdit ? (
              <NumberField
                value={values[t.key]}
                format={formats[t.key] ?? operand.format}
                ariaLabel={labels[t.key] ?? termId}
                onChange={(v) => onChange!(t.key, v)}
                {...limits[t.key]}
              />
            ) : (
              <span className="field field-ro px-2 py-1 text-right text-sm">{fmt(values[t.key], formats[t.key] ?? operand.format)}</span>
            )}
          </div>
        );
      })}
      <span className="op" aria-hidden>
        =
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-2">
          <Term id={resultTerm ?? f.resultTermId} label={resultLabel} align="right" />
        </span>
        <output className="field field-result px-3 py-1 text-right text-sm font-medium">{fmt(result, resultFormat ?? f.resultFormat)}</output>
      </div>
    </div>
  );
}
