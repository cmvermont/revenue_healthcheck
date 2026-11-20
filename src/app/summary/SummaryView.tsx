"use client";

import Link from "next/link";
import { CheckHeader, CHECK_ROUTES } from "@/components/CheckHeader";
import { useData } from "@/components/DataProvider";
import { FormulaRow } from "@/components/FormulaRow";
import { Term } from "@/components/Term";
import { HEALTH_LABEL, healthOfScore, MODULES, diagnose, weakestFirst } from "@/lib/engine";
import { Meter, ScoreChip, ScoreRing, Sheet, TONE_TEXT } from "@/components/ui";

const hrefOf = (id: string) => CHECK_ROUTES.find((r) => r.module === id)!.href;

export function SummaryView() {
  const { data, result } = useData();
  const h = healthOfScore(result.overall);
  const order = weakestFirst(result);
  const start = order.filter((id) => result.modules[id].score < 80).slice(0, 3);

  return (
    <>
      <CheckHeader />
      <div className="ruled space-y-10">
        <section className="rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-6">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
            <ScoreRing score={result.overall} />
            <div className="w-full flex-1">
              <p className="num text-xs uppercase tracking-widest text-ink-3">
                <Term id="overallScore" />
              </p>
              <p className="mt-2 max-w-2xl leading-relaxed text-ink-2">
                {data.company.trim() || "This company"} scores <strong className={TONE_TEXT[h]}>{HEALTH_LABEL[h].toLowerCase()}</strong> overall.{" "}
                {result.overall >= 80
                  ? "Most inputs sit between their good and best values."
                  : start.length > 0
                    ? `${result.modules[start[0]].name} is the weakest check, and the list below starts there.`
                    : ""}
              </p>
              <FormulaRow
                formula="overallScore"
                values={{
                  pipeline: result.modules.pipeline.score,
                  forecast: result.modules.forecast.score,
                  unitEconomics: result.modules.unitEconomics.score,
                  funnel: result.modules.funnel.score,
                }}
                labels={{ pipeline: "Pipeline", forecast: "Forecast", unitEconomics: "Unit econ.", funnel: "Funnel" }}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold">Four checks</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {MODULES.map((m, i) => {
              const r = result.modules[m.id];
              return (
                <Link key={m.id} href={hrefOf(m.id)}>
                  <Sheet className="h-full hover:border-accent">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="num text-xs text-ink-3">
                          Check {i + 1} of 4 · weight {Math.round(m.weight * 100)}%
                        </p>
                        <h3 className="mt-1 text-2xl font-bold">{m.name}</h3>
                      </div>
                      <ScoreChip score={r.score} />
                    </div>
                    <div className="mt-3">
                      <Meter pct={r.score} health={healthOfScore(r.score)} label={`${m.name} score ${r.score} of 100`} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-2">{diagnose(r, data)}</p>
                    <p className="mt-3 font-medium text-accent">Open {m.name.toLowerCase()} →</p>
                  </Sheet>
                </Link>
              );
            })}
          </div>
        </section>

        {start.length > 0 && (
          <section>
            <h2 className="mb-4 text-2xl font-bold">Where to start</h2>
            <Sheet className="divide-y divide-rule-soft p-0!">
              {start.map((id, i) => {
                const r = result.modules[id];
                return (
                  <div key={id} className="flex items-start gap-4 p-5">
                    <span className="num text-lg font-semibold text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={hrefOf(id)} className="font-semibold hover:text-accent hover:underline underline-offset-4">
                          {r.name}
                        </Link>
                        <ScoreChip score={r.score} />
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">{diagnose(r, data)}</p>
                    </div>
                  </div>
                );
              })}
            </Sheet>
          </section>
        )}

        <section className="rounded-md border border-rule bg-accent-soft p-5">
          <h2 className="text-xl font-bold">Talk through the results</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
            I start consulting engagements with this diagnostic. Enter your own numbers, then get in touch to go through what they show.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/inputs" className="rounded-md bg-accent-strong px-4 py-2 text-sm font-medium text-white hover:bg-accent">
              Enter your numbers
            </Link>
            <a href="https://mongeon.co/consulting" className="rounded-md border border-rule bg-sheet px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent">
              How engagements work →
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
