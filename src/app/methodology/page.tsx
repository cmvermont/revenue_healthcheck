import Link from "next/link";
import { Sheet } from "@/components/ui";
import { fmt } from "@/lib/format";
import { BENCHMARKS, METRICS, MODULES, STAGE_REFERENCE_DAYS, STAGES } from "@/lib/engine";

export const metadata = { title: "Methodology · Revenue Healthcheck" };

export default function Page() {
  return (
    <>
      <header className="page-head">
        <h1 className="text-4xl font-bold tracking-tight">Methodology</h1>
        <p className="mt-3 max-w-2xl text-ink-2">How each score is built, what is real, what is illustrative, and what the model leaves out.</p>
      </header>
      <div className="ruled space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">How a score is built</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>
                Each input is placed on a 0 to 100 scale against its range: poor scores 20, good 60, and best 100, with straight lines between. Past best
                it holds at 100. Short of poor it falls to zero at a value of zero, or at twice the poor value where lower is better.
              </li>
              <li>A check score is its input scores weighted and added, then rounded. Each check shows the table.</li>
              <li>The overall score weights the rounded check scores: pipeline health 30%, forecast accuracy 25%, unit economics 25%, funnel efficiency 20%.</li>
              <li>
                A score of 80 or more is healthy, 60 to 79 moderate, and under 60 at risk. Because good scores 60, a check whose inputs all sit at their good
                values is moderate. Healthy needs inputs toward best.
              </li>
            </ul>
          </Sheet>
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">One copy of each input</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>Win rate is the Opp → Won stage rate. It is entered once and scored once, under funnel efficiency.</li>
              <li>The sales cycle is the four stage days added. It is scored under funnel efficiency, and the stage days are not scored again.</li>
              <li>Lead-to-close is the four stage rates multiplied. It is shown, not scored, because its parts already are.</li>
              <li>LTV to CAC divides two entered figures. Deals and revenue per rep are worked out from the stage rates, leads per rep, and deal size.</li>
              <li>No input counts in two checks, so one weak input lowers one check.</li>
            </ul>
          </Sheet>
        </div>

        <Sheet className="overflow-x-auto">
          <h2 className="mb-3 text-xl font-bold">What each check scores</h2>
          <table className="num w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[0.6875rem] uppercase tracking-wider text-ink-2">
                <th className="py-2 font-medium">Check and input</th>
                <th className="py-2 text-right font-medium">Weight</th>
                <th className="py-2 text-right font-medium">Poor</th>
                <th className="py-2 text-right font-medium">Good</th>
                <th className="py-2 text-right font-medium">Best</th>
              </tr>
            </thead>
            {MODULES.map((m) => (
              <tbody key={m.id}>
                <tr className="border-b border-rule bg-paper">
                  <td className="py-2 font-semibold" colSpan={1}>
                    {m.name}
                  </td>
                  <td className="py-2 text-right font-semibold">{fmt(m.weight, "pct0")}</td>
                  <td colSpan={3} />
                </tr>
                {m.parts.map(([id, w]) => {
                  const f = METRICS[id].format;
                  const b = BENCHMARKS[id];
                  return (
                    <tr key={id} className="border-b border-rule-soft">
                      <td className="py-2 pl-4 text-ink-2">{METRICS[id].label}</td>
                      <td className="py-2 text-right">{fmt(w, "pct0")}</td>
                      <td className="py-2 text-right text-ink-3">{fmt(b.poor, f)}</td>
                      <td className="py-2 text-right text-ink-3">{fmt(b.good, f)}</td>
                      <td className="py-2 text-right text-ink-3">{fmt(b.excellent, f)}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
          <p className="mt-3 text-xs text-ink-3">Input weights are shares of their check. Forecast bias is scored on its size, whichever direction it runs.</p>
        </Sheet>

        <div className="grid gap-5 md:grid-cols-2">
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">What is real</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>The arithmetic. Every formula on screen is declared once and tested against the scoring engine.</li>
              <li>The example company&apos;s scores are pinned in a test, so a change to the method is made on purpose and seen.</li>
              <li>Your numbers, once entered. They are kept in this browser and never sent to a server.</li>
            </ul>
          </Sheet>
          <Sheet>
            <h2 className="mb-2 text-xl font-bold">What is illustrative</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>The example company and every figure in it.</li>
              <li>
                The benchmark ranges. They describe a B2B SaaS company selling mid-market annual contracts and are not taken from a cited dataset. Replace
                them with your own targets or a published benchmark before a score informs a decision.
              </li>
              <li>
                The stage reference days ({STAGES.map((s) => `${s.label} ${STAGE_REFERENCE_DAYS[s.key]}`).join(", ")}), used only to name the slowest
                stage.
              </li>
            </ul>
          </Sheet>
          <Sheet className="md:col-span-2">
            <h2 className="mb-2 text-xl font-bold">What is left out</h2>
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-ink-2">
              <li>Trend. Each check is a snapshot, apart from the forecast quarters. A rate that is falling scores the same as one that is steady.</li>
              <li>Segments. One set of inputs stands for the whole company. Real funnels differ by segment, channel, and deal size.</li>
              <li>
                LTV, CAC payback, and weighted pipeline accuracy are entered as single figures, not worked out from revenue per account, gross margin,
                churn, or stage probabilities.
              </li>
              <li>
                Leads per rep is scored as more is better up to 60 a month. Past what a rep can work, more leads lower conversion, which the model does not
                capture.
              </li>
              <li>Coverage counts open pipeline at face value, whatever each deal&apos;s stage.</li>
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
