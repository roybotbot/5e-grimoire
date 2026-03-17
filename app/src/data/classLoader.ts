import type {
  ClassData,
  SubclassData,
  ClassFeatureData,
  RawClass,
  RawSubclass,
  RawClassFeature,
} from "./classTypes";

// ── Ability map ───────────────────────────────────────────────────────────────

const ABILITY_MAP: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

// ── ID ────────────────────────────────────────────────────────────────────────

export function buildClassId(name: string, source: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(name)}_${slug(source)}`;
}

// ── Hit die ───────────────────────────────────────────────────────────────────

export function normalizeHitDie(
  hd: { number: number; faces: number } | undefined
): number {
  return hd?.faces ?? 8;
}

// ── Primary ability ───────────────────────────────────────────────────────────

export function normalizePrimaryAbility(
  primary: Record<string, boolean>[]
): string {
  const names = primary.map((obj) => {
    const key = Object.keys(obj)[0] ?? "";
    return ABILITY_MAP[key] ?? key;
  });
  return names.join(" or ");
}

// ── Saving throws ─────────────────────────────────────────────────────────────

export function normalizeSavingThrows(profs: string[]): string[] {
  return profs.map((p) => ABILITY_MAP[p] ?? p);
}

// ── Full class normalizer ─────────────────────────────────────────────────────

export function normalizeClassData(
  raw: RawClass,
  rawSubclasses: RawSubclass[],
  rawFeatures: RawClassFeature[]
): ClassData {
  const id = buildClassId(raw.name, raw.source);

  const hitDie = normalizeHitDie(raw.hd);
  const primaryAbility = normalizePrimaryAbility(raw.primaryAbility ?? []);
  const savingThrows = normalizeSavingThrows(raw.proficiency ?? []);

  const profs = raw.startingProficiencies ?? {};
  const armorProficiencies = profs.armor ?? [];
  const weaponProficiencies = profs.weapons ?? [];

  // Extract skill choices from the first skills entry that has a `choose`
  let skillChoices: { from: string[]; count: number } | null = null;
  if (profs.skills && profs.skills.length > 0) {
    const first = profs.skills[0];
    if (first?.choose) {
      skillChoices = {
        from: first.choose.from,
        count: first.choose.count,
      };
    }
  }

  const spellcastingAbility = raw.spellcastingAbility
    ? (ABILITY_MAP[raw.spellcastingAbility] ?? raw.spellcastingAbility)
    : null;

  const casterProgression = raw.casterProgression ?? null;

  // Filter subclasses belonging to this class
  const subclasses: SubclassData[] = rawSubclasses
    .filter(
      (sc) =>
        sc.className === raw.name && sc.classSource === raw.source
    )
    .map((sc) => ({ name: sc.name, shortName: sc.shortName, source: sc.source }));

  // Filter features belonging to this class, sort by level then name
  const classFeatures: ClassFeatureData[] = rawFeatures
    .filter(
      (f) =>
        f.className === raw.name && f.classSource === raw.source
    )
    .map((f) => ({
      name: f.name,
      level: f.level,
      entries: f.entries ?? [],
      source: f.source,
    }))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  return {
    id,
    name: raw.name,
    source: raw.source,
    hitDie,
    primaryAbility,
    savingThrows,
    armorProficiencies,
    weaponProficiencies,
    skillChoices,
    spellcastingAbility,
    casterProgression,
    subclasses,
    classFeatures,
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Loader ────────────────────────────────────────────────────────────────────

const CLASS_FILES = [
  "class-artificer.json",
  "class-barbarian.json",
  "class-bard.json",
  "class-cleric.json",
  "class-druid.json",
  "class-fighter.json",
  "class-monk.json",
  "class-paladin.json",
  "class-ranger.json",
  "class-rogue.json",
  "class-sorcerer.json",
  "class-warlock.json",
  "class-wizard.json",
];

const SOURCE_PRIORITY: Record<string, number> = {
  XPHB: 100,
  EFA: 90,
  TCE: 50,
  PHB: 10,
};

export async function loadAllClasses(
  basePath: string = "/data/class"
): Promise<{ classes: ClassData[]; warnings: string[] }> {
  const warnings: string[] = [];

  // Load all files in parallel
  const results = await Promise.allSettled(
    CLASS_FILES.map(async (filename) => {
      const res = await fetch(`${basePath}/${filename}`);
      if (!res.ok)
        throw new Error(`Failed to fetch ${filename}: ${res.status}`);
      return res.json() as Promise<{
        class: RawClass[];
        subclass: RawSubclass[];
        classFeature: RawClassFeature[];
        subclassFeature: unknown[];
      }>;
    })
  );

  // Collect all raw data across files
  const allRawClasses: RawClass[] = [];
  const allRawSubclasses: RawSubclass[] = [];
  const allRawFeatures: RawClassFeature[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const data = result.value;
      // Skip entries with _copy
      allRawClasses.push(...(data.class ?? []).filter((c) => !c._copy));
      allRawSubclasses.push(...(data.subclass ?? []));
      allRawFeatures.push(...(data.classFeature ?? []));
    } else {
      warnings.push(
        `Failed to load ${CLASS_FILES[i]}: ${result.reason}`
      );
    }
  }

  // Normalize all classes
  const allClasses: ClassData[] = [];
  for (const raw of allRawClasses) {
    try {
      allClasses.push(normalizeClassData(raw, allRawSubclasses, allRawFeatures));
    } catch (e) {
      warnings.push(`Failed to normalize class "${raw?.name}" (${raw?.source}): ${e}`);
    }
  }

  // Deduplicate: keep highest-priority source per class name
  const deduped = new Map<string, ClassData>();
  for (const cls of allClasses) {
    const key = cls.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, cls);
    } else {
      const existingPriority = SOURCE_PRIORITY[existing.source] ?? 30;
      const newPriority = SOURCE_PRIORITY[cls.source] ?? 30;
      if (newPriority > existingPriority) {
        deduped.set(key, cls);
      }
    }
  }

  // Sort by name
  const classes = Array.from(deduped.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return { classes, warnings };
}
