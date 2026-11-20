import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as E from "../engine";
import { FORMULAS, FORMULA_LIST } from "./formulas";
import { TERMS, TERM_LIST } from "./terms";

describe("glossary integrity", () => {
  it("every term id is unique", () => {
    expect(new Set(TERM_LIST.map((t) => t.id)).size).toBe(TERM_LIST.length);
  });
  it("every formula a term points to exists", () => {
    for (const t of TERM_LIST) if (t.formulaId) expect(FORMULAS[t.formulaId], `${t.id} -> ${t.formulaId}`).toBeDefined();
  });
  it("every term a formula references exists, and every operand token is declared", () => {
    for (const f of FORMULA_LIST) {
      expect(TERMS[f.resultTermId], `${f.id} result`).toBeDefined();
      for (const [key, operand] of Object.entries(f.vars)) expect(TERMS[operand.termId], `${f.id}.${key}`).toBeDefined();
      for (const t of f.tokens) if (t.kind === "var") expect(f.vars[t.key], `${f.id} token ${t.key}`).toBeDefined();
    }
  });
  it("every scored input links to a term", () => {
    for (const [id, m] of Object.entries(E.METRICS)) expect(TERMS[m.termId], id).toBeDefined();
  });
});

const BANNED = ["—", "…", "...", "delve", "tapestry", "foster", "bespoke", "vibrant", "comprehensive", "furthermore", "moreover", "additionally", "consequently", "not only"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") ? [p] : [];
  });
}

describe("copy follows the voice profile", () => {
  it("definitions have no em dashes, ellipses, or forbidden words", () => {
    const text = JSON.stringify(TERM_LIST).toLowerCase();
    for (const word of BANNED) expect(text, word).not.toContain(word);
  });
  it("no source file carries an em dash, so none can reach a page", () => {
    for (const file of sourceFiles(join(__dirname, "..", ".."))) expect(readFileSync(file, "utf8"), file).not.toContain("—");
  });
});

describe("each displayed formula computes what the engine computes", () => {
  const x = E.EXAMPLE;
  const r = E.score(x);
  const q = E.closedQuarters(x)[0];
  const cases: [string, Record<string, number>, number][] = [
    ["leadToClose", { ...x.conversion }, E.leadToClose(x)],
    ["leadToCloseDays", { ...x.stageDays }, E.leadToCloseDays(x)],
    ["quarterAccuracy", { forecast: q.forecast, actual: q.actual }, q.accuracy],
    ["quarterBias", { forecast: q.forecast, actual: q.actual }, q.bias],
    ["ltvCac", { ltv: x.ltv, cac: x.cac }, E.ltvCac(x)],
    ["dealsPerRep", { leadsPerRep: x.leadsPerRep, leadToClose: E.leadToClose(x) }, E.dealsPerRep(x)],
    ["revenuePerRep", { dealsPerRep: E.dealsPerRep(x), avgDealSize: x.avgDealSize }, E.revenuePerRep(x)],
    [
      "overallScore",
      { pipeline: r.modules.pipeline.score, forecast: r.modules.forecast.score, unitEconomics: r.modules.unitEconomics.score, funnel: r.modules.funnel.score },
      r.overall,
    ],
  ];
  it.each(cases)("%s", (id, inputs, expected) => {
    expect(FORMULAS[id].compute(inputs)).toBeCloseTo(expected, 9);
  });
  it("covers every formula", () => {
    expect(new Set(cases.map((c) => c[0]))).toEqual(new Set(FORMULA_LIST.map((f) => f.id)));
  });
});
