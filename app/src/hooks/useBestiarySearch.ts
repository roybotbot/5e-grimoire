import { useState, useMemo } from "react";
import type { MonsterData } from "../data/bestiaryTypes";

export function filterMonstersBySearch(
  monsters: MonsterData[],
  query: string
): MonsterData[] {
  if (!query.trim()) return monsters;
  const q = query.toLowerCase();
  return monsters.filter((m) => m.name.toLowerCase().includes(q));
}

export function useBestiarySearch(monsters: MonsterData[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => filterMonstersBySearch(monsters, query),
    [monsters, query]
  );
  return { query, setQuery, results };
}
