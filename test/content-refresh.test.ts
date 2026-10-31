import { describe, it, expect } from "vitest";
import { resolveBoss } from "../src/refdata/bosses.js";
import { isKnownQuestEnum, resolveQuest } from "../src/refdata/quests.js";
import { resolveItem, isKnownItemId } from "../src/refdata/items.js";
import { getItemSourceTags } from "../src/refdata/item-sources.js";
import { buildBundle } from "../src/build.js";

// Content the plugin shipped in 1.0.1 (RuneLite 1.13.4) that the MCP's tables
// predated: a goal for any of these used to come out manual or unverified.
describe("Goal Planner 1.0.2 content refresh", () => {
  it("knows The Fractured Archive as a boss", () => {
    expect(resolveBoss("the fractured archive")).toBe("The Fractured Archive");
  });

  it("knows the 1.13.4 quests by enum constant and display name", () => {
    for (const [enumName, display] of [
      ["CRAB_QUEST", "Crab Quest"],
      ["A_RUFF_SITUATION", "A Ruff Situation"],
      ["THE_FRACTURED_ARCHIVE", "The Fractured Archive"],
    ]) {
      expect(isKnownQuestEnum(enumName)?.displayName).toBe(display);
      expect(resolveQuest(display)?.enumName).toBe(enumName);
    }
  });

  it("knows items newer than the cache snapshot (from gameval.ItemID)", () => {
    expect(isKnownItemId(34042)).toBe(true); // Mad Angel pet
    expect(isKnownItemId(34646)).toBe(true); // Fractured Archive pet
    expect(resolveItem("obligator")?.itemId).toBe(34715);
  });

  it("resolves untradeable Stardust to its exact id", () => {
    expect(resolveItem("Stardust")?.itemId).toBe(25527);
  });

  it("tags Fractured Archive drops with their collection-log source", () => {
    expect(getItemSourceTags(34646)).toContainEqual({ label: "The Fractured Archive", category: "RAID" });
  });

  it("crafts a tracked ITEM_GRIND goal for a new-content item id", () => {
    const { bundle, resolved, warnings } = buildBundle({
      sectionName: "Archive",
      goals: [{ type: "ITEM_GRIND", name: "Obligator", itemId: 34715 }],
    });
    expect(resolved[0].tracked).toBe(true);
    expect(bundle.goals[0].itemId).toBe(34715);
    expect(warnings.some((w) => w.includes("UNVERIFIED"))).toBe(false);
  });
});
