import { useState, useMemo } from "react";
import type { FeatData } from "../data/featTypes";

export function filterFeatsBySearch(feats: FeatData[], query: string): FeatData[] {
  if (!query.trim()) return feats;
  const q = query.toLowerCase();
  return feats.filter((f) => f.name.toLowerCase().includes(q));
}

export function useFeatSearch(feats: FeatData[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterFeatsBySearch(feats, query), [feats, query]);
  return { query, setQuery, results };
}
