import type { SpeciesData, SpeciesSpeed, RawRace } from "./speciesTypes";
import { buildEntityId } from "./entityId";
import { SIZE_MAP } from "./constants";

// ── ID ────────────────────────────────────────────────────────────────────────

export const buildSpeciesId = buildEntityId;

export function normalizeSize(sizes: string[] | undefined): string {
  if (!sizes || sizes.length === 0) return "Medium";
  return sizes.map((s) => SIZE_MAP[s] ?? s).join(" or ");
}

// ── Speed ─────────────────────────────────────────────────────────────────────

export function normalizeSpeed(
  raw: RawRace["speed"]
): { speed: SpeciesSpeed; display: string } {
  if (raw === undefined || raw === null) {
    return { speed: { walk: 30 }, display: "30 ft." };
  }

  if (typeof raw === "number") {
    return { speed: { walk: raw }, display: `${raw} ft.` };
  }

  // Object form
  const speed: SpeciesSpeed = { walk: raw.walk ?? 30 };

  // fly can be a number or { number: N }
  if (raw.fly !== undefined) {
    speed.fly =
      typeof raw.fly === "number" ? raw.fly : (raw.fly as { number: number }).number;
  }
  if (raw.swim !== undefined) speed.swim = raw.swim;
  if (raw.climb !== undefined) speed.climb = raw.climb;
  if (raw.burrow !== undefined) speed.burrow = raw.burrow;

  // Build display string: walk first, then extras
  const parts: string[] = [`${speed.walk} ft.`];
  if (speed.fly !== undefined) parts.push(`fly ${speed.fly} ft.`);
  if (speed.swim !== undefined) parts.push(`swim ${speed.swim} ft.`);
  if (speed.climb !== undefined) parts.push(`climb ${speed.climb} ft.`);
  if (speed.burrow !== undefined) parts.push(`burrow ${speed.burrow} ft.`);

  return { speed, display: parts.join(", ") };
}

// ── Full race normalizer ──────────────────────────────────────────────────────

export function normalizeRace(raw: RawRace): SpeciesData {
  const id = buildSpeciesId(raw.name, raw.source);
  const sizeDisplay = normalizeSize(raw.size);
  const { speed, display: speedDisplay } = normalizeSpeed(raw.speed);

  return {
    id,
    name: raw.name,
    source: raw.source,
    size: raw.size ?? ["M"],
    sizeDisplay,
    speed,
    speedDisplay,
    darkvision: raw.darkvision ?? null,
    traits: raw.entries ?? [],
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadAllSpecies(basePath: string = "/data"): Promise<{
  species: SpeciesData[];
  warnings: string[];
}> {
  const res = await fetch(`${basePath}/races.json`);
  if (!res.ok) throw new Error(`Failed to fetch races.json: ${res.status}`);

  const data = await res.json();
  const races: RawRace[] = data.race ?? [];

  const allSpecies: SpeciesData[] = [];
  const warnings: string[] = [];

  for (const raw of races) {
    // Skip _copy entries (they are partial overrides, not standalone races)
    if (raw._copy) continue;

    try {
      allSpecies.push(normalizeRace(raw));
    } catch (e) {
      warnings.push(`Failed to normalize race "${raw?.name}" from ${raw?.source}: ${e}`);
    }
  }

  // Deduplicate: when the same race appears in multiple sources, keep the
  // highest-priority version. XPHB > MPMM > VGM > PHB
  const SOURCE_PRIORITY: Record<string, number> = {
    XPHB: 100, // 2024 Player's Handbook — highest priority
    MPMM: 60,  // Mordenkainen Presents: Monsters of the Multiverse
    VGM: 40,   // Volo's Guide to Monsters
    PHB: 10,   // 2014 Player's Handbook — lowest priority for reprints
  };

  const deduped = new Map<string, SpeciesData>();
  for (const species of allSpecies) {
    const key = species.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, species);
    } else {
      const existingPriority = SOURCE_PRIORITY[existing.source] ?? 30;
      const newPriority = SOURCE_PRIORITY[species.source] ?? 30;
      if (newPriority > existingPriority) {
        deduped.set(key, species);
      }
    }
  }

  const dedupedSpecies = Array.from(deduped.values());

  // Sort by name
  dedupedSpecies.sort((a, b) => a.name.localeCompare(b.name));

  return { species: dedupedSpecies, warnings };
}
