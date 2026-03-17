import { useEffect } from "react";
import type { MonsterData, MonsterFeature } from "../../data/bestiaryTypes";
import { SpellDescription } from "../spells/SpellDescription";

const ACCENT = "var(--accent-danger)";

interface MonsterDetailProps {
  monster: MonsterData;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

// ── Ability score helpers ─────────────────────────────────────────────────────

const ABILITIES: { key: keyof MonsterData["abilities"]; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `(+${mod})` : `(${mod})`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PropRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
      <span style={{ color: ACCENT, fontWeight: 700 }}>{label}: </span>
      <span style={{ color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        height: "2px",
        background: ACCENT,
        margin: "10px 0",
        opacity: 0.6,
      }}
    />
  );
}

function FeatureSection({
  title,
  features,
}: {
  title: string;
  features: MonsterFeature[];
}) {
  if (!features || features.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700,
          fontSize: "15px",
          color: ACCENT,
          borderBottom: `1px solid ${ACCENT}`,
          paddingBottom: "2px",
        }}
      >
        {title}
      </div>
      {features.map((feature, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {feature.name}
          </span>
          <SpellDescription entries={feature.entries} schoolColor={ACCENT} />
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MonsterDetail({
  monster,
  onClose,
  onPrev,
  onNext,
}: MonsterDetailProps) {
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer"
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
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                color: "var(--text-primary)",
              }}
            >
              {monster.name}
            </span>
          </div>

          {/* CR badge */}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              background: "var(--bg-raised)",
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              padding: "2px 8px",
              borderRadius: "2px",
              fontWeight: 700,
            }}
          >
            CR {monster.cr}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {/* Colored header band */}
          <div
            style={{
              background: ACCENT,
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: "22px",
                color: "#fff",
              }}
            >
              {monster.name}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.85)",
                fontStyle: "italic",
                marginTop: "2px",
              }}
            >
              {monster.sizeDisplay} {monster.typeDisplay}, {monster.alignment}
            </div>
          </div>

          {/* Stat block content */}
          <div className="px-4 pt-4 flex flex-col gap-3">
            {/* Properties */}
            <div className="flex flex-col gap-0.5">
              <PropRow label="AC" value={monster.ac} />
              <PropRow label="HP" value={monster.hp} />
              <PropRow label="Speed" value={monster.speed} />
            </div>

            <SectionDivider />

            {/* Ability scores grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(6, 1fr)",
                textAlign: "center",
                gap: "4px",
              }}
            >
              {ABILITIES.map(({ key, label }) => {
                const score = monster.abilities[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col items-center"
                    style={{ gap: "2px" }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: ACCENT,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {score}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {abilityModifier(score)}
                    </span>
                  </div>
                );
              })}
            </div>

            <SectionDivider />

            {/* Optional properties */}
            <div className="flex flex-col gap-0.5">
              <PropRow label="Saving Throws" value={monster.saves} />
              <PropRow label="Skills" value={monster.skills} />
              <PropRow label="Damage Resistances" value={monster.resist} />
              <PropRow label="Damage Immunities" value={monster.immune} />
              <PropRow
                label="Condition Immunities"
                value={monster.conditionImmune}
              />
              <PropRow label="Senses" value={monster.senses} />
              <PropRow label="Languages" value={monster.languages} />
            </div>

            <SectionDivider />

            {/* Feature sections */}
            <FeatureSection title="Traits" features={monster.traits} />
            <FeatureSection title="Actions" features={monster.actions} />
            <FeatureSection title="Reactions" features={monster.reactions} />
            <FeatureSection
              title="Legendary Actions"
              features={monster.legendaryActions}
            />

            <SectionDivider />

            {/* Footer */}
            <div className="flex flex-col gap-2 pb-2">
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Source: {monster.source}
                {monster.page ? ` p. ${monster.page}` : ""}
              </div>

              {monster.environment.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginRight: "4px",
                    }}
                  >
                    Environment:
                  </span>
                  {monster.environment.map((env) => (
                    <span
                      key={env}
                      className="px-2 py-0.5 rounded-[2px] text-[11px] font-medium"
                      style={{
                        background: "var(--bg-panel)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {env}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
