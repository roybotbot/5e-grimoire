import { useState, useMemo } from "react";
import type { ClassData } from "../data/classTypes";

export function filterClassesBySearch(classes: ClassData[], query: string): ClassData[] {
  if (!query.trim()) return classes;
  const q = query.toLowerCase();
  return classes.filter((c) => c.name.toLowerCase().includes(q));
}

export function useClassSearch(classes: ClassData[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterClassesBySearch(classes, query), [classes, query]);
  return { query, setQuery, results };
}
