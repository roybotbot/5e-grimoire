import { useState } from "react";
import { Toggle } from "../ui/Toggle";
import { MultiDropdown } from "../ui/MultiDropdown";
import type { BestiaryFilterState } from "../../hooks/useBestiaryFilters";

const CR_RANGES = ["0", "⅛-½", "1-5", "6-10", "11-16", "17-20", "21+"];
const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

interface BestiaryFiltersProps {
  filters: BestiaryFilterState;
  toggleCrRange: (range: string) => void;
  toggleType: (type: string) => void;
  toggleSize: (size: string) => void;
  setSources: (sources: string[]) => void;
  setEnvironments: (environments: string[]) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  allTypes: string[];
  allSources: string[];
  allEnvironments: string[];
}

export function BestiaryFilters({
  filters,
  toggleCrRange,
  toggleType,
  toggleSize,
  setSources,
  setEnvironments,
  hasActiveFilters,
  onClearAll,
  allTypes,
  allSources,
  allEnvironments,
}: BestiaryFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const selectedSources = filters.sources ? Array.from(filters.sources) : [];
  const selectedEnvironments = filters.environments
    ? Array.from(filters.environments)
    : [];

  // For type dropdown, the store returns capitalized values but filters.types
  // stores lowercase base types. We need to map between them.
  // allTypes are capitalized; filters.types has lowercase.
  const selectedTypes = filters.types
    ? allTypes.filter((t) => filters.types!.has(t.toLowerCase()))
    : [];

  function handleTypeChange(selected: string[]) {
    // toggleType receives the lowercase base type
    // We compute the diff to find what was added/removed
    const currentLower = new Set(selectedTypes.map((t) => t.toLowerCase()));
    const nextLower = new Set(selected.map((t) => t.toLowerCase()));

    // Find added
    for (const t of nextLower) {
      if (!currentLower.has(t)) toggleType(t);
    }
    // Find removed
    for (const t of currentLower) {
      if (!nextLower.has(t)) toggleType(t);
    }
  }

  return (
    <div
      className="px-4 py-2 flex flex-col gap-1.5 border-b flex-shrink-0"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--bg-base)",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Row 1: CR ranges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "20px" }}
        >
          CR
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {CR_RANGES.map((range) => (
            <Toggle
              key={range}
              label={range}
              active={filters.crRanges?.has(range) ?? false}
              onClick={() => toggleCrRange(range)}
            />
          ))}
        </div>
      </div>

      {/* Row 2: Size pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "20px" }}
        >
          Size
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {SIZES.map((size) => (
            <Toggle
              key={size}
              label={size}
              active={filters.sizes?.has(size) ?? false}
              onClick={() => toggleSize(size)}
            />
          ))}
        </div>
      </div>

      {/* Row 3: Type | Source | Environment | More | Clear */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiDropdown
          label="Type"
          options={allTypes}
          selected={selectedTypes}
          onChange={handleTypeChange}
        />
        <MultiDropdown
          label="Source"
          options={allSources}
          selected={selectedSources}
          onChange={setSources}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2 py-0.5 text-[11px] font-medium border rounded-[2px] bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] cursor-pointer"
        >
          {expanded ? "Less ▴" : "More ▾"}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto px-2 py-0.5 text-[11px] font-medium border rounded-[2px] border-[var(--accent-danger)] text-[var(--accent-danger)] bg-transparent hover:bg-[var(--bg-panel)] cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Expanded: Environment */}
      {expanded && (
        <div className="flex items-center gap-2 flex-wrap">
          <MultiDropdown
            label="Environment"
            options={allEnvironments}
            selected={selectedEnvironments}
            onChange={setEnvironments}
          />
        </div>
      )}
    </div>
  );
}
