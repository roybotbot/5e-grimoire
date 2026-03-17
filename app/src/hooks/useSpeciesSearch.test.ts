import { describe, it, expect } from "vitest";
import { filterSpeciesBySearch } from "./useSpeciesSearch";
import type { SpeciesData } from "../data/speciesTypes";

function makeSpecies(name: string): SpeciesData {
  return { id: name.toLowerCase(), name, source: "PHB", size: ["M"], sizeDisplay: "Medium", speed: { walk: 30 }, speedDisplay: "30 ft.", darkvision: null, traits: [] };
}

describe("filterSpeciesBySearch", () => {
  const species = [makeSpecies("Dragonborn"), makeSpecies("Human"), makeSpecies("Elf")];
  it("returns all when empty", () => { expect(filterSpeciesBySearch(species, "")).toEqual(species); });
  it("filters by name", () => { expect(filterSpeciesBySearch(species, "drag")).toHaveLength(1); });
  it("case-insensitive", () => { expect(filterSpeciesBySearch(species, "ELF")).toHaveLength(1); });
});
