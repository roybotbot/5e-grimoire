import { useEffect } from "react";
import type { FeatData } from "../../data/featTypes";
import { SpellDescription } from "../spells/SpellDescription";

interface FeatDetailProps {
  feat: FeatData;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function FeatDetail({ feat, onClose, onPrev, onNext }: FeatDetailProps) {
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
              {feat.name}
            </span>
          </div>

          {/* Category badge */}
          <span
            className="flex-shrink-0 px-2 py-0.5 rounded-[2px] text-[11px] font-medium ml-2"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            {feat.categoryDisplay}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="px-4 pt-4 flex flex-col gap-4">
            {/* Prerequisite block */}
            {feat.prerequisite && (
              <div
                className="p-3"
                style={{
                  borderLeft: "2px solid var(--accent-primary)",
                  background: "var(--bg-panel)",
                }}
              >
                <div
                  style={{
                    color: "var(--accent-primary)",
                    fontWeight: 700,
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "4px",
                  }}
                >
                  Prerequisite
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {feat.prerequisite}
                </div>
              </div>
            )}

            {/* Entries */}
            <SpellDescription
              entries={feat.entries}
              schoolColor="var(--accent-primary)"
            />

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--border-subtle)" }} />

            {/* Footer: Source + page */}
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Source: {feat.source}
              {feat.page ? ` p. ${feat.page}` : ""}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
