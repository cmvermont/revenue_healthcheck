"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Breakdown } from "@/components/Breakdown";
import { CheckHeader } from "@/components/CheckHeader";
import { useData } from "@/components/DataProvider";
import { FormulaRow } from "@/components/FormulaRow";
import { Term } from "@/components/Term";
import { CardTitle, Metric, ScoreChip, Sheet, Step, TONE_FILL, TONE_TEXT } from "@/components/ui";
import { fmt } from "@/lib/format";
import { averageAccuracy, averageBias, BENCHMARKS, closedQuarters, diagnose, FORECAST_MISS_LINE, healthOfValue, type Health } from "@/lib/engine";

const TICK = { fill: "#6e7275", fontSize: 12, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' };
const signed = (v: number) => `${v > 0 ? "+" : ""}${fmt(v, "pct1")}`;

export function ForecastView() {
  const { data, result } = useData();
  const m = result.modules.forecast;
  const closed = closedQuarters(data);
  const acc = averageAccuracy(data);
  const bias = averageBias(data);
  // Not scored: shown against the line SiriusDecisions uses for a missed forecast.
  const biasHealth: Health = Math.abs(bias) <= FORECAST_MISS_LINE ? "good" : "warn";
  const high = closed.filter((q) => q.bias > 0).length;
  const RANGE = 0.3;
  const pos = (v: number) => ((Math.max(-RANGE, Math.min(RANGE, v)) + RANGE) / (2 * RANGE)) * 100;
  const first = closed[0];
  const open = data.quarters.filter((q) => q.actual === null);

  return (
    <>
      <CheckHeader />
      <div className="ruled space-y-5">
        <Step n={2} title="Forecast accuracy" aside={<ScoreChip score={m.score} />}>
          {diagnose(m, data)}
        </Step>

        <Sheet>
          <div className="grid gap-6 sm:grid-cols-3">
            <Metric
              label={<Term id="forecastAccuracy" />}
              value={fmt(acc, "pct1")}
              health={healthOfValue(acc, BENCHMARKS.forecastAccuracy)}
              note={`Average of ${closed.length} closed ${closed.length === 1 ? "quarter" : "quarters"} · good ${fmt(BENCHMARKS.forecastAccuracy.good, "pct0")}`}
            />
            <Metric
              label={<Term id="forecastBias" />}
              value={Number.isFinite(bias) ? signed(bias) : "–"}
              health={biasHealth}
              note={Number.isFinite(bias) ? `${bias > 0 ? "Above" : "Below"} actual on average · shown, not scored` : "No closed quarters"}
            />
            <Metric
              label={<Term id="weightedPipelineAccuracy" />}
              value={fmt(data.weightedPipelineAccuracy, "pct1")}
              health={healthOfValue(data.weightedPipelineAccuracy, BENCHMARKS.weightedPipelineAccuracy)}
              note={`Entered as one figure · good ${fmt(BENCHMARKS.weightedPipelineAccuracy.good, "pct0")}`}
            />
          </div>
        </Sheet>

        <Sheet>
          <CardTitle
            note={
              open.length > 0 ? (
                <>
                  {open.map((q) => q.label).join(", ")} is an <Term id="openQuarter" label="open quarter" />: charted, not scored.
                </>
              ) : undefined
            }
          >
            Forecast against actual revenue
          </CardTitle>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.quarters} margin={{ top: 10, right: 16, bottom: 0, left: 4 }}>
                <CartesianGrid stroke="#e4e4e2" vertical={false} />
                <XAxis dataKey="label" tick={TICK} axisLine={{ stroke: "#d0d0cd" }} tickLine={false} padding={{ left: 16, right: 24 }} />
                <YAxis tickFormatter={(v: number) => fmt(v, "usdShort")} tick={TICK} axisLine={false} tickLine={false} width={64} />
                <Tooltip
                  formatter={(v) => (typeof v === "number" ? fmt(v, "usd0") : "–")}
                  contentStyle={{ background: "#1a1d1e", border: "none", borderRadius: 6, color: "#f4f4f3", fontSize: 13 }}
                  itemStyle={{ color: "#f4f4f3" }}
                  labelStyle={{ color: "#f4f4f3", fontWeight: 600 }}
                />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="forecast" name="Forecast" stroke="#2a78d6" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: "#2a78d6" }} />
                <Line isAnimationActive={false} type="monotone" dataKey="actual" name="Actual" stroke="#eb6834" strokeWidth={2.5} dot={{ r: 3, fill: "#eb6834" }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Sheet>

        <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
          <Sheet className="overflow-x-auto">
            <CardTitle>Each closed quarter</CardTitle>
            <table className="num w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="border-b border-ink text-left text-[0.6875rem] uppercase tracking-wider text-ink-2">
                  <th className="py-2 font-medium">Quarter</th>
                  <th className="py-2 text-right font-medium">
                    <Term id="forecast" />
                  </th>
                  <th className="py-2 text-right font-medium">
                    <Term id="actual" />
                  </th>
                  <th className="py-2 text-right font-medium">
                    <Term id="quarterAccuracy" label="Accuracy" align="right" />
                  </th>
                  <th className="py-2 text-right font-medium">
                    <Term id="forecastBias" label="Bias" align="right" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {closed.map((q) => {
                  const h = healthOfValue(q.accuracy, BENCHMARKS.forecastAccuracy);
                  return (
                    <tr key={q.label} className="border-b border-rule-soft">
                      <td className="py-2.5 text-ink-2">{q.label}</td>
                      <td className="py-2.5 text-right">{fmt(q.forecast, "usd0")}</td>
                      <td className="py-2.5 text-right">{fmt(q.actual, "usd0")}</td>
                      <td className={`py-2.5 text-right font-medium ${TONE_TEXT[h]}`}>{fmt(q.accuracy, "pct1")}</td>
                      <td className="py-2.5 text-right">{signed(q.bias)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {first && (
              <div className="mt-4 border-t border-rule-soft pt-3">
                <p className="text-xs text-ink-3">Worked for {first.label}</p>
                <FormulaRow formula="quarterAccuracy" values={{ forecast: first.forecast, actual: first.actual }} />
                <FormulaRow formula="quarterBias" values={{ forecast: first.forecast, actual: first.actual }} resultLabel="Bias" />
              </div>
            )}
          </Sheet>

          <Sheet>
            <CardTitle note={`The green band is ±${fmt(FORECAST_MISS_LINE, "pct0")}, the line SiriusDecisions uses for a missed forecast. Misses high and low cancel, so read bias with accuracy. Not scored: no published range was found.`}>
              Bias across quarters
            </CardTitle>
            <div className={`num text-3xl font-bold ${TONE_TEXT[biasHealth]}`}>{Number.isFinite(bias) ? signed(bias) : "–"}</div>
            <div className="relative mt-5 h-3 rounded-full bg-rule-soft" role="img" aria-label={`Bias ${Number.isFinite(bias) ? signed(bias) : "not available"} on a scale from minus 30% to plus 30%`}>
              <div
                className="absolute inset-y-0 rounded-full bg-good-soft ring-1 ring-good/30"
                style={{ left: `${pos(-FORECAST_MISS_LINE)}%`, width: `${pos(FORECAST_MISS_LINE) - pos(-FORECAST_MISS_LINE)}%` }}
              />
              <div className="absolute top-0 h-3 w-px bg-ink-3" style={{ left: "50%" }} />
              {Number.isFinite(bias) && (
                <div className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm" style={{ left: `${pos(bias)}%`, background: TONE_FILL[biasHealth] }} />
              )}
            </div>
            <div className="num mt-1.5 flex justify-between text-xs text-ink-3">
              <span>Ran low −30%</span>
              <span>0</span>
              <span>Ran high +30%</span>
            </div>
            {closed.length > 0 && (
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                The forecast ran above the actual in {high} of {closed.length} closed quarters and below it in {closed.length - high}.
              </p>
            )}
          </Sheet>
        </div>

        <Breakdown m={m} />
      </div>
    </>
  );
}
