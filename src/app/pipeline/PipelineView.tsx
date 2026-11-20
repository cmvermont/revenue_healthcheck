"use client";

import { Breakdown } from "@/components/Breakdown";
import { CheckHeader } from "@/components/CheckHeader";
import { useData } from "@/components/DataProvider";
import { FormulaRow } from "@/components/FormulaRow";
import { Term } from "@/components/Term";
import { CardTitle, Meter, Metric, ScoreChip, Sheet, Step } from "@/components/ui";
import { fmt } from "@/lib/format";
import { BENCHMARKS, diagnose, funnelCounts, healthOfValue, METRICS, STAGES } from "@/lib/engine";

const SCORED = ["leadToMql", "mqlToSql", "sqlToOpp"] as const;

export function PipelineView() {
  const { data, result } = useData();
  const m = result.modules.pipeline;
  const counts = funnelCounts(data, 1000);
  const names = ["Leads", "MQLs", "SQLs", "Opps", "Won"];

  return (
    <>
      <CheckHeader />
      <div className="ruled space-y-5">
        <Step n={1} title="Pipeline health" aside={<ScoreChip score={m.score} />}>
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

        <div className="grid gap-5 lg:grid-cols-2">
          <Sheet>
            <CardTitle note="What 1,000 leads become at these stage rates.">Conversion funnel</CardTitle>
            <ol className="space-y-1">
              {counts.map((c, i) => (
                <li key={names[i]}>
                  {i > 0 && (
                    <p className="num py-0.5 pl-16 font-mono text-xs text-ink-3">
                      ↓ {fmt(data.conversion[STAGES[i - 1].key], "pct1")}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right text-sm text-ink-2">{names[i]}</span>
                    <div className="h-8 flex-1 rounded-sm bg-rule-soft/60">
                      <div
                        className="flex h-full items-center rounded-sm px-2.5"
                        style={{ width: `${Math.max(Math.min((c / 1000) * 100, 100), 8)}%`, background: i === counts.length - 1 ? "var(--accent-strong)" : "#2a78d6" }}
                      >
                        <span className="num font-mono text-xs font-medium text-white">{fmt(c, "int")}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 border-t border-rule-soft pt-3">
              <FormulaRow formula="leadToClose" values={{ ...data.conversion }} />
            </div>
          </Sheet>

          <Sheet>
            <CardTitle note="The black tick is the good value. The bar fills toward best.">Stage rates against their ranges</CardTitle>
            <div className="space-y-5">
              {SCORED.map((id) => {
                const b = BENCHMARKS[id];
                const v = data.conversion[id];
                const scale = b.excellent / 0.85;
                const h = healthOfValue(v, b);
                return (
                  <div key={id}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm text-ink-2">
                        <Term id={METRICS[id].termId} />
                      </span>
                      <span className="num font-mono text-sm font-medium">{fmt(v, "pct1")}</span>
                    </div>
                    <Meter pct={(v / scale) * 100} health={h} marker={(b.good / scale) * 100} label={`${METRICS[id].label} ${fmt(v, "pct1")} against good ${fmt(b.good, "pct0")}`} />
                    <div className="num mt-1 flex justify-between text-xs text-ink-3">
                      <span>Poor {fmt(b.poor, "pct0")}</span>
                      <span>Good {fmt(b.good, "pct0")}</span>
                      <span>Best {fmt(b.excellent, "pct0")}</span>
                    </div>
                  </div>
                );
              })}
              <p className="border-t border-rule-soft pt-3 text-sm leading-relaxed text-ink-2">
                The fourth stage, Opp → Won at {fmt(data.conversion.oppToWon, "pct1")}, is the <Term id="winRate" label="win rate" />. It is scored once, under
                funnel efficiency.
              </p>
            </div>
          </Sheet>
        </div>

        <Breakdown m={m} />
      </div>
    </>
  );
}
