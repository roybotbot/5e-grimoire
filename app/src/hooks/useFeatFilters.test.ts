import { describe, it, expect } from "vitest";
import { applyFeatFilters } from "./useFeatFilters";
import type { FeatData } from "../data/featTypes";

function makeFeat(overrides: Partial<FeatData> = {}): FeatData {
  return { id: "test", name: "Test", source: "PHB", category: "G", categoryDisplay: "General", prerequisite: null, entries: [], ...overrides };
}

describe("applyFeatFilters", () => {
  it("returns all when no filters", () => {
    expect(applyFeatFilters([makeFeat()], {})).toHaveLength(1);
  });
  it("filters by category", () => {
    const feats = [makeFeat({ id: "a", categoryDisplay: "General" }), makeFeat({ id: "b", categoryDisplay: "Origin" })];
    expect(applyFeatFilters(feats, { categories: new Set(["Origin"]) })).toHaveLength(1);
  });
  it("filters by source", () => {
    const feats = [makeFeat({ id: "a", source: "PHB" }), makeFeat({ id: "b", source: "XPHB" })];
    expect(applyFeatFilters(feats, { sources: new Set(["XPHB"]) })).toHaveLength(1);
  });
  it("filters by hasPrerequisite", () => {
    const feats = [makeFeat({ id: "a", prerequisite: "Level 4+" }), makeFeat({ id: "b", prerequisite: null })];
    expect(applyFeatFilters(feats, { hasPrerequisite: true })).toHaveLength(1);
  });
});
