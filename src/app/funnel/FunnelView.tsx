"use client";

import { Breakdown } from "@/components/Breakdown";
import { CheckHeader } from "@/components/CheckHeader";
import { useData } from "@/components/DataProvider";
import { FormulaRow } from "@/components/FormulaRow";
import { Term } from "@/components/Term";
import { CardTitle, Metric, ScoreChip, Sheet, Step } from "@/components/ui";
import { fmt } from "@/lib/format";
import { dealsPerRep, diagnose, healthOfValue, leadToClose, METRICS, opportunitiesPerRep, slowestStage, STAGE_REFERENCE_DAYS, STAGES } from "@/lib/engine";

export function FunnelView() {
  const { data, result } = useData();
  const m = result.modules.funnel;
  const slow = slowestStage(data);
  const maxDays = Math.max(...STAGES.map((s) => Math.max(data.stageDays[s.key], STAGE_REFERENCE_DAYS[s.key]))) * 1.1 || 1;

  return (
    <>
      <CheckHeader />
      <div className="ruled space-y-5">
        <Step n={4} title="Funnel efficiency" aside={<ScoreChip score={m.score} />}>
          {diagnose(m, data)}
        </Step>

        <Sheet>
          <div className="grid gap-6 sm:grid-cols-3">
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

        <div className="grid gap-5 lg:grid-cols-2">
          <Sheet>
            <CardTitle note={<>The black tick is each stage&apos;s <Term id="referenceDays" label="reference days" />. The slowest stage against its reference is shown in amber.</>}>
              Days in each stage
            </CardTitle>
            <ol className="space-y-3">
              {STAGES.map((s) => {
                const d = data.stageDays[s.key];
                const ref = STAGE_REFERENCE_DAYS[s.key];
                const isSlow = s.key === slow.key && slow.ratio > 1;
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-ink-2">{s.label}</span>
                    <div className="relative h-7 flex-1 rounded-sm bg-rule-soft/60">
                      <div
                        className="flex h-full items-center rounded-sm px-2"
                        style={{ width: `${Math.max((d / maxDays) * 100, 6)}%`, background: isSlow ? "var(--warn)" : "#2a78d6" }}
                      >
                        <span className="num font-mono text-xs font-medium text-white">{fmt(d, "int")}</span>
                      </div>
                      <div className="absolute -top-1 h-9 w-0.5 bg-ink" style={{ left: `${(ref / maxDays) * 100}%` }} aria-hidden />
                    </div>
                    <span className="num w-16 text-right text-xs text-ink-3">ref. {ref}</span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 border-t border-rule-soft pt-3">
              <FormulaRow
                formula="salesCycle"
                values={{ ...data.stageDays }}
                labels={{ leadToMql: "Lead → MQL", mqlToSql: "MQL → SQL", sqlToOpp: "SQL → Opp", oppToWon: "Opp → Won" }}
                formats={{ leadToMql: "int", mqlToSql: "int", sqlToOpp: "int", oppToWon: "int" }}
              />
            </div>
          </Sheet>

          <Sheet>
            <CardTitle note="One rep's month and year at these rates.">Per rep</CardTitle>
            <div className="grid grid-cols-3 gap-4">
              <Metric label={<Term id="leadsPerRep" label="Leads" />} value={fmt(data.leadsPerRep, "int")} note="each month" />
              <Metric label="Opportunities" value={fmt(opportunitiesPerRep(data), "ratio")} note="each month" />
              <Metric label={<Term id="dealsPerRep" label="Won deals" />} value={fmt(dealsPerRep(data), "ratio")} note="each month" />
            </div>
            <div className="mt-4 space-y-1 border-t border-rule-soft pt-3">
              <FormulaRow formula="dealsPerRep" values={{ leadsPerRep: data.leadsPerRep, leadToClose: leadToClose(data) }} />
              <FormulaRow formula="revenuePerRep" values={{ dealsPerRep: dealsPerRep(data), avgDealSize: data.avgDealSize }} />
            </div>
          </Sheet>
        </div>

        <Breakdown m={m} />
      </div>
    </>
  );
}
