import { describe, it, expect } from "vitest";
import { applySpeciesFilters } from "./useSpeciesFilters";
import type { SpeciesData } from "../data/speciesTypes";

function makeSpecies(overrides: Partial<SpeciesData> = {}): SpeciesData {
  return { id: "test_phb", name: "Test", source: "PHB", size: ["M"], sizeDisplay: "Medium", speed: { walk: 30 }, speedDisplay: "30 ft.", darkvision: null, traits: [], ...overrides };
}

describe("applySpeciesFilters", () => {
  it("returns all when no filters", () => {
    const species = [makeSpecies()];
    expect(applySpeciesFilters(species, {})).toEqual(species);
  });
  it("filters by size", () => {
    const species = [makeSpecies({ id: "a", sizeDisplay: "Medium" }), makeSpecies({ id: "b", sizeDisplay: "Small" })];
    expect(applySpeciesFilters(species, { sizes: new Set(["Small"]) })).toHaveLength(1);
  });
  it("filters by source", () => {
    const species = [makeSpecies({ id: "a", source: "PHB" }), makeSpecies({ id: "b", source: "XPHB" })];
    expect(applySpeciesFilters(species, { sources: new Set(["XPHB"]) })).toHaveLength(1);
  });
  it("filters by darkvision", () => {
    const species = [makeSpecies({ id: "a", darkvision: 60 }), makeSpecies({ id: "b", darkvision: null })];
    expect(applySpeciesFilters(species, { hasDarkvision: true })).toHaveLength(1);
  });
});
