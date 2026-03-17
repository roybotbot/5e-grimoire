import { describe, it, expect } from "vitest";
import { filterClassesBySearch } from "./useClassSearch";
import type { ClassData } from "../data/classTypes";

function makeClass(name: string): ClassData {
  return {
    id: name.toLowerCase(), name, source: "XPHB", hitDie: 8, primaryAbility: "Strength",
    savingThrows: ["Strength", "Constitution"], armorProficiencies: [], weaponProficiencies: [],
    skillChoices: null, spellcastingAbility: null, casterProgression: null,
    subclasses: [], classFeatures: [],
  };
}

describe("filterClassesBySearch", () => {
  const classes = [makeClass("Fighter"), makeClass("Wizard"), makeClass("Rogue")];
  it("returns all when empty", () => { expect(filterClassesBySearch(classes, "")).toEqual(classes); });
  it("filters by name", () => { expect(filterClassesBySearch(classes, "wiz")).toHaveLength(1); });
  it("case-insensitive", () => { expect(filterClassesBySearch(classes, "ROGUE")).toHaveLength(1); });
});
