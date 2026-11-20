import Link from "next/link";
import { Sheet } from "@/components/ui";
import { fmt } from "@/lib/format";
import { BASIS_LABEL, BENCHMARKS, METRICS, MODULES, RANGE_SOURCES, SOURCES } from "@/lib/engine";

export const metadata = { title: "Methodology · Revenue Healthcheck" };

const external = "text-accent underline underline-offset-4 hover:text-accent-strong";

export default function Page() {
  return (
    <>
      <header className="page-head">
        <h1 className="text-4xl font-bold tracking-tight">Methodology</h1>
        <p className="mt-3 max-w-2xl text-ink-2">How each score is built, where every benchmark range comes from, and what the model leaves out.</p>
      </header>
      <div className="ruled space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">How a score is built</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>
                Each scored input is placed on a 0 to 100 scale against its range: poor scores 20, good 60, and best 100, with straight lines between. Past
                best it holds at 100. Short of poor it falls to zero at a value of zero, or at twice the poor value where lower is better.
              </li>
              <li>
                Good is a published median or average, so a company at the median scores 60, which is moderate. Healthy means sitting toward the top of the
                published range.
              </li>
              <li>A check score is its input scores weighted and added, then rounded. Each check shows the table.</li>
              <li>The overall score weights the rounded check scores: pipeline health 30%, forecast accuracy 25%, unit economics 25%, funnel efficiency 20%.</li>
              <li>A score of 80 or more is healthy, 60 to 79 moderate, and under 60 at risk.</li>
            </ul>
          </Sheet>
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">One copy of each input</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>Win rate is the Opp → Won stage rate. It is entered once and scored once, under funnel efficiency.</li>
              <li>
                The sales cycle is the Opp → Won stage days, because published sales cycles start at the opportunity. Lead-to-close days add all four stages
                and are shown, not scored.
              </li>
              <li>Lead-to-close rate is the four stage rates multiplied. It is shown, not scored, because its parts already are.</li>
              <li>LTV to CAC divides two entered figures. Deals and revenue per rep are worked out from the stage rates, leads per rep, and deal size.</li>
              <li>No input counts in two checks. Forecast bias and leads per rep are shown and not scored, because no published range was found for either.</li>
            </ul>
          </Sheet>
        </div>

        <Sheet className="overflow-x-auto">
          <h2 className="mb-3 text-xl font-bold">What each check scores</h2>
          <table className="num w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[0.6875rem] uppercase tracking-wider text-ink-2">
                <th className="py-2 font-medium">Check and input</th>
                <th className="py-2 text-right font-medium">Weight</th>
                <th className="py-2 text-right font-medium">Poor</th>
                <th className="py-2 text-right font-medium">Good</th>
                <th className="py-2 text-right font-medium">Best</th>
                <th className="py-2 pl-4 font-medium">Basis</th>
              </tr>
            </thead>
            {MODULES.map((m) => (
              <tbody key={m.id}>
                <tr className="border-b border-rule bg-paper">
                  <td className="py-2 font-semibold">{m.name}</td>
                  <td className="py-2 text-right font-semibold">{fmt(m.weight, "pct0")}</td>
                  <td colSpan={4} />
                </tr>
                {m.parts.map(([id, w]) => {
                  const f = METRICS[id].format;
                  const b = BENCHMARKS[id];
                  return (
                    <tr key={id} className="border-b border-rule-soft">
                      <td className="py-2 pl-4 text-ink-2">
                        <a href={`#range-${id}`} className="hover:text-accent hover:underline underline-offset-4">
                          {METRICS[id].label}
                        </a>
                      </td>
                      <td className="py-2 text-right">{fmt(w, "pct0")}</td>
                      <td className="py-2 text-right text-ink-3">{fmt(b.poor, f)}</td>
                      <td className="py-2 text-right text-ink-3">{fmt(b.good, f)}</td>
                      <td className="py-2 text-right text-ink-3">{fmt(b.excellent, f)}</td>
                      <td className="py-2 pl-4 text-ink-2">{BASIS_LABEL[RANGE_SOURCES[id].basis]}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
          <p className="mt-3 text-xs text-ink-3">Input weights are shares of their check. The weights are this tool&apos;s own; the ranges are published.</p>
        </Sheet>

        <Sheet>
          <h2 className="mb-1 text-xl font-bold">Where each range comes from</h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-ink-2">
            Good is always the published median or average. Where a source publishes quartiles, poor and best are the 25th and 75th percentiles. Where it
            publishes a median and a top figure, best is the top figure and poor is set as far below good as best is above it. Where only an average is
            published, poor and best are set at half and one and a half times it. Each case is named below.
          </p>
          <dl className="grid gap-x-10 gap-y-5 md:grid-cols-2">
            {MODULES.flatMap((m) => m.parts.map(([id]) => id)).map((id) => {
              const r = RANGE_SOURCES[id];
              return (
                <div key={id} id={`range-${id}`} className="scroll-mt-24 border-l-2 border-rule pl-3">
                  <dt className="flex flex-wrap items-baseline gap-x-2 font-semibold">
                    {METRICS[id].label}
                    <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-ink-3">{BASIS_LABEL[r.basis]}</span>
                  </dt>
                  <dd className="mt-1 space-y-1 text-sm leading-relaxed text-ink-2">
                    <p>{r.note}</p>
                    <p className="text-xs">
                      Source:{" "}
                      {r.sources.map((sid, i) => (
                        <span key={sid}>
                          {i > 0 && "; "}
                          <a href={SOURCES[sid].url} className={external} rel="noopener noreferrer" target="_blank">
                            {SOURCES[sid].publisher}
                          </a>
                        </span>
                      ))}
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </Sheet>

        <Sheet>
          <h2 className="mb-3 text-xl font-bold">Sources</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-ink-2">
            {Object.values(SOURCES).map((s) => (
              <li key={s.id}>
                <a href={s.url} className={`font-medium ${external}`} rel="noopener noreferrer" target="_blank">
                  {s.publisher}, {s.title}
                </a>{" "}
                ({s.year}). {s.sample}.
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Sources checked November 2026. Benchmarks move every year; the ranges here should be refreshed when new editions publish.</p>
        </Sheet>

        <div className="grid gap-5 md:grid-cols-2">
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">What is real</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>The benchmark ranges, each tied to a published source above, with any end this tool set named as such.</li>
              <li>The arithmetic. Every formula on screen is declared once and tested against the scoring engine.</li>
              <li>Your numbers, once entered. They are kept in this browser and never sent to a server.</li>
            </ul>
          </Sheet>
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">What is illustrative</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>The example company and every figure in it.</li>
              <li>The weights inside each check and across the four checks.</li>
              <li>The ends of ranges where no quartiles are published. The methodology names each one.</li>
            </ul>
          </Sheet>
          <Sheet className="md:col-span-2">
            <h2 className="mb-2 text-xl font-bold">What is left out</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>
                Segment. The ranges are all-company figures. Published medians differ by contract size and motion: payback is longer and retention higher
                for larger contracts, and usage-priced companies retain more than seat-priced ones.
              </li>
              <li>Trend. Each check is a snapshot, apart from the forecast quarters. A rate that is falling scores the same as one that is steady.</li>
              <li>
                LTV, CAC payback, and weighted pipeline accuracy are entered as single figures, not worked out from revenue per account, gross margin,
                churn, or stage probabilities.
              </li>
              <li>Coverage counts open pipeline at face value, whatever each deal&apos;s stage, and its range is a rule of thumb rather than survey data.</li>
              <li>Stage conversion rates depend on how a company defines a lead, an MQL, and an SQL, so published averages for them disagree.</li>
            </ul>
          </Sheet>
        </div>
        <p className="text-sm text-ink-2">
          Terms are defined in the{" "}
          <Link href="/glossary" className="text-accent underline underline-offset-4">
            glossary
          </Link>
          .
        </p>
      </div>
    </>
  );
}
