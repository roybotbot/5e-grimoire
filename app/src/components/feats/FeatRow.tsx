import type { FeatData } from "../../data/featTypes";

interface FeatRowProps {
  feat: FeatData;
  selected: boolean;
  onClick: () => void;
  even: boolean;
}

export function FeatRow({ feat, selected, onClick, even }: FeatRowProps) {
  const prereqText = feat.prerequisite
    ? feat.prerequisite.length > 30
      ? feat.prerequisite.slice(0, 30) + "…"
      : feat.prerequisite
    : null;

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
        borderLeft: selected ? "2px solid var(--accent-primary)" : "2px solid transparent",
        paddingLeft: "14px",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      {/* Name */}
      <span
        className="flex-1 truncate"
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {feat.name}
      </span>

      {/* Desktop metadata: category + prerequisite */}
      <span
        className="hidden sm:flex items-center gap-2"
        style={{ fontSize: "11px", color: "var(--text-secondary)", flexShrink: 0 }}
      >
        <span>{feat.categoryDisplay}</span>
        {prereqText && (
          <>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span style={{ color: "var(--text-muted)" }}>{prereqText}</span>
          </>
        )}
      </span>

      {/* Mobile metadata: category only */}
      <span
        className="sm:hidden"
        style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}
      >
        {feat.categoryDisplay}
      </span>
    </button>
  );
}
