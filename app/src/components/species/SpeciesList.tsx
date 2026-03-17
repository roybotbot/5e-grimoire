import { useCallback, useEffect, useRef } from "react";
import { SpeciesRow } from "./SpeciesRow";
import type { SpeciesData } from "../../data/speciesTypes";

interface SpeciesListProps {
  species: SpeciesData[];
  selectedId: string | null;
  onSelect: (species: SpeciesData) => void;
}

export function SpeciesList({ species, selectedId, onSelect }: SpeciesListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Guard: if detail is open, let SpeciesDetail handle arrow keys
      if (selectedId) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(focusedIndex.current + 1, species.length - 1);
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
        if (idx >= 0 && idx < species.length) {
          onSelect(species[idx]);
        }
      }
    },
    [selectedId, species, onSelect],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset focused index when species list changes (search/filter)
  useEffect(() => {
    focusedIndex.current = -1;
  }, [species]);

  if (species.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center overflow-y-auto"
        style={{ color: "var(--text-muted)", fontSize: "14px" }}
      >
        No species match your filters
      </div>
    );
  }

  return (
    <div ref={listRef} className="overflow-y-auto flex-1 min-h-0">
      {species.map((s, index) => (
        <SpeciesRow
          key={s.id}
          species={s}
          selected={s.id === selectedId}
          onClick={() => onSelect(s)}
          even={index % 2 === 1}
        />
      ))}
    </div>
  );
}
