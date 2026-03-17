import { Toggle } from "../ui/Toggle";
import { MultiDropdown } from "../ui/MultiDropdown";
import type { FeatFilterState } from "../../hooks/useFeatFilters";

interface FeatFiltersProps {
  filters: FeatFilterState;
  setCategories: (categories: string[]) => void;
  setSources: (sources: string[]) => void;
  toggleHasPrerequisite: () => void;
  allCategories: string[];
  allSources: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function FeatFilters({
  filters,
  setCategories,
  setSources,
  toggleHasPrerequisite,
  allCategories,
  allSources,
  hasActiveFilters,
  onClearAll,
}: FeatFiltersProps) {
  const selectedCategories = filters.categories ? Array.from(filters.categories) : [];
  const selectedSources = filters.sources ? Array.from(filters.sources) : [];

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
      {/* Row: Category pills + prerequisite toggle + source dropdown + clear */}
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "44px" }}>
          Category
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {allCategories.map((cat) => (
            <Toggle
              key={cat}
              label={cat}
              active={selectedCategories.includes(cat)}
              onClick={() => {
                const next = selectedCategories.includes(cat)
                  ? selectedCategories.filter((c) => c !== cat)
                  : [...selectedCategories, cat];
                setCategories(next);
              }}
            />
          ))}
        </div>
      </div>

      {/* Row 2: Prerequisite toggle + Source dropdown + Clear */}
      <div className="flex items-center gap-2 flex-wrap">
        <Toggle
          label="Has Prerequisite"
          active={filters.hasPrerequisite === true}
          onClick={toggleHasPrerequisite}
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
