import { useEffect } from "react";
import type { SpeciesData } from "../../data/speciesTypes";
import { SpellDescription } from "../spells/SpellDescription";

interface SpeciesDetailProps {
  species: SpeciesData;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function SpeciesDetail({ species, onClose, onPrev, onNext }: SpeciesDetailProps) {
  const accentColor = "var(--accent-primary)";

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace") {
        onClose();
      } else if (e.key === "ArrowUp" && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowDown" && onNext) {
        e.preventDefault();
        onNext();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <>
      {/* Backdrop (desktop only) */}
      <div
        className="hidden lg:block fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[80%] lg:w-[65%] flex flex-col"
        style={{
          background: "var(--bg-base)",
          borderLeft: "1px solid var(--border-subtle)",
          animation: "slideIn 120ms ease-out",
        }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: "48px",
            background: "var(--bg-base)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer flex-shrink-0"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "18px",
                padding: "4px",
              }}
              aria-label="Close"
            >
              ←
            </button>
            <span
              className="truncate"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                color: "var(--text-primary)",
              }}
            >
              {species.name}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {/* Stats section */}
          <div
            className="mx-4 mt-4 grid grid-cols-2 rounded-[2px]"
            style={{ border: "1px solid var(--border-subtle)" }}
          >
            <StatCell label="Size" value={species.sizeDisplay} borderRight borderBottom />
            <StatCell label="Speed" value={species.speedDisplay} borderBottom />
            <StatCell
              label="Darkvision"
              value={species.darkvision !== null ? `${species.darkvision} ft` : "—"}
              borderRight
            />
            <StatCell label="Source" value={species.source} />
          </div>

          {/* Divider */}
          <div
            className="mx-4 my-4"
            style={{ height: "1px", background: "var(--border-subtle)" }}
          />

          {/* Traits */}
          {species.traits.length > 0 && (
            <div className="px-4">
              <SpellDescription entries={species.traits} schoolColor={accentColor} />
            </div>
          )}

          {/* Divider */}
          <div
            className="mx-4 my-4"
            style={{ height: "1px", background: "var(--border-subtle)" }}
          />

          {/* Footer */}
          <div className="px-4">
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Source: {species.source}
              {species.page ? ` p. ${species.page}` : ""}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface StatCellProps {
  label: string;
  value: string;
  borderRight?: boolean;
  borderBottom?: boolean;
}

function StatCell({ label, value, borderRight, borderBottom }: StatCellProps) {
  return (
    <div
      className="px-3 py-2"
      style={{
        borderRight: borderRight ? "1px solid var(--border-subtle)" : undefined,
        borderBottom: borderBottom ? "1px solid var(--border-subtle)" : undefined,
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "15px", color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}
