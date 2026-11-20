/**
 * The scoring engine. Every number on screen comes from these functions, and the tests hold the
 * formulas shown on screen to the same results.
 *
 * Inputs are stored once. Anything that can be worked out from other inputs is derived here and
 * never typed in a second time: win rate is the opportunity-to-won stage rate, the sales cycle is
 * the sum of the stage days, and lead-to-close is the product of the four stage rates.
 */

export type Band = { poor: number; good: number; excellent: number };

export type Quarter = { label: string; forecast: number; actual: number | null };

export type Inputs = {
  company: string;
  stage: string;
  arr: number;
  salesTeamSize: number;
  conversion: { leadToMql: number; mqlToSql: number; sqlToOpp: number; oppToWon: number };
  stageDays: { leadToMql: number; mqlToSql: number; sqlToOpp: number; oppToWon: number };
  coverage: number;
  quarters: Quarter[];
  weightedPipelineAccuracy: number;
  cac: number;
  ltv: number;
  paybackMonths: number;
  grossChurn: number;
  nrr: number;
  avgDealSize: number;
  leadsPerRep: number;
};

export type StageKey = keyof Inputs["conversion"];
export const STAGES: { key: StageKey; label: string; from: string; to: string }[] = [
  { key: "leadToMql", label: "Lead → MQL", from: "Leads", to: "MQLs" },
  { key: "mqlToSql", label: "MQL → SQL", from: "MQLs", to: "SQLs" },
  { key: "sqlToOpp", label: "SQL → Opp", from: "SQLs", to: "Opportunities" },
  { key: "oppToWon", label: "Opp → Won", from: "Opportunities", to: "Won" },
];

/**
 * Illustrative ranges for a B2B SaaS company selling mid-market annual contracts. They are not drawn
 * from a cited dataset; the methodology page says so, and every score is shown with the range it used.
 */
export const BENCHMARKS = {
  leadToMql: { poor: 0.15, good: 0.3, excellent: 0.45 },
  mqlToSql: { poor: 0.2, good: 0.4, excellent: 0.6 },
  sqlToOpp: { poor: 0.3, good: 0.5, excellent: 0.7 },
  coverage: { poor: 1.5, good: 3, excellent: 4.5 },
  forecastAccuracy: { poor: 0.6, good: 0.8, excellent: 0.95 },
  forecastBias: { poor: 0.3, good: 0.1, excellent: 0.03 },
  weightedPipelineAccuracy: { poor: 0.6, good: 0.8, excellent: 0.95 },
  ltvCac: { poor: 1.5, good: 3, excellent: 5 },
  paybackMonths: { poor: 24, good: 15, excellent: 8 },
  grossChurn: { poor: 0.15, good: 0.08, excellent: 0.03 },
  nrr: { poor: 0.9, good: 1.1, excellent: 1.3 },
  winRate: { poor: 0.15, good: 0.25, excellent: 0.35 },
  salesCycle: { poor: 120, good: 75, excellent: 40 },
  leadsPerRep: { poor: 20, good: 40, excellent: 60 },
} satisfies Record<string, Band>;

/** Reference days for each stage. Used to name the slowest stage, not scored on their own. */
export const STAGE_REFERENCE_DAYS: Record<StageKey, number> = { leadToMql: 5, mqlToSql: 8, sqlToOpp: 15, oppToWon: 30 };

export type MetricId = keyof typeof BENCHMARKS;
export type ModuleId = "pipeline" | "forecast" | "unitEconomics" | "funnel";

/** Which direction is better for each scored metric. */
export const LOWER_IS_BETTER: Record<MetricId, boolean> = {
  leadToMql: false,
  mqlToSql: false,
  sqlToOpp: false,
  coverage: false,
  forecastAccuracy: false,
  forecastBias: true,
  weightedPipelineAccuracy: false,
  ltvCac: false,
  paybackMonths: true,
  grossChurn: true,
  nrr: false,
  winRate: false,
  salesCycle: true,
  leadsPerRep: false,
};

/**
 * The four checks and the share of each check that every input carries. No input is scored in two
 * checks: pipeline health covers the stages up to an opportunity and coverage, funnel efficiency
 * covers how reps turn opportunities into revenue.
 */
export const MODULES: { id: ModuleId; name: string; weight: number; parts: [MetricId, number][] }[] = [
  {
    id: "pipeline",
    name: "Pipeline health",
    weight: 0.3,
    parts: [
      ["leadToMql", 0.2],
      ["mqlToSql", 0.25],
      ["sqlToOpp", 0.25],
      ["coverage", 0.3],
    ],
  },
  {
    id: "forecast",
    name: "Forecast accuracy",
    weight: 0.25,
    parts: [
      ["forecastAccuracy", 0.5],
      ["forecastBias", 0.25],
      ["weightedPipelineAccuracy", 0.25],
    ],
  },
  {
    id: "unitEconomics",
    name: "Unit economics",
    weight: 0.25,
    parts: [
      ["ltvCac", 0.3],
      ["paybackMonths", 0.25],
      ["grossChurn", 0.25],
      ["nrr", 0.2],
    ],
  },
  {
    id: "funnel",
    name: "Funnel efficiency",
    weight: 0.2,
    parts: [
      ["winRate", 0.35],
      ["salesCycle", 0.35],
      ["leadsPerRep", 0.3],
    ],
  },
];

// ─── Derived values ──────────────────────────────────────────────────────────

export const leadToClose = (x: Inputs) => x.conversion.leadToMql * x.conversion.mqlToSql * x.conversion.sqlToOpp * x.conversion.oppToWon;
export const winRate = (x: Inputs) => x.conversion.oppToWon;
export const salesCycle = (x: Inputs) => x.stageDays.leadToMql + x.stageDays.mqlToSql + x.stageDays.sqlToOpp + x.stageDays.oppToWon;
export const ltvCac = (x: Inputs) => (x.cac > 0 ? x.ltv / x.cac : NaN);
export const dealsPerRep = (x: Inputs) => x.leadsPerRep * leadToClose(x);
export const opportunitiesPerRep = (x: Inputs) => x.leadsPerRep * x.conversion.leadToMql * x.conversion.mqlToSql * x.conversion.sqlToOpp;
export const revenuePerRep = (x: Inputs) => dealsPerRep(x) * x.avgDealSize * 12;

/** What a number of leads becomes at each stage at these conversion rates. */
export function funnelCounts(x: Inputs, leads = 1000): number[] {
  const out = [leads];
  for (const s of STAGES) out.push(out[out.length - 1] * x.conversion[s.key]);
  return out;
}

export const quarterAccuracy = (forecast: number, actual: number) => (actual > 0 ? Math.max(0, 1 - Math.abs(forecast - actual) / actual) : NaN);
export const quarterBias = (forecast: number, actual: number) => (actual > 0 ? (forecast - actual) / actual : NaN);

export type QuarterResult = Quarter & { actual: number; accuracy: number; bias: number };

/** Closed quarters are the ones with an actual. An open quarter is charted but not scored. */
export function closedQuarters(x: Inputs): QuarterResult[] {
  return x.quarters
    .filter((q): q is Quarter & { actual: number } => q.actual !== null && q.actual > 0)
    .map((q) => ({ ...q, accuracy: quarterAccuracy(q.forecast, q.actual), bias: quarterBias(q.forecast, q.actual) }));
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const averageAccuracy = (x: Inputs) => mean(closedQuarters(x).map((q) => q.accuracy));
/** Positive means the forecast ran above the actual. */
export const averageBias = (x: Inputs) => mean(closedQuarters(x).map((q) => q.bias));

/** The value each scored metric is measured at. Bias is scored on its size, whichever direction it runs. */
export function metricValues(x: Inputs): Record<MetricId, number> {
  return {
    leadToMql: x.conversion.leadToMql,
    mqlToSql: x.conversion.mqlToSql,
    sqlToOpp: x.conversion.sqlToOpp,
    coverage: x.coverage,
    forecastAccuracy: averageAccuracy(x),
    forecastBias: Math.abs(averageBias(x)),
    weightedPipelineAccuracy: x.weightedPipelineAccuracy,
    ltvCac: ltvCac(x),
    paybackMonths: x.paybackMonths,
    grossChurn: x.grossChurn,
    nrr: x.nrr,
    winRate: winRate(x),
    salesCycle: salesCycle(x),
    leadsPerRep: x.leadsPerRep,
  };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Places a value on a 0 to 100 scale against its band. Poor scores 20, good 60, excellent 100,
 * with straight lines between. Past excellent the score holds at 100. Short of poor it falls
 * toward zero: to zero at a value of zero when higher is better, and to zero at twice the poor
 * value when lower is better. A value that is not a number scores zero.
 */
export function scoreMetric(value: number, band: Band, lowerIsBetter = false): number {
  if (!Number.isFinite(value)) return 0;
  const { poor, good, excellent } = band;
  let s: number;
  if (!lowerIsBetter) {
    if (value >= excellent) s = 100;
    else if (value >= good) s = 60 + ((value - good) / (excellent - good)) * 40;
    else if (value >= poor) s = 20 + ((value - poor) / (good - poor)) * 40;
    else s = (value / poor) * 20;
  } else {
    if (value <= excellent) s = 100;
    else if (value <= good) s = 60 + ((good - value) / (good - excellent)) * 40;
    else if (value <= poor) s = 20 + ((poor - value) / (poor - good)) * 40;
    else s = 20 - ((value - poor) / poor) * 20;
  }
  return Math.min(100, Math.max(0, s));
}

export type Health = "good" | "warn" | "critical";
export const HEALTH_LABEL: Record<Health, string> = { good: "Healthy", warn: "Moderate", critical: "At risk" };

/** A check or the overall score: 80 and up is healthy, 60 to 79 moderate, under 60 at risk. */
export const healthOfScore = (score: number): Health => (score >= 80 ? "good" : score >= 60 ? "warn" : "critical");

/** A single input against its band: at or past good is healthy, between poor and good moderate, past poor at risk. */
export function healthOfValue(value: number, band: Band, lowerIsBetter = false): Health {
  if (!Number.isFinite(value)) return "critical";
  if (lowerIsBetter) return value <= band.good ? "good" : value <= band.poor ? "warn" : "critical";
  return value >= band.good ? "good" : value >= band.poor ? "warn" : "critical";
}

export type PartResult = { id: MetricId; value: number; band: Band; lowerIsBetter: boolean; weight: number; score: number; points: number };
export type ModuleResult = { id: ModuleId; name: string; weight: number; parts: PartResult[]; score: number };
export type Result = { modules: Record<ModuleId, ModuleResult>; overall: number };

/** Scores every check, then the overall score from the rounded check scores, so the arithmetic on screen adds up. */
export function score(x: Inputs): Result {
  const values = metricValues(x);
  const modules = {} as Record<ModuleId, ModuleResult>;
  for (const m of MODULES) {
    const parts = m.parts.map(([id, weight]) => {
      const s = scoreMetric(values[id], BENCHMARKS[id], LOWER_IS_BETTER[id]);
      return { id, value: values[id], band: BENCHMARKS[id], lowerIsBetter: LOWER_IS_BETTER[id], weight, score: s, points: s * weight };
    });
    modules[m.id] = { id: m.id, name: m.name, weight: m.weight, parts, score: Math.round(parts.reduce((a, p) => a + p.points, 0)) };
  }
  const overall = overallScore(modules.pipeline.score, modules.forecast.score, modules.unitEconomics.score, modules.funnel.score);
  return { modules, overall };
}

export const WEIGHT: Record<ModuleId, number> = Object.fromEntries(MODULES.map((m) => [m.id, m.weight])) as Record<ModuleId, number>;

export const overallScore = (pipeline: number, forecast: number, unitEconomics: number, funnel: number) =>
  Math.round(pipeline * WEIGHT.pipeline + forecast * WEIGHT.forecast + unitEconomics * WEIGHT.unitEconomics + funnel * WEIGHT.funnel);

/** The stage furthest over its reference days, as a ratio of actual to reference. */
export function slowestStage(x: Inputs): { key: StageKey; label: string; days: number; reference: number; ratio: number } {
  return STAGES.map((s) => ({ key: s.key, label: s.label, days: x.stageDays[s.key], reference: STAGE_REFERENCE_DAYS[s.key], ratio: x.stageDays[s.key] / STAGE_REFERENCE_DAYS[s.key] })).reduce((a, b) =>
    b.ratio > a.ratio ? b : a,
  );
}

/** The module ids from the lowest score to the highest. Ties keep the order of MODULES. */
export const weakestFirst = (r: Result): ModuleId[] => MODULES.map((m) => m.id).sort((a, b) => r.modules[a].score - r.modules[b].score);
