import type { Fmt } from "../format";
import type { MetricId } from "./model";

/** How each scored input is named, displayed, and linked to the glossary. */
export const METRICS: Record<MetricId, { label: string; termId: string; format: Fmt }> = {
  leadToMql: { label: "Lead → MQL rate", termId: "leadToMql", format: "pct1" },
  mqlToSql: { label: "MQL → SQL rate", termId: "mqlToSql", format: "pct1" },
  sqlToOpp: { label: "SQL → Opp rate", termId: "sqlToOpp", format: "pct1" },
  coverage: { label: "Pipeline coverage", termId: "coverage", format: "x1" },
  forecastAccuracy: { label: "Forecast accuracy", termId: "forecastAccuracy", format: "pct1" },
  weightedPipelineAccuracy: { label: "Weighted pipeline accuracy", termId: "weightedPipelineAccuracy", format: "pct1" },
  ltvCac: { label: "LTV to CAC", termId: "ltvCac", format: "x2" },
  paybackMonths: { label: "CAC payback", termId: "payback", format: "months" },
  grossChurn: { label: "Gross revenue churn", termId: "grossChurn", format: "pct1" },
  nrr: { label: "Net revenue retention", termId: "nrr", format: "pct1" },
  winRate: { label: "Win rate", termId: "winRate", format: "pct1" },
  salesCycle: { label: "Sales cycle", termId: "salesCycle", format: "days" },
};
