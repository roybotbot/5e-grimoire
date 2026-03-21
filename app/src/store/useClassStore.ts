import { create } from "zustand";
import type { ClassData } from "../data/classTypes";
import { loadAllClasses } from "../data/classLoader";

interface ClassStore {
  classes: ClassData[];
  loading: boolean;
  error: string | null;
  warnings: string[];
  loadClasses: () => Promise<void>;
}

export const useClassStore = create<ClassStore>((set) => ({
  classes: [],
  loading: false,
  error: null,
  warnings: [],

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
