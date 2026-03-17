import { useCallback, useEffect, useRef } from "react";
import { MonsterRow } from "./MonsterRow";
import type { MonsterData } from "../../data/bestiaryTypes";

interface MonsterListProps {
  monsters: MonsterData[];
  selectedId: string | null;
  onSelect: (monster: MonsterData) => void;
}

export function MonsterList({ monsters, selectedId, onSelect }: MonsterListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Guard: if detail is open, let MonsterDetail handle arrow keys
      if (selectedId) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(focusedIndex.current + 1, monsters.length - 1);
        focusedIndex.current = next;
        const container = listRef.current;
        if (container) {
          (container.children[next] as HTMLElement | undefined)?.scrollIntoView({
            block: "nearest",
          });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(focusedIndex.current - 1, 0);
        focusedIndex.current = prev;
        const container = listRef.current;
        if (container) {
          (container.children[prev] as HTMLElement | undefined)?.scrollIntoView({
            block: "nearest",
          });
        }
      } else if (e.key === "Enter") {
        const idx = focusedIndex.current;
        if (idx >= 0 && idx < monsters.length) {
          onSelect(monsters[idx]);
        }
      }
    },
    [selectedId, monsters, onSelect],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset focused index when monsters list changes (search/filter)
  useEffect(() => {
    focusedIndex.current = -1;
  }, [monsters]);

  if (monsters.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center overflow-y-auto"
        style={{ color: "var(--text-muted)", fontSize: "14px" }}
      >
        No creatures match your filters
      </div>
    );
  }

  return (
    <div ref={listRef} className="overflow-y-auto flex-1 min-h-0">
      {monsters.map((monster, index) => (
        <MonsterRow
          key={monster.id}
          monster={monster}
          selected={monster.id === selectedId}
          onClick={() => onSelect(monster)}
          even={index % 2 === 1}
        />
      ))}
    </div>
  );
}
