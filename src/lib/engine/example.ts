import type { Inputs } from "./model";

/**
 * The example company. Every figure is illustrative. Rates are decimals: 0.35 is 35%.
 * Lead-to-close, win rate, sales cycle, and LTV to CAC are derived from these, never stored.
 */
export const EXAMPLE: Inputs = {
  company: "Acme SaaS",
  stage: "Series B",
  arr: 15_000_000,
  salesTeamSize: 80,
  conversion: { leadToMql: 0.35, mqlToSql: 0.42, sqlToOpp: 0.55, oppToWon: 0.22 },
  stageDays: { leadToMql: 8, mqlToSql: 12, sqlToOpp: 18, oppToWon: 35 },
  coverage: 2.8,
  quarters: [
    { label: "Q1 2025", forecast: 3_200_000, actual: 2_850_000 },
    { label: "Q2 2025", forecast: 3_500_000, actual: 3_100_000 },
    { label: "Q3 2025", forecast: 3_800_000, actual: 3_950_000 },
    { label: "Q4 2025", forecast: 4_200_000, actual: 3_700_000 },
    { label: "Q1 2026", forecast: 4_500_000, actual: 4_100_000 },
    { label: "Q2 2026", forecast: 4_800_000, actual: null },
  ],
  weightedPipelineAccuracy: 0.72,
  cac: 18_500,
  ltv: 67_000,
  paybackMonths: 14,
  grossChurn: 0.08,
  nrr: 1.12,
  avgDealSize: 42_000,
  leadsPerRep: 45,
};
