import { create } from "zustand";
import type { FeatData } from "../data/featTypes";
import { loadAllFeats } from "../data/featLoader";

interface FeatStore {
  feats: FeatData[];
  loading: boolean;
  error: string | null;
  warnings: string[];
  loadFeats: () => Promise<void>;
  allSources: () => string[];
  allCategories: () => string[];
}

export const useFeatStore = create<FeatStore>((set, get) => ({
  feats: [],
  loading: false,
  error: null,
  warnings: [],

  loadFeats: async () => {
    set({ loading: true, error: null });
    try {
      const { feats, warnings } = await loadAllFeats();
      set({ feats, warnings, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  allSources: () => {
    const { feats } = get();
    const sourceSet = new Set<string>();
    for (const feat of feats) {
      sourceSet.add(feat.source);
    }
    return Array.from(sourceSet).sort();
  },

  allCategories: () => {
    const { feats } = get();
    const categorySet = new Set<string>();
    for (const feat of feats) {
      categorySet.add(feat.categoryDisplay);
    }
    return Array.from(categorySet).sort();
  },
}));
