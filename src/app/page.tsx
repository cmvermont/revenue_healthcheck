import Link from "next/link";
import { Sheet } from "@/components/ui";

const CHECKS = [
  {
    href: "/pipeline",
    title: "Pipeline health",
    body: "The three conversion rates up to an opportunity, and pipeline coverage against target.",
  },
  {
    href: "/forecast",
    title: "Forecast accuracy",
    body: "Forecast against actual for each closed quarter, the bias across them, and how well weighted pipeline predicted the result.",
  },
  {
    href: "/unit-economics",
    title: "Unit economics",
    body: "LTV to CAC, CAC payback, gross revenue churn, and net revenue retention.",
  },
  {
    href: "/funnel",
    title: "Funnel efficiency",
    body: "Win rate and the sales cycle from opportunity to close, with deals and revenue per rep worked out from them.",
  },
] as const;

export default function Home() {
  return (
    <>
      <header className="page-head pt-6">
        <p className="num text-xs uppercase tracking-widest text-ink-3">Revenue operations diagnostic</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">Four scores for the health of a revenue engine.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
          I built this healthcheck to score a SaaS revenue operation on four checks: pipeline health, forecast accuracy, unit economics, and funnel
          efficiency. Each check scores its inputs against published benchmarks, shows the arithmetic, and names the weakest input. Start with the
          example company or enter your own numbers.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/summary" className="rounded-md bg-accent-strong px-4 py-2 font-medium text-white hover:bg-accent">
            Open the example →
          </Link>
          <Link href="/inputs" className="rounded-md border border-rule bg-sheet px-4 py-2 font-medium hover:border-accent hover:text-accent">
            Enter your own numbers
          </Link>
        </div>
      </header>
      <div className="ruled space-y-12">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {CHECKS.map((c, i) => (
            <Link key={c.href} href={c.href}>
              <Sheet className="h-full hover:border-accent">
                <p className="num text-xs text-ink-3">Check {i + 1} of 4</p>
                <h2 className="mt-1 text-2xl font-bold">{c.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-2">{c.body}</p>
                <p className="mt-4 font-medium text-accent">Open the check →</p>
              </Sheet>
            </Link>
          ))}
        </div>
        <section className="grid gap-8 rounded-md border border-rule border-t-2 border-t-ink bg-sheet p-5 md:grid-cols-3">
          <div>
            <h3 className="text-xl font-bold">One score from four</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              The overall score weights pipeline health at 30%, forecast accuracy and unit economics at 25% each, and funnel efficiency at 20%. No
              input is scored in more than one check.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Every range has a source</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Each range comes from a published survey, including Benchmarkit, The Bridge Group, and Ebsta with Pavilion. The{" "}
              <Link href="/methodology" className="text-accent underline underline-offset-4">
                methodology
              </Link>{" "}
              names the source for each one and says how any unpublished end was set.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold">Your numbers stay in this browser</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Entries are scored as you type and kept in this browser only. Nothing is sent to a server.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
