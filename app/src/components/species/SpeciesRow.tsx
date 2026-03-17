import type { SpeciesData } from "../../data/speciesTypes";

interface SpeciesRowProps {
  species: SpeciesData;
  selected: boolean;
  onClick: () => void;
  even: boolean;
}

export function SpeciesRow({ species, selected, onClick, even }: SpeciesRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-3 px-4 text-left"
      style={{
        height: "36px",
        background: selected
          ? "var(--bg-panel)"
          : even
          ? "rgba(136,136,136,0.094)"
          : "transparent",
        borderLeft: selected ? `2px solid var(--accent-primary)` : "2px solid transparent",
        paddingLeft: selected ? "14px" : "14px",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      {/* Name */}
      <span
        className="flex-1 truncate"
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        {species.name}
      </span>

      {/* Desktop metadata */}
      <span
        className="hidden sm:flex items-center gap-2"
        style={{ fontSize: "11px", color: "var(--text-secondary)", flexShrink: 0 }}
      >
        <span>{species.sizeDisplay}</span>
        <span>{species.speedDisplay}</span>
        {species.darkvision !== null && (
          <span>Darkvision {species.darkvision}ft</span>
        )}
      </span>

      {/* Mobile metadata */}
      <span
        className="sm:hidden"
        style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}
      >
        {species.sizeDisplay}
      </span>
    </button>
  );
}
