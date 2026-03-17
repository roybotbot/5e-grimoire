import type { ClassData } from "../../data/classTypes";

interface ClassRowProps {
  classData: ClassData;
  selected: boolean;
  onClick: () => void;
  even: boolean;
}

export function ClassRow({ classData, selected, onClick, even }: ClassRowProps) {
  const hitDie = `d${classData.hitDie}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 text-left"
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
        {classData.name}
      </span>

      {/* Desktop metadata */}
      <span
        className="hidden sm:flex items-center gap-2"
        style={{ fontSize: "11px", color: "var(--text-secondary)", flexShrink: 0 }}
      >
        <span>{hitDie}</span>
        <span>{classData.primaryAbility}</span>
        {classData.casterProgression && (
          <span style={{ color: "var(--text-muted)" }}>{classData.casterProgression}</span>
        )}
      </span>

      {/* Mobile metadata: hit die only */}
      <span
        className="sm:hidden"
        style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}
      >
        {hitDie}
      </span>
    </button>
  );
}
