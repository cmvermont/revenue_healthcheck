"use client";

import { Breakdown } from "@/components/Breakdown";
import { CheckHeader } from "@/components/CheckHeader";
import { useData } from "@/components/DataProvider";
import { FormulaRow } from "@/components/FormulaRow";
import { Term } from "@/components/Term";
import { CardTitle, Metric, ScoreChip, Sheet, Step } from "@/components/ui";
import { fmt } from "@/lib/format";
import { diagnose, healthOfValue, METRICS } from "@/lib/engine";

export function UnitEconomicsView() {
  const { data, result } = useData();
  const m = result.modules.unitEconomics;

  return (
    <>
      <CheckHeader />
      <div className="ruled space-y-5">
        <Step n={3} title="Unit economics" aside={<ScoreChip score={m.score} />}>
          {diagnose(m, data)}
        </Step>

        <Sheet>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {m.parts.map((p) => (
              <Metric
                key={p.id}
                label={<Term id={METRICS[p.id].termId} label={METRICS[p.id].label} />}
                value={fmt(p.value, METRICS[p.id].format)}
                health={healthOfValue(p.value, p.band, p.lowerIsBetter)}
                note={`Good ${fmt(p.band.good, METRICS[p.id].format)} · best ${fmt(p.band.excellent, METRICS[p.id].format)}`}
              />
            ))}
          </div>
        </Sheet>

        <Sheet>
          <CardTitle note="The two inputs behind the ratio. Both are entered on the Your numbers page.">LTV to CAC, worked</CardTitle>
          <FormulaRow formula="ltvCac" values={{ ltv: data.ltv, cac: data.cac }} />
        </Sheet>

        <div className="grid gap-5 md:grid-cols-2">
          <Sheet>
            <CardTitle>Retention</CardTitle>
            <p className="text-sm leading-relaxed text-ink-2">
              <Term id="grossChurn" /> of {fmt(data.grossChurn, "pct1")} and <Term id="nrr" label="net revenue retention" /> of {fmt(data.nrr, "pct1")} mean
              existing customers {data.nrr >= 1 ? "grew" : "shrank"} by {fmt(Math.abs(data.nrr - 1), "pct1")} net, so expansion{" "}
              {data.nrr >= 1 ? `added ${fmt(data.nrr - 1 + data.grossChurn, "pct1")} of starting revenue to cover the churn and more` : "did not cover the churn"}.
            </p>
          </Sheet>
          <Sheet>
            <CardTitle>Payback</CardTitle>
            <p className="text-sm leading-relaxed text-ink-2">
              <Term id="payback" label="CAC payback" /> of {fmt(data.paybackMonths, "months")} is the time a new customer&apos;s gross margin takes to repay the{" "}
              {fmt(data.cac, "usd0")} it cost to win them. Annual contracts paid up front shorten the cash payback without changing this figure.
            </p>
          </Sheet>
        </div>

        <Breakdown m={m} />
      </div>
    </>
  );
}
