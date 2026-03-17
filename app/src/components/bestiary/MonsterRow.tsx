import type { MonsterData } from "../../data/bestiaryTypes";

interface MonsterRowProps {
  monster: MonsterData;
  selected: boolean;
  onClick: () => void;
  even: boolean;
}

const ACCENT_DANGER = "var(--accent-danger)";

export function MonsterRow({ monster, selected, onClick, even }: MonsterRowProps) {
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
        borderLeft: selected
          ? `2px solid ${ACCENT_DANGER}`
          : "2px solid transparent",
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
          fontWeight: 500,
          color: "var(--text-primary)",
        }}
      >
        {monster.name}
      </span>

      {/* Desktop metadata */}
      <span
        className="hidden sm:flex items-center gap-2"
        style={{ fontSize: "11px", color: "var(--text-secondary)", flexShrink: 0 }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            background: "var(--bg-raised)",
            padding: "1px 4px",
            borderRadius: "2px",
          }}
        >
          CR {monster.cr}
        </span>
        <span>{monster.typeDisplay}</span>
        <span>{monster.sizeDisplay}</span>
      </span>

      {/* Mobile metadata */}
      <span
        className="sm:hidden"
        style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}
      >
        CR {monster.cr} · {monster.typeDisplay.slice(0, 3)}
      </span>
    </button>
  );
}
