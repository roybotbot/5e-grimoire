import { useEffect } from "react";
import type { ClassData } from "../../data/classTypes";
import { SpellDescription } from "../spells/SpellDescription";

interface ClassDetailProps {
  classData: ClassData;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const ACCENT = "var(--accent-primary)";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: ACCENT,
        marginBottom: "8px",
      }}
    >
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

export function ClassDetail({ classData, onClose, onPrev, onNext }: ClassDetailProps) {
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

  const hitDie = `d${classData.hitDie}`;

  // Group features by level
  const featuresByLevel = classData.classFeatures.reduce<
    Record<number, typeof classData.classFeatures>
  >((acc, feature) => {
    if (!acc[feature.level]) acc[feature.level] = [];
    acc[feature.level].push(feature);
    return acc;
  }, {});
  const sortedLevels = Object.keys(featuresByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  // Skill proficiency display
  const skillsDisplay = classData.skillChoices
    ? `Choose ${classData.skillChoices.count} from ${classData.skillChoices.from.join(", ")}`
    : "None";

  // Spellcasting display
  const spellcastingDisplay = classData.spellcastingAbility
    ? classData.casterProgression
      ? `${classData.spellcastingAbility} (${classData.casterProgression})`
      : classData.spellcastingAbility
    : "None";

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
              {classData.name}
            </span>
          </div>

          {/* Hit die badge */}
          <span
            className="px-2 py-0.5 rounded-[2px] text-[12px] font-bold"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border-subtle)",
              color: ACCENT,
            }}
          >
            {hitDie}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {/* Summary section */}
          <div
            className="px-4 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <SectionHeading>Summary</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              <StatRow label="Hit Die" value={hitDie} />
              <StatRow label="Primary Ability" value={classData.primaryAbility} />
              <StatRow
                label="Saving Throws"
                value={classData.savingThrows.join(", ")}
              />
              <StatRow label="Spellcasting" value={spellcastingDisplay} />
            </div>
          </div>

          {/* Proficiencies section */}
          <div
            className="px-4 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <SectionHeading>Proficiencies</SectionHeading>
            <div className="flex flex-col gap-3">
              <StatRow
                label="Armor"
                value={classData.armorProficiencies.join(", ") || "None"}
              />
              <StatRow
                label="Weapons"
                value={classData.weaponProficiencies.join(", ") || "None"}
              />
              <StatRow label="Skills" value={skillsDisplay} />
            </div>
          </div>

          {/* Subclasses section */}
          {classData.subclasses.length > 0 && (
            <div
              className="px-4 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <SectionHeading>Subclasses</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {classData.subclasses.map((sub) => (
                  <span
                    key={sub.name}
                    className="px-2 py-0.5 rounded-[2px]"
                    style={{
                      fontSize: "11px",
                      background: "var(--bg-panel)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {sub.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Class Features section */}
          {sortedLevels.length > 0 && (
            <div className="px-4 py-4">
              <SectionHeading>Class Features</SectionHeading>
              <div className="flex flex-col gap-6">
                {sortedLevels.map((level) => (
                  <div key={level}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: ACCENT,
                        marginBottom: "8px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Level {level}
                    </div>
                    <div className="flex flex-col gap-4">
                      {featuresByLevel[level].map((feature) => (
                        <div key={`${level}-${feature.name}`}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              marginBottom: "6px",
                            }}
                          >
                            {feature.name}
                          </div>
                          {feature.entries.length > 0 && (
                            <SpellDescription entries={feature.entries} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
