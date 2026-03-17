import { useState, useMemo } from "react";
import type { SpeciesData } from "../data/speciesTypes";

export function filterSpeciesBySearch(species: SpeciesData[], query: string): SpeciesData[] {
  if (!query.trim()) return species;
  const q = query.toLowerCase();
  return species.filter((s) => s.name.toLowerCase().includes(q));
}

export function useSpeciesSearch(species: SpeciesData[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterSpeciesBySearch(species, query), [species, query]);
  return { query, setQuery, results };
}
