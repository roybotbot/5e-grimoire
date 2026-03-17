import { useState, useMemo } from "react";
import type { MonsterData } from "../data/bestiaryTypes";

export interface BestiaryFilterState {
  crRanges?: Set<string>;
  types?: Set<string>;
  sizes?: Set<string>;
  sources?: Set<string>;
  environments?: Set<string>;
}

// Maps CR range labels to a predicate on crNumber
const CR_RANGE_PREDICATES: Record<string, (cr: number) => boolean> = {
  "0": (cr) => cr === 0,
  "⅛-½": (cr) => cr > 0 && cr <= 0.5,
  "1-5": (cr) => cr >= 1 && cr <= 5,
  "6-10": (cr) => cr >= 6 && cr <= 10,
  "11-16": (cr) => cr >= 11 && cr <= 16,
  "17-20": (cr) => cr >= 17 && cr <= 20,
  "21+": (cr) => cr >= 21,
};

export function applyBestiaryFilters(
  monsters: MonsterData[],
  filters: BestiaryFilterState
): MonsterData[] {
  return monsters.filter((monster) => {
    // CR ranges: monster matches if its crNumber falls in ANY selected range
    if (filters.crRanges && filters.crRanges.size > 0) {
      const matchesCr = Array.from(filters.crRanges).some((label) => {
        const predicate = CR_RANGE_PREDICATES[label];
        return predicate ? predicate(monster.crNumber) : false;
      });
      if (!matchesCr) return false;
    }

    // Types: match against monster.type (lowercase base type)
    if (filters.types && filters.types.size > 0) {
      if (!filters.types.has(monster.type)) return false;
    }

    // Sizes: match against monster.sizeDisplay
    if (filters.sizes && filters.sizes.size > 0) {
      if (!filters.sizes.has(monster.sizeDisplay)) return false;
    }

    // Sources: OR within set
    if (filters.sources && filters.sources.size > 0) {
      if (!filters.sources.has(monster.source)) return false;
    }

    // Environments: monster must have at least one of the selected environments
    if (filters.environments && filters.environments.size > 0) {
      if (!monster.environment.some((e) => filters.environments!.has(e)))
        return false;
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

function hasActiveFilters(filters: BestiaryFilterState): boolean {
  return (
    (filters.crRanges?.size ?? 0) > 0 ||
    (filters.types?.size ?? 0) > 0 ||
    (filters.sizes?.size ?? 0) > 0 ||
    (filters.sources?.size ?? 0) > 0 ||
    (filters.environments?.size ?? 0) > 0
  );
}

export function useBestiaryFilters(monsters: MonsterData[]) {
  const [filters, setFilters] = useState<BestiaryFilterState>({});

  const filtered = useMemo(
    () => applyBestiaryFilters(monsters, filters),
    [monsters, filters]
  );
  const active = useMemo(() => hasActiveFilters(filters), [filters]);

  function toggleCrRange(range: string) {
    setFilters((f) => ({ ...f, crRanges: toggleInSet(f.crRanges, range) }));
  }

  function toggleType(type: string) {
    setFilters((f) => ({ ...f, types: toggleInSet(f.types, type) }));
  }

  function toggleSize(size: string) {
    setFilters((f) => ({ ...f, sizes: toggleInSet(f.sizes, size) }));
  }

  function setSources(sources: string[]) {
    setFilters((f) => ({ ...f, sources: new Set(sources) }));
  }

  function setEnvironments(environments: string[]) {
    setFilters((f) => ({ ...f, environments: new Set(environments) }));
  }

  function clearAll() {
    setFilters({});
  }

  return {
    filters,
    filtered,
    hasActiveFilters: active,
    toggleCrRange,
    toggleType,
    toggleSize,
    setSources,
    setEnvironments,
    clearAll,
  };
}
