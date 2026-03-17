import { create } from "zustand";
import type { ClassData } from "../data/classTypes";
import { loadAllClasses } from "../data/classLoader";

interface ClassStore {
  classes: ClassData[];
  loading: boolean;
  error: string | null;
  warnings: string[];

  // Setters
  setClasses: (classes: ClassData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setWarnings: (warnings: string[]) => void;

  // Actions
  loadClasses: () => Promise<void>;
}

export const useClassStore = create<ClassStore>((set) => ({
  classes: [],
  loading: false,
  error: null,
  warnings: [],

  setClasses: (classes) => set({ classes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setWarnings: (warnings) => set({ warnings }),

  loadClasses: async () => {
    set({ loading: true, error: null });
    try {
      const { classes, warnings } = await loadAllClasses();
      set({ classes, warnings, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
