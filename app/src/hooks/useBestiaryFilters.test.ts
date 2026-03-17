import { describe, it, expect } from "vitest";
import { applyBestiaryFilters } from "./useBestiaryFilters";
import type { MonsterData } from "../data/bestiaryTypes";

function makeMonster(overrides: Partial<MonsterData> = {}): MonsterData {
  return {
    id: "test", name: "Test", source: "MM", size: ["M"], sizeDisplay: "Medium",
    type: "humanoid", typeDisplay: "Humanoid", alignment: "Neutral",
    ac: "10", hp: "10 (2d8)", speed: "30 ft.",
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    cr: "1", crNumber: 1, traits: [], actions: [], legendaryActions: [], reactions: [],
    senses: "passive Perception 10", languages: "Common", skills: "", saves: "",
    immune: "", resist: "", conditionImmune: "", environment: [],
    ...overrides,
  };
}

describe("applyBestiaryFilters", () => {
  it("returns all when no filters", () => {
    expect(applyBestiaryFilters([makeMonster()], {})).toHaveLength(1);
  });
  it("filters by CR range", () => {
    const monsters = [makeMonster({ id: "a", crNumber: 0.25 }), makeMonster({ id: "b", crNumber: 5 })];
    expect(applyBestiaryFilters(monsters, { crRanges: new Set(["⅛-½"]) })).toHaveLength(1);
  });
  it("filters by type", () => {
    const monsters = [makeMonster({ id: "a", type: "humanoid" }), makeMonster({ id: "b", type: "beast" })];
    expect(applyBestiaryFilters(monsters, { types: new Set(["beast"]) })).toHaveLength(1);
  });
  it("filters by size", () => {
    const monsters = [makeMonster({ id: "a", sizeDisplay: "Medium" }), makeMonster({ id: "b", sizeDisplay: "Large" })];
    expect(applyBestiaryFilters(monsters, { sizes: new Set(["Large"]) })).toHaveLength(1);
  });
  it("filters by environment", () => {
    const monsters = [makeMonster({ id: "a", environment: ["forest"] }), makeMonster({ id: "b", environment: ["desert"] })];
    expect(applyBestiaryFilters(monsters, { environments: new Set(["forest"]) })).toHaveLength(1);
  });

  // Additional coverage
  it("CR range 0 matches crNumber === 0", () => {
    const monsters = [makeMonster({ id: "a", crNumber: 0 }), makeMonster({ id: "b", crNumber: 1 })];
    expect(applyBestiaryFilters(monsters, { crRanges: new Set(["0"]) })).toHaveLength(1);
  });

  it("CR range 21+ matches crNumber >= 21", () => {
    const monsters = [
      makeMonster({ id: "a", crNumber: 20 }),
      makeMonster({ id: "b", crNumber: 21 }),
      makeMonster({ id: "c", crNumber: 30 }),
    ];
    const result = applyBestiaryFilters(monsters, { crRanges: new Set(["21+"]) });
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(["b", "c"]);
  });

  it("CR ranges are OR (matches any selected range)", () => {
    const monsters = [
      makeMonster({ id: "a", crNumber: 0 }),
      makeMonster({ id: "b", crNumber: 3 }),
      makeMonster({ id: "c", crNumber: 15 }),
    ];
    const result = applyBestiaryFilters(monsters, {
      crRanges: new Set(["0", "1-5"]),
    });
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("filters by source", () => {
    const monsters = [
      makeMonster({ id: "a", source: "MM" }),
      makeMonster({ id: "b", source: "VGM" }),
    ];
    expect(
      applyBestiaryFilters(monsters, { sources: new Set(["VGM"]) })
    ).toHaveLength(1);
  });

  it("AND logic: type AND size", () => {
    const monsters = [
      makeMonster({ id: "a", type: "beast", sizeDisplay: "Large" }),
      makeMonster({ id: "b", type: "beast", sizeDisplay: "Small" }),
      makeMonster({ id: "c", type: "humanoid", sizeDisplay: "Large" }),
    ];
    const result = applyBestiaryFilters(monsters, {
      types: new Set(["beast"]),
      sizes: new Set(["Large"]),
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("empty filter sets are ignored", () => {
    const monsters = [makeMonster({ id: "a" }), makeMonster({ id: "b" })];
    expect(
      applyBestiaryFilters(monsters, {
        crRanges: new Set(),
        types: new Set(),
        sizes: new Set(),
        sources: new Set(),
        environments: new Set(),
      })
    ).toHaveLength(2);
  });
});
