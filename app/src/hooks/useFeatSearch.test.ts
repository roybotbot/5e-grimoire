import { describe, it, expect } from "vitest";
import { filterFeatsBySearch } from "./useFeatSearch";
import type { FeatData } from "../data/featTypes";

function makeFeat(name: string, overrides: Partial<FeatData> = {}): FeatData {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    source: "PHB",
    category: "G",
    categoryDisplay: "General",
    prerequisite: null,
    entries: [],
    ...overrides,
  };
}

// Deliberately constructed names so the substring tests are unambiguous:
//   query "ough" → matches "Tough" (T-ough) and "Doughty" (D-ough-ty) only
//   query "zzz"  → no matches
const FEATS: FeatData[] = [
  makeFeat("Alert"),
  makeFeat("Tough"),
  makeFeat("Doughty"),
  makeFeat("Charger"),
];

describe("filterFeatsBySearch", () => {
  it("returns all feats when query is empty", () => {
    expect(filterFeatsBySearch(FEATS, "")).toHaveLength(FEATS.length);
  });

  it("returns all feats when query is only whitespace", () => {
    expect(filterFeatsBySearch(FEATS, "   ")).toHaveLength(FEATS.length);
  });

  it("filters by name substring", () => {
    // "Tough" and "Doughty" both contain "ough"
    const result = filterFeatsBySearch(FEATS, "ough");
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toContain("Tough");
    expect(result.map((f) => f.name)).toContain("Doughty");
  });

  it("is case-insensitive", () => {
    // uppercase query still finds "Alert"
    const result = filterFeatsBySearch(FEATS, "ALERT");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alert");
  });

  it("returns empty array when no feats match", () => {
    expect(filterFeatsBySearch(FEATS, "xyzzy")).toHaveLength(0);
  });

  it("returns exact match", () => {
    const result = filterFeatsBySearch(FEATS, "Charger");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Charger");
  });
});
