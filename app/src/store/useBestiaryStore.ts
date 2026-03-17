import { create } from "zustand";
import type { MonsterData } from "../data/bestiaryTypes";
import { loadAllMonsters } from "../data/bestiaryLoader";

interface BestiaryStore {
  monsters: MonsterData[];
  loading: boolean;
  error: string | null;
  warnings: string[];

  // Setters
  setMonsters: (monsters: MonsterData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWarnings: (warnings: string[]) => void;

  // Actions
  loadMonsters: () => Promise<void>;

  // Derived
  allSources: () => string[];
  allTypes: () => string[];
  allEnvironments: () => string[];
}

export const useBestiaryStore = create<BestiaryStore>((set, get) => ({
  monsters: [],
  loading: false,
  error: null,
  warnings: [],

  setMonsters: (monsters) => set({ monsters }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setWarnings: (warnings) => set({ warnings }),

  loadMonsters: async () => {
    set({ loading: true, error: null });
    try {
      const { monsters, warnings } = await loadAllMonsters();
      set({ monsters, warnings, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  allSources: () => {
    const { monsters } = get();
    const sourceSet = new Set<string>();
    for (const monster of monsters) {
      sourceSet.add(monster.source);
    }
    return Array.from(sourceSet).sort();
  },

  allTypes: () => {
    const { monsters } = get();
    const typeSet = new Set<string>();
    for (const monster of monsters) {
      // monster.type is the lowercase base type (e.g. 'humanoid')
      const capitalized =
        monster.type.charAt(0).toUpperCase() + monster.type.slice(1);
      typeSet.add(capitalized);
    }
    return Array.from(typeSet).sort();
  },

  allEnvironments: () => {
    const { monsters } = get();
    const envSet = new Set<string>();
    for (const monster of monsters) {
      for (const env of monster.environment) {
        envSet.add(env);
      }
    }
    return Array.from(envSet).sort();
  },
}));
