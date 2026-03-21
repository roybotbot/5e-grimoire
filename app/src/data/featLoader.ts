import type { FeatData, RawFeat, RawPrerequisite } from "./featTypes";
import { buildEntityId } from "./entityId";
import { ABILITY_MAP } from "./constants";

// ── ID ────────────────────────────────────────────────────────────────────────

export const buildFeatId = buildEntityId;

// ── Category ──────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  G: "General",
  G4: "General (4th Level)",
  G8: "General (8th Level)",
  G12: "General (12th Level)",
  G16: "General (16th Level)",
  EB: "Epic Boon",
  FS: "Fighting Style",
  "FS:R": "Fighting Style",
  "FS:P": "Fighting Style",
  OF: "Origin",
  O: "Origin",
  D: "Dragonmark",
};

export function normalizeFeatCategory(category: string | undefined): string {
  if (!category) return "Other";
  return CATEGORY_MAP[category] ?? "Other";
}

// ── Prerequisites ─────────────────────────────────────────────────────────────

export function normalizePrerequisite(
  prereqs: RawPrerequisite[] | undefined
): string | null {
  if (!prereqs || prereqs.length === 0) return null;

  const parts: string[] = [];

  for (const prereq of prereqs) {
    // Level
    if (prereq.level !== undefined) {
      if (typeof prereq.level === "number") {
        parts.push(`Level ${prereq.level}+`);
      } else {
        // Complex level: { level: N, class?: { name: string } }
        const lvl = prereq.level.level;
        const cls = prereq.level.class?.name;
        parts.push(cls ? `Level ${lvl}+ ${cls}` : `Level ${lvl}+`);
      }
    }

    // Ability scores
    if (prereq.ability && prereq.ability.length > 0) {
      for (const abilityObj of prereq.ability) {
        for (const [key, score] of Object.entries(abilityObj)) {
          const abilityName = ABILITY_MAP[key] ?? key;
          parts.push(`${abilityName} ${score}+`);
        }
      }
    }

    // Spellcasting
    if (prereq.spellcasting || prereq.spellcasting2020) {
      parts.push("Spellcasting");
    }

    // Race
    if (prereq.race && prereq.race.length > 0) {
      const raceNames = prereq.race.map((r) => {
        const name = r.name.charAt(0).toUpperCase() + r.name.slice(1);
        return name;
      });
      parts.push(raceNames.join(" or "));
    }

    // Feat prerequisite
    if (prereq.feat && prereq.feat.length > 0) {
      // Feat strings are in format "feat name|source|display name" — use display or first part
      const featNames = prereq.feat.map((f) => {
        const segments = f.split("|");
        // Use display name (3rd segment) if available, otherwise capitalize feat name
        const raw = segments[2] ?? segments[0];
        return raw
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      });
      parts.push(featNames.join(", "));
    }

    // otherSummary (structured human-readable text)
    if (prereq.otherSummary) {
      parts.push(prereq.otherSummary.entry);
    }

    // Free-form other
    if (prereq.other) {
      parts.push(prereq.other);
    }
  }

  if (parts.length === 0) return null;
  return parts.join("; ");
}

// ── Normalize ─────────────────────────────────────────────────────────────────

export function normalizeFeat(raw: RawFeat): FeatData {
  const id = buildFeatId(raw.name, raw.source);
  const categoryDisplay = normalizeFeatCategory(raw.category);
  const prerequisite = normalizePrerequisite(raw.prerequisite);

  return {
    id,
    name: raw.name,
    source: raw.source,
    category: raw.category ?? null,
    categoryDisplay,
    prerequisite,
    entries: raw.entries ?? [],
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Loader ────────────────────────────────────────────────────────────────────

const SOURCE_PRIORITY: Record<string, number> = {
  XPHB: 100, // 2024 Player's Handbook — highest priority
  EFA: 90,   // 2024 era supplements
  TCE: 50,   // Tasha's Cauldron
  XGE: 40,   // Xanathar's Guide
  PHB: 10,   // 2014 Player's Handbook — lowest priority for reprints
};

export async function loadAllFeats(
  basePath: string = "/data"
): Promise<{ feats: FeatData[]; warnings: string[] }> {
  const res = await fetch(`${basePath}/feats.json`);
  if (!res.ok) throw new Error(`Failed to fetch feats: ${res.status}`);

  const data = await res.json();
  const rawFeats: RawFeat[] = data.feat ?? [];

  const allFeats: FeatData[] = [];
  const warnings: string[] = [];

  for (const raw of rawFeats) {
    // Skip copy entries
    if (raw._copy) continue;

    try {
      allFeats.push(normalizeFeat(raw));
    } catch (e) {
      warnings.push(`Failed to normalize feat "${raw?.name}" from ${raw?.source}: ${e}`);
    }
  }

  // Deduplicate: keep the version from the highest-priority source
  const deduped = new Map<string, FeatData>();
  for (const feat of allFeats) {
    const key = feat.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, feat);
    } else {
      const existingPriority = SOURCE_PRIORITY[existing.source] ?? 30;
      const newPriority = SOURCE_PRIORITY[feat.source] ?? 30;
      if (newPriority > existingPriority) {
        deduped.set(key, feat);
      }
    }
  }

  const dedupedFeats = Array.from(deduped.values());
  dedupedFeats.sort((a, b) => a.name.localeCompare(b.name));

  return { feats: dedupedFeats, warnings };
}
