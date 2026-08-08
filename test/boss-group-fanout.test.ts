import { describe, it, expect } from "vitest";
import { buildBundle } from "../src/build.js";

/**
 * Boss groups must fan out from EITHER field. "Dagannoth Kings" in bossName
 * imported as one untracked goal (user stress test, 2026-08-08) because the
 * expander only looked at `name`.
 */
describe("boss group fan-out", () => {
  it("fans a group given via bossName, carrying repeat fields to every member", () => {
    const { bundle, warnings } = buildBundle({
      sections: [{ name: "S", goals: [
        { type: "BOSS", bossName: "Dagannoth Kings", targetValue: 5,
          repeatEvery: "WEEKLY", repeatChunk: 5 },
      ]}],
    } as any);
    const goals = (bundle.sections![0] as any).goals;
    expect(goals.length).toBe(3);
    for (const g of goals) {
      expect(["Dagannoth Prime", "Dagannoth Rex", "Dagannoth Supreme"]).toContain(g.bossName);
      expect(g.repeatEvery).toBe("WEEKLY");
      expect(g.repeatChunk).toBe(5);
    }
    expect(warnings.join(" ")).toContain("expanded");
  });

  it("still fans a group given via name", () => {
    const { bundle } = buildBundle({
      goals: [{ type: "BOSS", name: "GWD", targetValue: 1 }],
    } as any);
    expect(bundle.goals!.length).toBe(4);
  });

  it("a real single boss in bossName never fans", () => {
    const { bundle } = buildBundle({
      goals: [{ type: "BOSS", bossName: "Zulrah", targetValue: 50 }],
    } as any);
    expect(bundle.goals!.length).toBe(1);
    expect((bundle.goals![0] as any).bossName).toBe("Zulrah");
  });

  it("an unknown non-group bossName still passes through unverified", () => {
    const { bundle, warnings } = buildBundle({
      goals: [{ type: "BOSS", bossName: "Not A Boss", targetValue: 1 }],
    } as any);
    expect(bundle.goals!.length).toBe(1);
    expect(warnings.join(" ")).toContain("UNVERIFIED");
  });
});
