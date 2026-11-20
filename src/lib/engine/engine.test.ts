import { describe, expect, it } from "vitest";
import * as E from ".";

const clone = (x: E.Inputs): E.Inputs => JSON.parse(JSON.stringify(x));

describe("scoreMetric", () => {
  const band = { poor: 10, good: 20, excellent: 40 };
  it("puts poor at 20, good at 60, and best at 100", () => {
    expect(E.scoreMetric(10, band)).toBe(20);
    expect(E.scoreMetric(20, band)).toBe(60);
    expect(E.scoreMetric(40, band)).toBe(100);
    expect(E.scoreMetric(30, band)).toBe(80);
    expect(E.scoreMetric(15, band)).toBe(40);
  });
  it("holds at 100 past best and falls to zero at zero", () => {
    expect(E.scoreMetric(400, band)).toBe(100);
    expect(E.scoreMetric(5, band)).toBe(10);
    expect(E.scoreMetric(0, band)).toBe(0);
    expect(E.scoreMetric(-3, band)).toBe(0);
  });
  it("runs the other way when lower is better, reaching zero at twice the poor value", () => {
    const low = { poor: 120, good: 75, excellent: 40 };
    expect(E.scoreMetric(40, low, true)).toBe(100);
    expect(E.scoreMetric(75, low, true)).toBe(60);
    expect(E.scoreMetric(120, low, true)).toBe(20);
    expect(E.scoreMetric(180, low, true)).toBe(10);
    expect(E.scoreMetric(240, low, true)).toBe(0);
    expect(E.scoreMetric(500, low, true)).toBe(0);
  });
  it("never decreases as the value improves, in either direction", () => {
    for (const [id, b] of Object.entries(E.BENCHMARKS) as [E.MetricId, E.Band][]) {
      const lower = E.LOWER_IS_BETTER[id];
      const lo = Math.min(b.poor, b.excellent) / 4;
      const hi = Math.max(b.poor, b.excellent) * 2.5;
      let prev = -1;
      for (let i = 0; i <= 400; i++) {
        const v = lower ? hi - ((hi - lo) * i) / 400 : lo + ((hi - lo) * i) / 400;
        const s = E.scoreMetric(v, b, lower);
        expect(s, `${id} at ${v}`).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = s;
      }
    }
  });
  it("scores a value that is not a number as zero", () => {
    expect(E.scoreMetric(NaN, band)).toBe(0);
    expect(E.scoreMetric(Infinity, band)).toBe(0);
  });
});

describe("the model's structure", () => {
  it("weights the four checks to 100%, and the inputs inside each check to 100%", () => {
    expect(E.MODULES.reduce((a, m) => a + m.weight, 0)).toBeCloseTo(1, 10);
    for (const m of E.MODULES) expect(m.parts.reduce((a, [, w]) => a + w, 0), m.id).toBeCloseTo(1, 10);
  });
  it("scores every benchmarked input in exactly one check", () => {
    const used = E.MODULES.flatMap((m) => m.parts.map(([id]) => id));
    expect(new Set(used).size).toBe(used.length);
    expect(new Set(used)).toEqual(new Set(Object.keys(E.BENCHMARKS)));
  });
  it("orders every band from poor through good to best", () => {
    for (const [id, b] of Object.entries(E.BENCHMARKS) as [E.MetricId, E.Band][]) {
      if (E.LOWER_IS_BETTER[id]) expect(b.poor > b.good && b.good > b.excellent, id).toBe(true);
      else expect(b.poor < b.good && b.good < b.excellent, id).toBe(true);
    }
  });
});

describe("derived values come from one copy of each input", () => {
  const x = E.EXAMPLE;
  it("win rate is the Opp → Won stage rate", () => expect(E.winRate(x)).toBe(x.conversion.oppToWon));
  it("the sales cycle is the Opp → Won stage days, and lead-to-close days add all four", () => {
    expect(E.salesCycle(x)).toBe(84);
    expect(E.leadToCloseDays(x)).toBe(122);
  });
  it("lead-to-close is the four stage rates multiplied, and matches the funnel's last count", () => {
    expect(E.leadToClose(x)).toBeCloseTo(0.35 * 0.42 * 0.55 * 0.22, 12);
    expect(E.funnelCounts(x, 1000)[4] / 1000).toBeCloseTo(E.leadToClose(x), 12);
  });
  it("LTV to CAC divides the two, and is not a number when CAC is zero", () => {
    expect(E.ltvCac(x)).toBeCloseTo(67000 / 18500, 12);
    expect(E.ltvCac({ ...x, cac: 0 })).toBeNaN();
  });
  it("revenue per rep is deals per rep × deal size × 12", () => {
    expect(E.revenuePerRep(x)).toBeCloseTo(45 * E.leadToClose(x) * 42000 * 12, 6);
  });
});

describe("forecast arithmetic", () => {
  it("measures accuracy and bias against the actual, positive when the forecast ran high", () => {
    expect(E.quarterAccuracy(3_200_000, 2_850_000)).toBeCloseTo(1 - 350_000 / 2_850_000, 12);
    expect(E.quarterBias(3_200_000, 2_850_000)).toBeCloseTo(350_000 / 2_850_000, 12);
    expect(E.quarterBias(3_800_000, 3_950_000)).toBeLessThan(0);
  });
  it("floors a quarter's accuracy at zero", () => expect(E.quarterAccuracy(10, 4)).toBe(0));
  it("scores closed quarters only", () => {
    expect(E.closedQuarters(E.EXAMPLE)).toHaveLength(5);
    const none = clone(E.EXAMPLE);
    none.quarters = none.quarters.map((q) => ({ ...q, actual: null }));
    expect(E.averageAccuracy(none)).toBeNaN();
    expect(E.score(none).modules.forecast.parts[0].score).toBe(0);
  });
});

describe("the example company", () => {
  const r = E.score(E.EXAMPLE);
  // Pinned so that a change to the method shows up here first and is made on purpose.
  it("scores 64, 80, 69, and 71 by check, 71 overall", () => {
    expect([r.modules.pipeline.score, r.modules.forecast.score, r.modules.unitEconomics.score, r.modules.funnel.score]).toEqual([64, 80, 69, 71]);
    expect(r.overall).toBe(71);
  });
  it("each check score is its parts' points added and rounded", () => {
    for (const m of Object.values(r.modules)) expect(m.score).toBe(Math.round(m.parts.reduce((a, p) => a + p.points, 0)));
  });
  it("lists checks from weakest to strongest", () => expect(E.weakestFirst(r)).toEqual(["pipeline", "unitEconomics", "funnel", "forecast"]));
  it("matches the worked examples quoted in the glossary", () => {
    expect(r.modules.pipeline.parts.map((p) => +p.score.toFixed(1))).toEqual([48.3, 66.2, 84.8, 54.7]);
    expect(E.averageAccuracy(E.EXAMPLE)).toBeCloseTo(0.895, 3);
    expect(E.averageBias(E.EXAMPLE)).toBeCloseTo(0.089, 3);
    expect(E.closedQuarters(E.EXAMPLE).filter((q) => q.bias > 0)).toHaveLength(4);
    expect(E.ltvCac(E.EXAMPLE)).toBeCloseTo(3.62, 2);
    expect(E.leadToClose(E.EXAMPLE)).toBeCloseTo(0.0178, 4);
    expect(E.dealsPerRep(E.EXAMPLE)).toBeCloseTo(0.8, 2);
    expect(Math.round(E.revenuePerRep(E.EXAMPLE))).toBe(403_409);
  });
});

describe("health labels", () => {
  it("bands scores at 80 and 60", () => {
    expect([E.healthOfScore(80), E.healthOfScore(79), E.healthOfScore(60), E.healthOfScore(59)]).toEqual(["good", "warn", "warn", "critical"]);
  });
  it("calls an input healthy at its good value and at risk past poor, in both directions", () => {
    const b = E.BENCHMARKS.grossChurn;
    expect(E.healthOfValue(0.16, b, true)).toBe("good");
    expect(E.healthOfValue(0.2, b, true)).toBe("warn");
    expect(E.healthOfValue(0.3, b, true)).toBe("critical");
    expect(E.healthOfValue(0.41, E.BENCHMARKS.leadToMql)).toBe("good");
    expect(E.healthOfValue(0.1, E.BENCHMARKS.leadToMql)).toBe("critical");
  });
  it("agrees with the input score: healthy means a score of at least 60", () => {
    for (const [id, b] of Object.entries(E.BENCHMARKS) as [E.MetricId, E.Band][]) {
      for (const v of [b.poor, b.good, b.excellent, (b.poor + b.good) / 2, (b.good + b.excellent) / 2]) {
        const healthy = E.healthOfValue(v, b, E.LOWER_IS_BETTER[id]) === "good";
        expect(healthy, `${id} at ${v}`).toBe(E.scoreMetric(v, b, E.LOWER_IS_BETTER[id]) >= 60 - 1e-9);
      }
    }
  });
});

describe("diagnosis", () => {
  it("names the weakest input, its value, and its good threshold", () => {
    const r = E.score(E.EXAMPLE);
    expect(E.diagnose(r.modules.pipeline, E.EXAMPLE)).toContain("The weakest is lead → MQL rate at 35.0%, against 41.0%.");
    expect(E.diagnose(r.modules.unitEconomics, E.EXAMPLE)).toContain("LTV to CAC at 3.62x, against 4.10x");
  });
  it("says so when every input clears its good threshold", () => {
    expect(E.diagnose(E.score(E.EXAMPLE).modules.funnel, E.EXAMPLE)).toMatch(/^Every input clears its good threshold/);
  });
  it("counts the quarters that ran in the direction of the bias", () => {
    const x = clone(E.EXAMPLE);
    x.quarters = x.quarters.map((q) => (q.actual === null ? q : { ...q, forecast: q.actual * 1.35 }));
    const text = E.diagnose(E.score(x).modules.forecast, x);
    expect(text).toContain("ran high in 5 of 5 closed quarters");
  });
  it("compares the sales cycle with the published median when it is weakest", () => {
    const x = clone(E.EXAMPLE);
    x.stageDays.oppToWon = 150;
    x.conversion.oppToWon = 0.3;
    const text = E.diagnose(E.score(x).modules.funnel, x);
    expect(text).toContain("Opportunities take 150 days to close against a published median of 91 days.");
    expect(text).toContain("late-stage deals stall");
  });
});

describe("benchmark sources", () => {
  it("every scored range names at least one known source", () => {
    for (const id of Object.keys(E.BENCHMARKS) as E.MetricId[]) {
      const r = E.RANGE_SOURCES[id];
      expect(r, id).toBeDefined();
      expect(r.sources.length, id).toBeGreaterThan(0);
      for (const s of r.sources) expect(E.SOURCES[s], `${id} -> ${s}`).toBeDefined();
      expect(r.note.length, id).toBeGreaterThan(20);
    }
  });
  it("holds the published quartiles exactly", () => {
    expect(E.BENCHMARKS.ltvCac).toEqual({ poor: 1.1, good: 4.1, excellent: 7.8 });
    expect(E.BENCHMARKS.paybackMonths).toEqual({ poor: 24, good: 16, excellent: 10 });
    expect(E.BENCHMARKS.nrr).toEqual({ poor: 0.92, good: 1.02, excellent: 1.1 });
    // Gross revenue retention of 76%, 84%, 91% read as churn.
    expect(E.BENCHMARKS.grossChurn.poor).toBeCloseTo(1 - 0.76, 10);
    expect(E.BENCHMARKS.grossChurn.good).toBeCloseTo(1 - 0.84, 10);
    expect(E.BENCHMARKS.grossChurn.excellent).toBeCloseTo(1 - 0.91, 10);
  });
  it("derives the top figures from the published ones", () => {
    expect(E.BENCHMARKS.winRate.excellent).toBeCloseTo(+(0.19 * 1.43).toFixed(2), 10);
    expect(E.BENCHMARKS.salesCycle.excellent).toBe(Math.round(91 * 0.58));
    expect(E.BENCHMARKS.forecastAccuracy.good).toBe(0.75);
  });
  it("mirrors an unpublished end around good, and sets average-only ends at half and one and a half times", () => {
    for (const id of Object.keys(E.BENCHMARKS) as E.MetricId[]) {
      const b = E.BENCHMARKS[id];
      const basis = E.RANGE_SOURCES[id].basis;
      if (basis === "median and top") expect(Math.abs(b.good - b.poor), id).toBeCloseTo(Math.abs(b.excellent - b.good), 10);
      if (basis === "average") {
        expect(b.poor, id).toBeCloseTo(b.good * 0.5, 10);
        expect(b.excellent, id).toBeCloseTo(b.good * 1.5, 10);
      }
    }
  });
});
