import { useCallback, useEffect, useRef } from "react";
import { ClassRow } from "./ClassRow";
import type { ClassData } from "../../data/classTypes";

interface ClassListProps {
  classes: ClassData[];
  selectedId: string | null;
  onSelect: (classData: ClassData) => void;
}

export function ClassList({ classes, selectedId, onSelect }: ClassListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Guard: if detail is open, let ClassDetail handle arrow keys
      if (selectedId) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(focusedIndex.current + 1, classes.length - 1);
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
        if (idx >= 0 && idx < classes.length) {
          onSelect(classes[idx]);
        }
      }
    },
    [selectedId, classes, onSelect],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset focused index when classes list changes (search)
  useEffect(() => {
    focusedIndex.current = -1;
  }, [classes]);

  if (classes.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center overflow-y-auto"
        style={{ color: "var(--text-muted)", fontSize: "14px" }}
      >
        No classes match your search
      </div>
    );
  }

  return (
    <div ref={listRef} className="overflow-y-auto flex-1 min-h-0">
      {classes.map((classData, index) => (
        <ClassRow
          key={classData.id}
          classData={classData}
          selected={classData.id === selectedId}
          onClick={() => onSelect(classData)}
          even={index % 2 === 1}
        />
      ))}
    </div>
  );
}
