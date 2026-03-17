import { useState, useMemo } from "react";
import type { FeatData } from "../data/featTypes";

export interface FeatFilterState {
  categories?: Set<string>;
  sources?: Set<string>;
  hasPrerequisite?: boolean;
}

export function applyFeatFilters(feats: FeatData[], filters: FeatFilterState): FeatData[] {
  return feats.filter((feat) => {
    // Categories: OR within set
    if (filters.categories && filters.categories.size > 0) {
      if (!filters.categories.has(feat.categoryDisplay)) return false;
    }

    // Sources: OR within set
    if (filters.sources && filters.sources.size > 0) {
      if (!filters.sources.has(feat.source)) return false;
    }

    // hasPrerequisite: when true, only show feats with a prerequisite
    if (filters.hasPrerequisite === true) {
      if (feat.prerequisite === null) return false;
    }

    return true;
  });
}

function hasActiveFilters(filters: FeatFilterState): boolean {
  return (
    (filters.categories?.size ?? 0) > 0 ||
    (filters.sources?.size ?? 0) > 0 ||
    filters.hasPrerequisite === true
  );
}

export function useFeatFilters(feats: FeatData[]) {
  const [filters, setFilters] = useState<FeatFilterState>({});

  const filtered = useMemo(() => applyFeatFilters(feats, filters), [feats, filters]);
  const active = useMemo(() => hasActiveFilters(filters), [filters]);

  function setCategories(categories: string[]) {
    setFilters((f) => ({ ...f, categories: new Set(categories) }));
  }

  function setSources(sources: string[]) {
    setFilters((f) => ({ ...f, sources: new Set(sources) }));
  }

  function toggleHasPrerequisite() {
    setFilters((f) => ({ ...f, hasPrerequisite: f.hasPrerequisite ? undefined : true }));
  }

  function clearAll() {
    setFilters({});
  }

  return {
    filters,
    filtered,
    hasActiveFilters: active,
    setCategories,
    setSources,
    toggleHasPrerequisite,
    clearAll,
  };
}
