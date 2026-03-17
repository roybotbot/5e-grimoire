import { Toggle } from "../ui/Toggle";
import { MultiDropdown } from "../ui/MultiDropdown";
import type { SpeciesFilterState } from "../../hooks/useSpeciesFilters";

const SIZES = ["Small", "Medium", "Large"];

interface SpeciesFiltersProps {
  filters: SpeciesFilterState;
  toggleSize: (size: string) => void;
  toggleDarkvision: () => void;
  setSources: (sources: string[]) => void;
  allSources: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function SpeciesFilters({
  filters,
  toggleSize,
  toggleDarkvision,
  setSources,
  allSources,
  hasActiveFilters,
  onClearAll,
}: SpeciesFiltersProps) {
  const selectedSources = filters.sources ? Array.from(filters.sources) : [];

  return (
    <div
      className="px-4 py-2 flex flex-col gap-1.5 border-b flex-shrink-0"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)", position: "relative", zIndex: 10 }}
    >
      {/* Row: Size pills | Darkvision toggle | Source dropdown | Clear All */}
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "32px" }}>
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

        <div
          className="w-px self-stretch"
          style={{ background: "var(--border-subtle)" }}
        />

        <Toggle
          label="Darkvision"
          active={filters.hasDarkvision === true}
          onClick={toggleDarkvision}
        />

        <MultiDropdown
          label="Source"
          options={allSources}
          selected={selectedSources}
          onChange={setSources}
        />

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
    </div>
  );
}
