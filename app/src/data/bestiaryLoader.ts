import type {
  MonsterData,
  MonsterFeature,
  RawMonster,
  RawBestiaryIndex,
} from "./bestiaryTypes";
import type { SpellEntry } from "./spellTypes";
import { buildEntityId } from "./entityId";
import { SIZE_MAP } from "./constants";

// ── ID ────────────────────────────────────────────────────────────────────────

export const buildMonsterId = buildEntityId;

// ── Type ──────────────────────────────────────────────────────────────────────

export function normalizeMonsterType(
  type: RawMonster["type"]
): string {
  if (!type) return "Unknown";

  if (typeof type === "string") {
    return capitalize(type);
  }

  const base = capitalize(type.type);

  if (!type.tags || type.tags.length === 0) {
    return base;
  }

  const tagStrings = type.tags.map((tag) => {
    if (typeof tag === "string") return tag;
    const prefix = tag.prefix ? `${tag.prefix} ` : "";
    return `${prefix}${tag.tag}`;
  });

  return `${base} (${tagStrings.join(", ")})`;
}

// ── Size ──────────────────────────────────────────────────────────────────────

function normalizeSize(sizes: string[]): { size: string[]; sizeDisplay: string } {
  const display = sizes.map((s) => SIZE_MAP[s] ?? s).join(", ");
  return { size: sizes, sizeDisplay: display };
}

// ── Alignment ─────────────────────────────────────────────────────────────────

const ALIGN_MAP: Record<string, string> = {
  L: "Lawful",
  N: "Neutral",
  C: "Chaotic",
  G: "Good",
  E: "Evil",
  A: "Any alignment",
  U: "Unaligned",
};

function normalizeAlignment(
  alignment: RawMonster["alignment"]
): string {
  if (!alignment || alignment.length === 0) return "Unaligned";

  const parts = alignment.map((a) => {
    if (typeof a === "string") return ALIGN_MAP[a] ?? a;
    // object with alignment array
    return a.alignment.map((x) => ALIGN_MAP[x] ?? x).join(" ");
  });

  // Typically two-part: ["L","G"] → "Lawful Good"
  return parts.join(" ");
}

// ── AC ────────────────────────────────────────────────────────────────────────

export function normalizeMonsterAC(
  ac: RawMonster["ac"]
): string {
  if (!ac || ac.length === 0) return "—";

  const first = ac[0];

  if (typeof first === "number") return String(first);

  // Object form
  const acObj = first as { ac?: number; from?: string[]; special?: string };

  if (acObj.special) return acObj.special;

  const base = String(acObj.ac ?? "—");
  if (acObj.from && acObj.from.length > 0) {
    return `${base} (${acObj.from.join(", ")})`;
  }
  return base;
}

// ── HP ────────────────────────────────────────────────────────────────────────

export function normalizeMonsterHP(
  hp: RawMonster["hp"]
): string {
  if (!hp) return "—";
  if (hp.special) return hp.special;
  if (hp.average !== undefined && hp.formula) {
    return `${hp.average} (${hp.formula})`;
  }
  if (hp.average !== undefined) return String(hp.average);
  return "—";
}

// ── Speed ─────────────────────────────────────────────────────────────────────

export function normalizeMonsterSpeed(
  speed: RawMonster["speed"]
): string {
  if (!speed) return "—";

  const ORDER = ["walk", "fly", "swim", "climb", "burrow"];
  const parts: string[] = [];

  for (const key of ORDER) {
    const val = speed[key];
    if (val === undefined) continue;

    const num = typeof val === "number" ? val : val.number;
    const ft = `${num} ft.`;

    if (key === "walk") {
      parts.push(ft);
    } else {
      parts.push(`${key} ${ft}`);
    }
  }

  // Any remaining keys not in ORDER
  for (const [key, val] of Object.entries(speed)) {
    if (ORDER.includes(key)) continue;
    const num = typeof val === "number" ? val : val.number;
    parts.push(`${key} ${num} ft.`);
  }

  return parts.join(", ") || "—";
}

// ── CR ────────────────────────────────────────────────────────────────────────

const CR_FRACTION_MAP: Record<string, number> = {
  "0": 0,
  "1/8": 0.125,
  "1/4": 0.25,
  "1/2": 0.5,
};

export function normalizeMonsterCR(
  cr: RawMonster["cr"]
): { cr: string; crNumber: number } {
  if (!cr) return { cr: "0", crNumber: 0 };

  const crStr = typeof cr === "string" ? cr : cr.cr;
  const crNumber =
    crStr in CR_FRACTION_MAP ? CR_FRACTION_MAP[crStr] : Number(crStr);

  return { cr: crStr, crNumber };
}

// ── Damage / condition lists ───────────────────────────────────────────────────

function normalizeDamageList(
  list:
    | (string | { immune?: string[]; resist?: string[]; conditionImmune?: string[] })[]
    | undefined
): string {
  if (!list || list.length === 0) return "";

  const parts: string[] = [];
  for (const item of list) {
    if (typeof item === "string") {
      parts.push(item);
    } else {
      // Flatten whichever array key exists
      const arr =
        (item as { immune?: string[] }).immune ??
        (item as { resist?: string[] }).resist ??
        (item as { conditionImmune?: string[] }).conditionImmune ??
        [];
      parts.push(...arr);
    }
  }
  return parts.join(", ");
}

// ── Features ──────────────────────────────────────────────────────────────────

function normalizeFeatures(
  features: { name: string; entries: SpellEntry[] }[] | undefined
): MonsterFeature[] {
  if (!features) return [];
  return features.map((f) => ({ name: f.name, entries: f.entries }));
}

// ── Skills / saves ────────────────────────────────────────────────────────────

function normalizeRecord(record: Record<string, string> | undefined): string {
  if (!record) return "";
  return Object.entries(record)
    .map(([k, v]) => `${capitalize(k)} ${v}`)
    .join(", ");
}

// ── Full normalizer ───────────────────────────────────────────────────────────

export function normalizeMonster(raw: RawMonster): MonsterData {
  const id = buildMonsterId(raw.name, raw.source);

  const { size, sizeDisplay } = normalizeSize(raw.size ?? []);

  // type = lowercase base type for filtering (e.g. "humanoid")
  const typeBase = typeof raw.type === "string"
    ? raw.type
    : (raw.type as { type: string })?.type ?? "unknown";
  // typeDisplay = full display string (e.g. "Humanoid (aarakocra)")
  const typeDisplay = normalizeMonsterType(raw.type);

  const { cr, crNumber } = normalizeMonsterCR(raw.cr);

  const sensesParts: string[] = [...(raw.senses ?? [])];
  if (raw.passive !== undefined) {
    sensesParts.push(`passive Perception ${raw.passive}`);
  }

  return {
    id,
    name: raw.name,
    source: raw.source,
    size,
    sizeDisplay,
    type: typeBase,
    typeDisplay,
    alignment: normalizeAlignment(raw.alignment),
    ac: normalizeMonsterAC(raw.ac),
    hp: normalizeMonsterHP(raw.hp),
    speed: normalizeMonsterSpeed(raw.speed),
    abilities: {
      str: raw.str ?? 10,
      dex: raw.dex ?? 10,
      con: raw.con ?? 10,
      int: raw.int ?? 10,
      wis: raw.wis ?? 10,
      cha: raw.cha ?? 10,
    },
    cr,
    crNumber,
    traits: normalizeFeatures(raw.trait),
    actions: normalizeFeatures(raw.action),
    legendaryActions: normalizeFeatures(raw.legendary),
    reactions: normalizeFeatures(raw.reaction),
    senses: sensesParts.join(", "),
    languages: (raw.languages ?? []).join(", "),
    skills: normalizeRecord(raw.skill),
    saves: normalizeRecord(raw.save),
    immune: normalizeDamageList(raw.immune as Parameters<typeof normalizeDamageList>[0]),
    resist: normalizeDamageList(raw.resist as Parameters<typeof normalizeDamageList>[0]),
    conditionImmune: normalizeDamageList(raw.conditionImmune as Parameters<typeof normalizeDamageList>[0]),
    environment: raw.environment ?? [],
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Loader ────────────────────────────────────────────────────────────────────

// Dedup priority: higher number = preferred
const SOURCE_PRIORITY: Record<string, number> = {
  XPHB: 100,
  XMM: 90,
  XDMG: 85,
  MPMM: 70,
  VGM: 60,
  MM: 50,
};

export async function loadAllMonsters(
  basePath: string = "/data/bestiary"
): Promise<{ monsters: MonsterData[]; warnings: string[] }> {
  const indexRes = await fetch(`${basePath}/index.json`);
  if (!indexRes.ok) {
    throw new Error(`Failed to fetch bestiary index: ${indexRes.status}`);
  }

  const index: RawBestiaryIndex = await indexRes.json();

  const entries = Object.entries(index);

  const results = await Promise.allSettled(
    entries.map(async ([_source, filename]) => {
      const res = await fetch(`${basePath}/${filename}`);
      if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
      const data = await res.json();
      return data.monster as RawMonster[];
    })
  );

  const allMonsters: MonsterData[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      for (const raw of result.value) {
        // Skip _copy entries (template references, not real monsters)
        if (raw._copy) continue;

        try {
          allMonsters.push(normalizeMonster(raw));
        } catch (e) {
          warnings.push(
            `Failed to normalize monster "${raw?.name}" from ${entries[i][0]}: ${e}`
          );
        }
      }
    } else {
      warnings.push(
        `Failed to load bestiary file for ${entries[i][0]}: ${result.reason}`
      );
    }
  }

  // Deduplicate by name — keep highest-priority source
  const deduped = new Map<string, MonsterData>();
  for (const monster of allMonsters) {
    const key = monster.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, monster);
    } else {
      const existingPriority = SOURCE_PRIORITY[existing.source] ?? 30;
      const newPriority = SOURCE_PRIORITY[monster.source] ?? 30;
      if (newPriority > existingPriority) {
        deduped.set(key, monster);
      }
    }
  }

  const monsters = Array.from(deduped.values());
  monsters.sort((a, b) => a.name.localeCompare(b.name));

  return { monsters, warnings };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
