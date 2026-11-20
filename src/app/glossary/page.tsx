import { FORMULAS, formulaText } from "@/lib/glossary/formulas";
import { TERM_GROUPS, TERM_LIST, TERMS } from "@/lib/glossary/terms";

export const metadata = { title: "Glossary · Revenue Healthcheck" };

export default function Page() {
  return (
    <>
      <header className="page-head">
        <h1 className="text-4xl font-bold tracking-tight">Glossary</h1>
        <p className="mt-3 max-w-2xl text-ink-2">Every term with an info bubble in the checks, with its formula where it has one. Examples use the example company.</p>
        <nav className="mt-4 flex flex-wrap gap-4 text-sm">
          {TERM_GROUPS.map((g) => (
            <a key={g} href={`#${g.replace(/\s/g, "-")}`} className="text-accent underline underline-offset-4">
              {g}
            </a>
          ))}
        </nav>
      </header>
      <div className="ruled space-y-10">
        {TERM_GROUPS.map((g) => (
          <section key={g} id={g.replace(/\s/g, "-")} className="scroll-mt-24">
            <h2 className="mb-4 inline-block rounded-md border border-rule border-t-2 border-t-ink bg-sheet px-4 py-2 text-2xl font-bold">{g}</h2>
            <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
              {TERM_LIST.filter((t) => t.group === g).map((t) => {
                const f = t.formulaId ? FORMULAS[t.formulaId] : undefined;
                return (
                  <div key={t.id} id={t.id} className="scroll-mt-24 rounded-md border border-rule bg-sheet p-4">
                    <dt className="font-semibold">{t.name}</dt>
                    <dd className="mt-1 space-y-1.5 text-sm leading-relaxed text-ink-2">
                      <p className="text-ink">{t.short}</p>
                      {f && <p className="num rounded-sm bg-accent-soft px-2 py-1 text-xs text-accent">{formulaText(f, (id) => TERMS[id]?.name ?? id)}</p>}
                      {t.example && (
                        <p>
                          <span className="font-medium text-ink">Example:</span> {t.example}
                        </p>
                      )}
                      {t.caveat && (
                        <p>
                          <span className="font-medium text-ink">Watch for:</span> {t.caveat}
                        </p>
                      )}
                      {t.aliases && (
                        <p>
                          <span className="font-medium text-ink">Also called:</span> {t.aliases.join(", ")}
                        </p>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
