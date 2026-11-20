import type { Fmt } from "../format";
import { overallScore, quarterAccuracy, quarterBias } from "../engine/model";

export type Token = { kind: "var"; key: string } | { kind: "op"; text: string };

export type Formula = {
  id: string;
  name: string;
  /** Each operand: its glossary term and how it is displayed. */
  vars: Record<string, { termId: string; format: Fmt }>;
  /** Operand references and operator symbols in display order. */
  tokens: Token[];
  resultTermId: string;
  resultFormat: Fmt;
  compute: (v: Record<string, number>) => number;
};

const v = (key: string): Token => ({ kind: "var", key });
const op = (text: string): Token => ({ kind: "op", text });

const list: Formula[] = [
  {
    id: "leadToClose",
    name: "Lead-to-close rate",
    vars: {
      leadToMql: { termId: "leadToMql", format: "pct1" },
      mqlToSql: { termId: "mqlToSql", format: "pct1" },
      sqlToOpp: { termId: "sqlToOpp", format: "pct1" },
      oppToWon: { termId: "winRate", format: "pct1" },
    },
    tokens: [v("leadToMql"), op("×"), v("mqlToSql"), op("×"), v("sqlToOpp"), op("×"), v("oppToWon")],
    resultTermId: "leadToClose",
    resultFormat: "pct2",
    compute: (x) => x.leadToMql * x.mqlToSql * x.sqlToOpp * x.oppToWon,
  },
  {
    id: "salesCycle",
    name: "Sales cycle",
    vars: {
      leadToMql: { termId: "stageDays", format: "days" },
      mqlToSql: { termId: "stageDays", format: "days" },
      sqlToOpp: { termId: "stageDays", format: "days" },
      oppToWon: { termId: "stageDays", format: "days" },
    },
    tokens: [v("leadToMql"), op("+"), v("mqlToSql"), op("+"), v("sqlToOpp"), op("+"), v("oppToWon")],
    resultTermId: "salesCycle",
    resultFormat: "days",
    compute: (x) => x.leadToMql + x.mqlToSql + x.sqlToOpp + x.oppToWon,
  },
  {
    id: "quarterAccuracy",
    name: "Quarter accuracy",
    vars: { forecast: { termId: "forecast", format: "usd0" }, actual: { termId: "actual", format: "usd0" } },
    tokens: [op("1 − |"), v("forecast"), op("−"), v("actual"), op("| ÷"), v("actual")],
    resultTermId: "quarterAccuracy",
    resultFormat: "pct1",
    compute: (x) => quarterAccuracy(x.forecast, x.actual),
  },
  {
    id: "quarterBias",
    name: "Quarter bias",
    vars: { forecast: { termId: "forecast", format: "usd0" }, actual: { termId: "actual", format: "usd0" } },
    tokens: [op("("), v("forecast"), op("−"), v("actual"), op(") ÷"), v("actual")],
    resultTermId: "forecastBias",
    resultFormat: "pct1",
    compute: (x) => quarterBias(x.forecast, x.actual),
  },
  {
    id: "ltvCac",
    name: "LTV to CAC",
    vars: { ltv: { termId: "ltv", format: "usd0" }, cac: { termId: "cac", format: "usd0" } },
    tokens: [v("ltv"), op("÷"), v("cac")],
    resultTermId: "ltvCac",
    resultFormat: "x2",
    compute: (x) => (x.cac > 0 ? x.ltv / x.cac : NaN),
  },
  {
    id: "dealsPerRep",
    name: "Deals per rep",
    vars: { leadsPerRep: { termId: "leadsPerRep", format: "int" }, leadToClose: { termId: "leadToClose", format: "pct2" } },
    tokens: [v("leadsPerRep"), op("×"), v("leadToClose")],
    resultTermId: "dealsPerRep",
    resultFormat: "ratio",
    compute: (x) => x.leadsPerRep * x.leadToClose,
  },
  {
    id: "revenuePerRep",
    name: "Revenue per rep",
    vars: { dealsPerRep: { termId: "dealsPerRep", format: "ratio" }, avgDealSize: { termId: "avgDealSize", format: "usd0" } },
    tokens: [v("dealsPerRep"), op("×"), v("avgDealSize"), op("× 12")],
    resultTermId: "revenuePerRep",
    resultFormat: "usd0",
    compute: (x) => x.dealsPerRep * x.avgDealSize * 12,
  },
  {
    id: "overallScore",
    name: "Overall score",
    vars: {
      pipeline: { termId: "checkScore", format: "int" },
      forecast: { termId: "checkScore", format: "int" },
      unitEconomics: { termId: "checkScore", format: "int" },
      funnel: { termId: "checkScore", format: "int" },
    },
    tokens: [v("pipeline"), op("× 30% +"), v("forecast"), op("× 25% +"), v("unitEconomics"), op("× 25% +"), v("funnel"), op("× 20%")],
    resultTermId: "overallScore",
    resultFormat: "int",
    compute: (x) => overallScore(x.pipeline, x.forecast, x.unitEconomics, x.funnel),
  },
];

export const FORMULAS: Record<string, Formula> = Object.fromEntries(list.map((f) => [f.id, f]));
export const FORMULA_LIST: Formula[] = list;

/** Plain-text rendering of a formula using term names, for the glossary. */
export function formulaText(f: Formula, nameOf: (termId: string) => string): string {
  const body = f.tokens.map((t) => (t.kind === "op" ? t.text : nameOf(f.vars[t.key].termId))).join(" ");
  return `${body} = ${nameOf(f.resultTermId)}`;
}
