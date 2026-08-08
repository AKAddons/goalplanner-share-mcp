import { describe, it, expect } from "vitest";
import { buildBundle } from "../src/build.js";

/**
 * Repeat fields on the wire (plugin ADR-0006).
 *
 * The contract the two repos have to agree on: additive to GPSHARE2, the
 * chunk travels, the re-based target does not.
 */
describe("repeatable goals in share codes", () => {
  it("carries repeatEvery and repeatChunk onto the emitted goal", () => {
    const { bundle } = buildBundle({
      goals: [
        {
          type: "SKILL",
          name: "Prayer +10K XP",
          skillName: "PRAYER",
          targetValue: 9_810_000,
          repeatEvery: "WEEKLY",
          repeatChunk: 10_000,
        },
      ],
    } as any);

    const g = bundle.goals![0] as any;
    expect(g.repeatEvery).toBe("WEEKLY");
    expect(g.repeatChunk).toBe(10_000);
  });

  it("omits the fields entirely for an ordinary goal", () => {
    const { bundle } = buildBundle({
      goals: [{ type: "SKILL", name: "Prayer", skill: "prayer", level: 99 }],
    } as any);

    const g = bundle.goals![0] as any;
    // Absent rather than "NONE": an older decoder should see nothing at all.
    expect(g.repeatEvery).toBeUndefined();
    expect(g.repeatChunk).toBeUndefined();
  });

  it("treats NONE as not repeating", () => {
    const { bundle } = buildBundle({
      goals: [
        { type: "SKILL", name: "Prayer", skill: "prayer", level: 99, repeatEvery: "NONE" },
      ],
    } as any);

    expect((bundle.goals![0] as any).repeatEvery).toBeUndefined();
  });

  it("drops a non-positive chunk but keeps the period", () => {
    const { bundle } = buildBundle({
      goals: [
        {
          type: "BOSS",
          name: "General Graardor",
          bossName: "General Graardor",
          targetValue: 20,
          repeatEvery: "DAILY",
          repeatChunk: 0,
        },
      ],
    } as any);

    const g = bundle.goals![0] as any;
    expect(g.repeatEvery).toBe("DAILY");
    expect(g.repeatChunk).toBeUndefined();
  });
});
