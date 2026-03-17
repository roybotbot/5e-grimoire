import { useState, useMemo } from "react";
import type { SpeciesData } from "../data/speciesTypes";

export interface SpeciesFilterState {
  sizes?: Set<string>;
  sources?: Set<string>;
  hasDarkvision?: boolean;
}

export function applySpeciesFilters(
  species: SpeciesData[],
  filters: SpeciesFilterState
): SpeciesData[] {
  return species.filter((s) => {
    // Sizes: OR within set
    if (filters.sizes && filters.sizes.size > 0) {
      if (!filters.sizes.has(s.sizeDisplay)) return false;
    }

    // Sources: OR within set
    if (filters.sources && filters.sources.size > 0) {
      if (!filters.sources.has(s.source)) return false;
    }

    // Darkvision: when true, only show species with darkvision
    if (filters.hasDarkvision === true) {
      if (s.darkvision === null) return false;
    }

    return true;
  });
}

function toggleInSet<T>(set: Set<T> | undefined, value: T): Set<T> {
  const next = new Set(set ?? []);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function hasActiveFilters(filters: SpeciesFilterState): boolean {
  return (
    (filters.sizes?.size ?? 0) > 0 ||
    (filters.sources?.size ?? 0) > 0 ||
    filters.hasDarkvision === true
  );
}

export function useSpeciesFilters(species: SpeciesData[]) {
  const [filters, setFilters] = useState<SpeciesFilterState>({});

  const filtered = useMemo(() => applySpeciesFilters(species, filters), [species, filters]);
  const active = useMemo(() => hasActiveFilters(filters), [filters]);

  function toggleSize(size: string) {
    setFilters((f) => ({ ...f, sizes: toggleInSet(f.sizes, size) }));
  }

  function setSources(sources: string[]) {
    setFilters((f) => ({ ...f, sources: new Set(sources) }));
  }

  function toggleDarkvision() {
    setFilters((f) => ({ ...f, hasDarkvision: f.hasDarkvision ? undefined : true }));
  }

  function clearAll() {
    setFilters({});
  }

  return {
    filters,
    filtered,
    hasActiveFilters: active,
    toggleSize,
    setSources,
    toggleDarkvision,
    clearAll,
  };
}
