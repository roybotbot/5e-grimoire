import { useCallback, useEffect, useRef } from "react";
import { FeatRow } from "./FeatRow";
import type { FeatData } from "../../data/featTypes";

interface FeatListProps {
  feats: FeatData[];
  selectedId: string | null;
  onSelect: (feat: FeatData) => void;
}

export function FeatList({ feats, selectedId, onSelect }: FeatListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Guard: if detail is open, let FeatDetail handle arrow keys
      if (selectedId) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(focusedIndex.current + 1, feats.length - 1);
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
        if (idx >= 0 && idx < feats.length) {
          onSelect(feats[idx]);
        }
      }
    },
    [selectedId, feats, onSelect],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset focused index when feats list changes (search/filter)
  useEffect(() => {
    focusedIndex.current = -1;
  }, [feats]);

  if (feats.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center overflow-y-auto"
        style={{ color: "var(--text-muted)", fontSize: "14px" }}
      >
        No feats match your filters
      </div>
    );
  }

  return (
    <div ref={listRef} className="overflow-y-auto flex-1 min-h-0">
      {feats.map((feat, index) => (
        <FeatRow
          key={feat.id}
          feat={feat}
          selected={feat.id === selectedId}
          onClick={() => onSelect(feat)}
          even={index % 2 === 1}
        />
      ))}
    </div>
  );
}
