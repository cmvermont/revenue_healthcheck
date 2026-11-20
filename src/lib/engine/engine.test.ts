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
  it("the sales cycle is the four stage days added", () => expect(E.salesCycle(x)).toBe(73));
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
  it("scores 65, 70, 66, and 60 by check, 66 overall", () => {
    expect([r.modules.pipeline.score, r.modules.forecast.score, r.modules.unitEconomics.score, r.modules.funnel.score]).toEqual([65, 70, 66, 60]);
    expect(r.overall).toBe(66);
  });
  it("each check score is its parts' points added and rounded", () => {
    for (const m of Object.values(r.modules)) expect(m.score).toBe(Math.round(m.parts.reduce((a, p) => a + p.points, 0)));
  });
  it("lists checks from weakest to strongest", () => expect(E.weakestFirst(r)).toEqual(["funnel", "pipeline", "unitEconomics", "forecast"]));
  it("matches the worked examples quoted in the glossary", () => {
    expect(r.modules.pipeline.parts.find((p) => p.id === "coverage")!.score).toBeCloseTo(54.7, 1);
    expect(r.modules.pipeline.parts.map((p) => +p.score.toFixed(1))).toEqual([73.3, 64, 70, 54.7]);
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
    expect(E.healthOfValue(0.08, b, true)).toBe("good");
    expect(E.healthOfValue(0.1, b, true)).toBe("warn");
    expect(E.healthOfValue(0.2, b, true)).toBe("critical");
    expect(E.healthOfValue(0.3, E.BENCHMARKS.leadToMql)).toBe("good");
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
    expect(E.diagnose(r.modules.pipeline, E.EXAMPLE)).toContain("The weakest is pipeline coverage at 2.8x, against 3.0x.");
    expect(E.diagnose(r.modules.funnel, E.EXAMPLE)).toContain("win rate at 22.0%");
  });
  it("says so when every input clears its good threshold", () => {
    expect(E.diagnose(E.score(E.EXAMPLE).modules.unitEconomics, E.EXAMPLE)).toMatch(/^Every input clears its good threshold/);
  });
  it("counts the quarters that ran in the direction of the bias", () => {
    const x = clone(E.EXAMPLE);
    x.quarters = x.quarters.map((q) => (q.actual === null ? q : { ...q, forecast: q.actual * 1.35 }));
    const text = E.diagnose(E.score(x).modules.forecast, x);
    expect(text).toContain("ran high in 5 of 5 closed quarters");
  });
  it("names the slowest stage against its reference when the sales cycle is weakest", () => {
    const x = clone(E.EXAMPLE);
    x.stageDays.mqlToSql = 60;
    x.conversion.oppToWon = 0.3;
    const text = E.diagnose(E.score(x).modules.funnel, x);
    expect(text).toContain("MQL → SQL at 60 days against 8 days");
  });
});
