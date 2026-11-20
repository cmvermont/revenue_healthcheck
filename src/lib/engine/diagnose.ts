import { fmt } from "../format";
import { METRICS } from "./metrics";
import { averageBias, closedQuarters, slowestStage, type Inputs, type MetricId, type ModuleResult } from "./model";

/** What to look at first when an input is the weakest in its check. Written to name the next step, not to grade. */
function action(id: MetricId, x: Inputs): string {
  switch (id) {
    case "leadToMql":
      return "Review lead sources and the MQL definition before buying more volume.";
    case "mqlToSql":
      return "Check that marketing and sales use the same qualification rules, and how quickly sales follows up.";
    case "sqlToOpp":
      return "Look at discovery: how many accepted leads reach a real first meeting with a buyer.";
    case "coverage":
      return "Add qualified pipeline for the quarter, or plan now for a shortfall against quota.";
    case "forecastAccuracy":
      return "Inspect the forecast each week against stage-weighted pipeline, deal by deal.";
    case "forecastBias": {
      const b = averageBias(x);
      const q = closedQuarters(x);
      const n = q.filter((r) => (b > 0 ? r.bias > 0 : r.bias < 0)).length;
      return b > 0
        ? `The forecast ran high in ${n} of ${q.length} closed quarters. Check rep commit discipline and the probability assigned to each stage.`
        : `The forecast ran low in ${n} of ${q.length} closed quarters. Check for sandbagging and stage probabilities set too low.`;
    }
    case "weightedPipelineAccuracy":
      return "Recalibrate stage probabilities against the close rates each stage has delivered.";
    case "ltvCac":
      return "Lower acquisition cost or raise retention and expansion before adding acquisition spend.";
    case "paybackMonths":
      return "Shorten payback through pricing, discount discipline, or cheaper acquisition channels.";
    case "grossChurn":
      return "Find where customers leave: onboarding, adoption, or renewal.";
    case "nrr":
      return "Build expansion into the account plan: seat growth, upsell paths, and usage tiers.";
    case "winRate":
      return "Tighten qualification to the ideal customer profile and review the reasons on lost deals.";
    case "salesCycle": {
      const s = slowestStage(x);
      return `The slowest stage against its reference is ${s.label} at ${fmt(s.days, "days")} against ${fmt(s.reference, "days")}.`;
    }
    case "leadsPerRep":
      return "Reps may be short of leads. Check territory design and SDR capacity.";
  }
}

const value = (id: MetricId, v: number) => fmt(v, METRICS[id].format);
/** Lowercases the first letter for use mid-sentence, unless it starts an acronym such as LTV or MQL. */
const inSentence = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

/**
 * The diagnosis for one check, built from its inputs: how many fall short of their good threshold,
 * which one is weakest, and what to look at first.
 */
export function diagnose(m: ModuleResult, x: Inputs): string {
  const below = m.parts.filter((p) => p.score < 60);
  const weakest = [...m.parts].sort((a, b) => a.score - b.score)[0];
  const label = inSentence(METRICS[weakest.id].label);
  if (below.length === 0) {
    return `Every input clears its good threshold, which scores 60. A healthy check needs inputs closer to the best values. The closest to slipping is ${label} at ${value(weakest.id, weakest.value)}.`;
  }
  const count = below.length === 1 ? "One input is" : `${below.length} of ${m.parts.length} inputs are`;
  return `${count} short of the good threshold. The weakest is ${label} at ${value(weakest.id, weakest.value)}, against ${value(weakest.id, weakest.band.good)}. ${action(weakest.id, x)}`;
}
