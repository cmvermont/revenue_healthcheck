"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CheckHeader } from "@/components/CheckHeader";
import { useData } from "@/components/DataProvider";
import { NumberField } from "@/components/NumberField";
import { Term } from "@/components/Term";
import { Sheet } from "@/components/ui";
import { fmt, type Fmt } from "@/lib/format";
import { leadToClose, leadToCloseDays, ltvCac, salesCycle, STAGES, type Inputs } from "@/lib/engine";

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function Group({ n, title, note, children }: { n?: number; title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <Sheet>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
        {n !== undefined && <span className="num text-sm text-ink-3">{String(n).padStart(2, "0")} / 04</span>}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {note && <p className="-mt-2 mb-4 max-w-3xl text-sm leading-relaxed text-ink-2">{note}</p>}
      <div className="flex flex-wrap gap-x-6 gap-y-4">{children}</div>
    </Sheet>
  );
}

const Derived = ({ children }: { children: ReactNode }) => <p className="num mt-4 w-full border-t border-rule-soft pt-3 text-sm text-ink-2">{children}</p>;

export function InputsView() {
  const { yours, updateYours, resetYours, mode } = useData();
  const x = yours;
  const num = (label: ReactNode, value: number, format: Fmt, set: (x: Inputs, v: number) => Inputs, limits: { min?: number; max?: number } = { min: 0 }, aria?: string) => (
    <Field label={label}>
      <NumberField value={value} format={format} ariaLabel={aria ?? (typeof label === "string" ? label : "value")} onChange={(v) => updateYours((p) => set(p, v))} {...limits} />
    </Field>
  );
  const rate = { min: 0, max: 1 };

  return (
    <>
      <CheckHeader />
      <div className="ruled space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-5">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">Your numbers</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
              Blue fields are inputs, in the spreadsheet convention. Rates are entered as percentages. Every check rescores as you type, and your numbers
              are kept in this browser only. They start as a copy of the example company.
            </p>
            {mode === "example" && (
              <p className="mt-2 text-sm font-medium text-warn">The checks are showing the example company. Editing any field here switches them to your numbers.</p>
            )}
          </div>
          <button
            type="button"
            data-toast="Reset to the example company"
            onClick={resetYours}
            className="rounded-md border border-rule bg-sheet px-3 py-1.5 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Reset to the example
          </button>
        </div>

        <Group title="Company">
          <Field label="Company name">
            <input
              className="field-input w-56 px-2 py-1 text-sm"
              value={x.company}
              onChange={(e) => {
                const v = e.target.value;
                updateYours((p) => ({ ...p, company: v }));
              }}
            />
          </Field>
          <Field label="Stage">
            <input
              className="field-input w-40 px-2 py-1 text-sm"
              value={x.stage}
              onChange={(e) => {
                const v = e.target.value;
                updateYours((p) => ({ ...p, stage: v }));
              }}
            />
          </Field>
          {num("ARR", x.arr, "usd0", (p, v) => ({ ...p, arr: v }))}
          {num("People in sales", x.salesTeamSize, "int", (p, v) => ({ ...p, salesTeamSize: v }))}
        </Group>

        <Group n={1} title="Pipeline" note="Stage rates and stage days for the same four stages. The Opp → Won rate is the win rate, and the Opp → Won days are the sales cycle.">
          {STAGES.map((s) => (
            <span key={s.key} className="contents">
              {num(
                <Term id={s.key === "oppToWon" ? "winRate" : s.key} label={`${s.label} rate`} />,
                x.conversion[s.key],
                "pct1",
                (p, v) => ({ ...p, conversion: { ...p.conversion, [s.key]: v } }),
                rate,
                `${s.label} rate`,
              )}
            </span>
          ))}
          <span className="w-full" />
          {STAGES.map((s) => (
            <span key={s.key} className="contents">
              {num(<Term id="stageDays" label={`${s.label} days`} />, x.stageDays[s.key], "days", (p, v) => ({ ...p, stageDays: { ...p.stageDays, [s.key]: v } }), { min: 0, max: 730 }, `${s.label} days`)}
            </span>
          ))}
          <span className="w-full" />
          {num(<Term id="coverage" />, x.coverage, "x1", (p, v) => ({ ...p, coverage: v }), { min: 0, max: 50 }, "Pipeline coverage")}
          <Derived>
            Lead-to-close {fmt(leadToClose(x), "pct2")} · sales cycle {fmt(salesCycle(x), "days")} from opportunity · {fmt(leadToCloseDays(x), "days")} from lead
          </Derived>
        </Group>

        <Group n={2} title="Forecast" note="Five closed quarters and one open quarter. Quarter names can be edited.">
          <div className="w-full overflow-x-auto">
            <table className="num text-sm">
              <thead>
                <tr className="text-left text-[0.6875rem] uppercase tracking-wider text-ink-2">
                  <th className="pb-2 pr-4 font-medium">Quarter</th>
                  <th className="pb-2 pr-4 font-medium">
                    <Term id="forecast" />
                  </th>
                  <th className="pb-2 font-medium">
                    <Term id="actual" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {x.quarters.map((q, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-4">
                      <input
                        aria-label={`Quarter ${i + 1} name`}
                        className="field-input w-28 px-2 py-1 text-sm"
                        value={q.label}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateYours((p) => ({ ...p, quarters: p.quarters.map((r, j) => (j === i ? { ...r, label: v } : r)) }));
                        }}
                      />
                    </td>
                    <td className="py-1 pr-4">
                      <NumberField
                        value={q.forecast}
                        format="usd0"
                        min={0}
                        width="9rem"
                        ariaLabel={`${q.label} forecast`}
                        onChange={(v) => updateYours((p) => ({ ...p, quarters: p.quarters.map((r, j) => (j === i ? { ...r, forecast: v } : r)) }))}
                      />
                    </td>
                    <td className="py-1">
                      {q.actual === null ? (
                        <span className="text-ink-3">
                          <Term id="openQuarter" label="Open" />
                        </span>
                      ) : (
                        <NumberField
                          value={q.actual}
                          format="usd0"
                          min={0}
                          width="9rem"
                          ariaLabel={`${q.label} actual`}
                          onChange={(v) => updateYours((p) => ({ ...p, quarters: p.quarters.map((r, j) => (j === i ? { ...r, actual: v } : r)) }))}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {num(<Term id="weightedPipelineAccuracy" />, x.weightedPipelineAccuracy, "pct1", (p, v) => ({ ...p, weightedPipelineAccuracy: v }), rate, "Weighted pipeline accuracy")}
        </Group>

        <Group n={3} title="Unit economics">
          {num(<Term id="cac" label="CAC" />, x.cac, "usd0", (p, v) => ({ ...p, cac: v }), { min: 1 }, "CAC")}
          {num(<Term id="ltv" label="LTV" />, x.ltv, "usd0", (p, v) => ({ ...p, ltv: v }), { min: 0 }, "LTV")}
          {num(<Term id="payback" />, x.paybackMonths, "months", (p, v) => ({ ...p, paybackMonths: v }), { min: 0, max: 120 }, "CAC payback")}
          {num(<Term id="grossChurn" />, x.grossChurn, "pct1", (p, v) => ({ ...p, grossChurn: v }), rate, "Gross revenue churn")}
          {num(<Term id="nrr" />, x.nrr, "pct1", (p, v) => ({ ...p, nrr: v }), { min: 0, max: 3 }, "Net revenue retention")}
          <Derived>LTV to CAC {fmt(ltvCac(x), "x2")}</Derived>
        </Group>

        <Group n={4} title="Funnel" note="Win rate and the sales cycle come from the pipeline stages above.">
          {num(<Term id="avgDealSize" />, x.avgDealSize, "usd0", (p, v) => ({ ...p, avgDealSize: v }), { min: 0 }, "Average deal size")}
          {num(<Term id="leadsPerRep" label="Leads per rep each month" />, x.leadsPerRep, "int", (p, v) => ({ ...p, leadsPerRep: v }), { min: 0, max: 10_000 }, "Leads per rep")}
        </Group>

        <p className="text-sm text-ink-2">
          See the result on the{" "}
          <Link href="/summary" className="text-accent underline underline-offset-4">
            summary
          </Link>
          .
        </p>
      </div>
    </>
  );
}
