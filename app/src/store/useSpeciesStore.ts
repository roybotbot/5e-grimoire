import { create } from "zustand";
import type { SpeciesData } from "../data/speciesTypes";
import { loadAllSpecies } from "../data/speciesLoader";

interface SpeciesStore {
  species: SpeciesData[];
  loading: boolean;
  error: string | null;
  warnings: string[];
  loadSpecies: () => Promise<void>;
  allSources: () => string[];
  allSizes: () => string[];
}

export const useSpeciesStore = create<SpeciesStore>((set, get) => ({
  species: [],
  loading: false,
  error: null,
  warnings: [],
  loadSpecies: async () => {
    set({ loading: true, error: null });
    try {
      const { species, warnings } = await loadAllSpecies();
      set({ species, warnings, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
  allSources: () => Array.from(new Set(get().species.map((s) => s.source))).sort(),
  allSizes: () => {
    const sizeSet = new Set<string>();
    for (const s of get().species) sizeSet.add(s.sizeDisplay);
    return Array.from(sizeSet).sort();
  },
}));
