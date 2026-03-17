# Species, Classes, Feats & Bestiary Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new content sections (Species, Classes, Feats, Bestiary) to the 5e Grimoire app, each with list/detail views, search, and filters — following the same patterns as the existing Spells section.

**Architecture:** Each content type gets its own data layer (types, loader, store), filter/search hooks, and component set. The patterns are cloned from the Spells implementation: raw JSON → normalized types → Zustand store → filter hook → search hook → list/detail UI. The landing page gets updated entries. Routes are added to App.tsx. Shared UI components (search bar, tag renderer, confirm dialog) are reused. A generic `EntityListView` shell is NOT created — each section gets its own view to allow for entity-specific layouts, but common patterns are followed.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Tailwind CSS 4, Vitest, react-router 7

**Data locations:**
- Species: `/data/races.json` (key: `race`, also `subrace`)
- Classes: `/data/class/class-*.json` (each file has `class`, `subclass`, `classFeature`, `subclassFeature`)
- Feats: `/data/feats.json` (key: `feat`)
- Bestiary: `/data/bestiary/index.json` → individual `bestiary-*.json` files (key: `monster`)

**Important data note:** The app builds to `../docs` and data files are served from `/data/`. The existing spell data lives at `docs/data/spells/`. New data will need to be copied/symlinked from the root `data/` directory into `docs/data/` (or `app/public/data/`) for dev and prod serving. This is addressed in Task 1.

---

## Chunk 1: Foundation & Species

### Task 1: Copy source data into public serving directory

**Files:**
- Modify: `app/vite.config.ts` (if needed for proxy)
- Create: script or symlinks for data

The app serves static data from `docs/data/` in prod (build output). For dev, Vite serves from `app/public/`. We need the data accessible at `/data/bestiary/`, `/data/races.json`, `/data/feats.json`, `/data/class/`.

- [ ] **Step 1: Create symlinks in app/public/data for new data sources**

```bash
cd app/public
mkdir -p data
# Spells are already at docs/data/spells — symlink for dev
ln -sf ../../../data/races.json data/races.json
ln -sf ../../../data/feats.json data/feats.json
ln -sf ../../../data/bestiary data/bestiary
ln -sf ../../../data/class data/class
ln -sf ../../../data/fluff-races.json data/fluff-races.json
ln -sf ../../../data/fluff-feats.json data/fluff-feats.json
```

- [ ] **Step 2: Verify dev server can serve the new data**

```bash
cd app && npm run dev &
sleep 2
curl -s http://localhost:5173/data/races.json | head -c 200
curl -s http://localhost:5173/data/feats.json | head -c 200
curl -s http://localhost:5173/data/bestiary/index.json | head -c 200
curl -s http://localhost:5173/data/class/class-wizard.json | head -c 200
kill %1
```

Expected: JSON content returned for each.

- [ ] **Step 3: Copy data into docs/data for prod build**

```bash
cp data/races.json docs/data/races.json
cp data/feats.json docs/data/feats.json
cp -r data/bestiary docs/data/bestiary
cp -r data/class docs/data/class
cp data/fluff-races.json docs/data/fluff-races.json
cp data/fluff-feats.json docs/data/fluff-feats.json
```

Note: The `vite build` step uses `emptyOutDir: true`, which will wipe `docs/`. The data files in `docs/data/spells/` already exist from a prior copy. After each build, these data files will need to be restored. Consider adding a post-build script. For now, document this in the README.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add data symlinks and copies for species, classes, feats, bestiary"
```

---

### Task 2: Species types

**Files:**
- Create: `app/src/data/speciesTypes.ts`
- Test: `app/src/data/speciesLoader.test.ts` (started in next task)

- [ ] **Step 1: Write the species type definitions**

Create `app/src/data/speciesTypes.ts`:

```typescript
import type { SpellEntry } from "./spellTypes";

export interface SpeciesData {
  id: string;
  name: string;
  source: string;
  size: string[];           // ["M"], ["S", "M"], etc.
  sizeDisplay: string;      // "Medium", "Small or Medium"
  speed: SpeciesSpeed;
  speedDisplay: string;     // "30 ft.", "30 ft., fly 50 ft."
  darkvision: number | null;
  traits: SpellEntry[];     // Reuses the same entry format as spells
  page?: number;
}

export interface SpeciesSpeed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
}

export interface RawRace {
  name: string;
  source: string;
  page?: number;
  size?: string[];
  speed?: number | { walk?: number; fly?: number | { number: number }; swim?: number; climb?: number; burrow?: number };
  darkvision?: number;
  entries?: SpellEntry[];
  reprintedAs?: string[];
  _copy?: unknown;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/data/speciesTypes.ts
git commit -m "feat(species): add type definitions"
```

---

### Task 3: Species loader

**Files:**
- Create: `app/src/data/speciesLoader.ts`
- Create: `app/src/data/speciesLoader.test.ts`

- [ ] **Step 1: Write failing tests for species loader**

Create `app/src/data/speciesLoader.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildSpeciesId,
  normalizeSize,
  normalizeSpeed,
  normalizeRace,
} from "./speciesLoader";

describe("buildSpeciesId", () => {
  it("creates URL-safe slug from name and source", () => {
    expect(buildSpeciesId("Dragonborn", "PHB")).toBe("dragonborn_phb");
  });

  it("handles apostrophes and special chars", () => {
    expect(buildSpeciesId("Half-Elf", "PHB")).toBe("half-elf_phb");
  });
});

describe("normalizeSize", () => {
  it("returns Medium for ['M']", () => {
    expect(normalizeSize(["M"])).toBe("Medium");
  });

  it("returns Small or Medium for ['S', 'M']", () => {
    expect(normalizeSize(["S", "M"])).toBe("Small or Medium");
  });

  it("returns Medium for undefined", () => {
    expect(normalizeSize(undefined)).toBe("Medium");
  });
});

describe("normalizeSpeed", () => {
  it("normalizes numeric speed", () => {
    const result = normalizeSpeed(30);
    expect(result.speed.walk).toBe(30);
    expect(result.display).toBe("30 ft.");
  });

  it("normalizes speed object with fly", () => {
    const result = normalizeSpeed({ walk: 20, fly: 50 });
    expect(result.speed.walk).toBe(20);
    expect(result.speed.fly).toBe(50);
    expect(result.display).toBe("20 ft., fly 50 ft.");
  });

  it("normalizes speed object with nested fly number", () => {
    const result = normalizeSpeed({ walk: 30, fly: { number: 30 } });
    expect(result.speed.fly).toBe(30);
  });

  it("defaults to 30 ft. when undefined", () => {
    const result = normalizeSpeed(undefined);
    expect(result.speed.walk).toBe(30);
    expect(result.display).toBe("30 ft.");
  });
});

describe("normalizeRace", () => {
  it("normalizes a raw race into SpeciesData", () => {
    const raw = {
      name: "Human",
      source: "PHB",
      page: 29,
      size: ["M"],
      speed: 30,
      entries: [
        {
          type: "entries",
          name: "Languages",
          entries: ["You can speak, read, and write Common and one extra language."],
        },
      ],
    };
    const result = normalizeRace(raw);
    expect(result.id).toBe("human_phb");
    expect(result.name).toBe("Human");
    expect(result.sizeDisplay).toBe("Medium");
    expect(result.speedDisplay).toBe("30 ft.");
    expect(result.darkvision).toBeNull();
    expect(result.traits).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd app && npx vitest --run src/data/speciesLoader.test.ts
```

Expected: FAIL — module `./speciesLoader` not found.

- [ ] **Step 3: Write the species loader implementation**

Create `app/src/data/speciesLoader.ts`:

```typescript
import type { SpeciesData, SpeciesSpeed, RawRace } from "./speciesTypes";
import type { SpellEntry } from "./spellTypes";

// ── ID ────────────────────────────────────────────────────────────────────────

export function buildSpeciesId(name: string, source: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(name)}_${slug(source)}`;
}

// ── Size ──────────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<string, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
};

export function normalizeSize(sizes: string[] | undefined): string {
  if (!sizes || sizes.length === 0) return "Medium";
  return sizes.map((s) => SIZE_MAP[s] ?? s).join(" or ");
}

// ── Speed ─────────────────────────────────────────────────────────────────────

export function normalizeSpeed(
  raw: number | { walk?: number; fly?: number | { number: number }; swim?: number; climb?: number; burrow?: number } | undefined
): { speed: SpeciesSpeed; display: string } {
  if (raw === undefined || raw === null) {
    return { speed: { walk: 30 }, display: "30 ft." };
  }

  if (typeof raw === "number") {
    return { speed: { walk: raw }, display: `${raw} ft.` };
  }

  const walk = raw.walk ?? 30;
  const fly = typeof raw.fly === "object" ? raw.fly.number : raw.fly;
  const swim = raw.swim;
  const climb = raw.climb;
  const burrow = raw.burrow;

  const speed: SpeciesSpeed = { walk };
  if (fly) speed.fly = fly;
  if (swim) speed.swim = swim;
  if (climb) speed.climb = climb;
  if (burrow) speed.burrow = burrow;

  const parts = [`${walk} ft.`];
  if (fly) parts.push(`fly ${fly} ft.`);
  if (swim) parts.push(`swim ${swim} ft.`);
  if (climb) parts.push(`climb ${climb} ft.`);
  if (burrow) parts.push(`burrow ${burrow} ft.`);

  return { speed, display: parts.join(", ") };
}

// ── Race normalizer ───────────────────────────────────────────────────────────

export function normalizeRace(raw: RawRace): SpeciesData {
  const id = buildSpeciesId(raw.name, raw.source);
  const sizeDisplay = normalizeSize(raw.size);
  const { speed, display: speedDisplay } = normalizeSpeed(raw.speed);
  const darkvision = raw.darkvision ?? null;
  const traits: SpellEntry[] = raw.entries ?? [];

  return {
    id,
    name: raw.name,
    source: raw.source,
    size: raw.size ?? ["M"],
    sizeDisplay,
    speed,
    speedDisplay,
    darkvision,
    traits,
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Dedup priority (same as spells) ───────────────────────────────────────────

const SOURCE_PRIORITY: Record<string, number> = {
  XPHB: 100,
  EFA: 90,
  MPMM: 80,
  VGM: 40,
  PHB: 10,
};

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadAllSpecies(
  basePath: string = "/data"
): Promise<{ species: SpeciesData[]; warnings: string[] }> {
  const res = await fetch(`${basePath}/races.json`);
  if (!res.ok) throw new Error(`Failed to fetch races.json: ${res.status}`);

  const data = await res.json();
  const rawRaces: RawRace[] = data.race ?? [];

  const allSpecies: SpeciesData[] = [];
  const warnings: string[] = [];

  for (const raw of rawRaces) {
    // Skip entries that are copies (incomplete data)
    if (raw._copy) continue;
    try {
      allSpecies.push(normalizeRace(raw));
    } catch (e) {
      warnings.push(`Failed to normalize species "${raw?.name}": ${e}`);
    }
  }

  // Deduplicate: keep highest-priority source
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

  const result = Array.from(deduped.values());
  result.sort((a, b) => a.name.localeCompare(b.name));

  return { species: result, warnings };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd app && npx vitest --run src/data/speciesLoader.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/data/speciesLoader.ts app/src/data/speciesLoader.test.ts
git commit -m "feat(species): add loader with normalizers and tests"
```

---

### Task 4: Species store

**Files:**
- Create: `app/src/store/useSpeciesStore.ts`
- Create: `app/src/store/useSpeciesStore.test.ts`

- [ ] **Step 1: Write failing test for species store**

Create `app/src/store/useSpeciesStore.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSpeciesStore } from "./useSpeciesStore";

// Mock the loader
vi.mock("../data/speciesLoader", () => ({
  loadAllSpecies: vi.fn(),
}));

import { loadAllSpecies } from "../data/speciesLoader";
const mockLoad = vi.mocked(loadAllSpecies);

describe("useSpeciesStore", () => {
  beforeEach(() => {
    useSpeciesStore.setState({
      species: [],
      loading: false,
      error: null,
      warnings: [],
    });
  });

  it("starts with empty state", () => {
    const state = useSpeciesStore.getState();
    expect(state.species).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("loads species and sets state", async () => {
    const mockSpecies = [
      { id: "human_phb", name: "Human", source: "PHB", size: ["M"], sizeDisplay: "Medium", speed: { walk: 30 }, speedDisplay: "30 ft.", darkvision: null, traits: [] },
    ];
    mockLoad.mockResolvedValueOnce({ species: mockSpecies as any, warnings: [] });

    await useSpeciesStore.getState().loadSpecies();

    const state = useSpeciesStore.getState();
    expect(state.species).toEqual(mockSpecies);
    expect(state.loading).toBe(false);
  });

  it("sets error on failure", async () => {
    mockLoad.mockRejectedValueOnce(new Error("network error"));

    await useSpeciesStore.getState().loadSpecies();

    const state = useSpeciesStore.getState();
    expect(state.error).toBe("network error");
    expect(state.loading).toBe(false);
  });

  it("returns unique sources", async () => {
    useSpeciesStore.setState({
      species: [
        { id: "a", name: "A", source: "PHB", size: ["M"], sizeDisplay: "M", speed: { walk: 30 }, speedDisplay: "30", darkvision: null, traits: [] },
        { id: "b", name: "B", source: "XPHB", size: ["M"], sizeDisplay: "M", speed: { walk: 30 }, speedDisplay: "30", darkvision: null, traits: [] },
      ] as any,
    });

    expect(useSpeciesStore.getState().allSources()).toEqual(["PHB", "XPHB"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && npx vitest --run src/store/useSpeciesStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write species store implementation**

Create `app/src/store/useSpeciesStore.ts`:

```typescript
import { create } from "zustand";
import type { SpeciesData } from "../data/speciesTypes";
import { loadAllSpecies } from "../data/speciesLoader";

interface SpeciesStore {
  species: SpeciesData[];
  loading: boolean;
  error: string | null;
  warnings: string[];

  loadSpecies: () => Promise<void>;
  allSources: () => string[];
  allSizes: () => string[];
}

export const useSpeciesStore = create<SpeciesStore>((set, get) => ({
  species: [],
  loading: false,
  error: null,
  warnings: [],

  loadSpecies: async () => {
    set({ loading: true, error: null });
    try {
      const { species, warnings } = await loadAllSpecies();
      set({ species, warnings, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  allSources: () => {
    const { species } = get();
    return Array.from(new Set(species.map((s) => s.source))).sort();
  },

  allSizes: () => {
    const { species } = get();
    const sizeSet = new Set<string>();
    for (const s of species) {
      sizeSet.add(s.sizeDisplay);
    }
    return Array.from(sizeSet).sort();
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && npx vitest --run src/store/useSpeciesStore.test.ts
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/store/useSpeciesStore.ts app/src/store/useSpeciesStore.test.ts
git commit -m "feat(species): add Zustand store with tests"
```

---

### Task 5: Species filter & search hooks

**Files:**
- Create: `app/src/hooks/useSpeciesFilters.ts`
- Create: `app/src/hooks/useSpeciesFilters.test.ts`
- Create: `app/src/hooks/useSpeciesSearch.ts`
- Create: `app/src/hooks/useSpeciesSearch.test.ts`

- [ ] **Step 1: Write failing test for species filters**

Create `app/src/hooks/useSpeciesFilters.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { applySpeciesFilters } from "./useSpeciesFilters";
import type { SpeciesData } from "../data/speciesTypes";

function makeSpecies(overrides: Partial<SpeciesData> = {}): SpeciesData {
  return {
    id: "test_phb",
    name: "Test",
    source: "PHB",
    size: ["M"],
    sizeDisplay: "Medium",
    speed: { walk: 30 },
    speedDisplay: "30 ft.",
    darkvision: null,
    traits: [],
    ...overrides,
  };
}

describe("applySpeciesFilters", () => {
  it("returns all species when no filters active", () => {
    const species = [makeSpecies()];
    expect(applySpeciesFilters(species, {})).toEqual(species);
  });

  it("filters by size", () => {
    const species = [
      makeSpecies({ id: "a", sizeDisplay: "Medium" }),
      makeSpecies({ id: "b", sizeDisplay: "Small" }),
    ];
    const result = applySpeciesFilters(species, { sizes: new Set(["Small"]) });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("filters by source", () => {
    const species = [
      makeSpecies({ id: "a", source: "PHB" }),
      makeSpecies({ id: "b", source: "XPHB" }),
    ];
    const result = applySpeciesFilters(species, { sources: new Set(["XPHB"]) });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("filters by darkvision", () => {
    const species = [
      makeSpecies({ id: "a", darkvision: 60 }),
      makeSpecies({ id: "b", darkvision: null }),
    ];
    const result = applySpeciesFilters(species, { hasDarkvision: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && npx vitest --run src/hooks/useSpeciesFilters.test.ts
```

- [ ] **Step 3: Write species filters implementation**

Create `app/src/hooks/useSpeciesFilters.ts`:

```typescript
import { useState, useMemo } from "react";
import type { SpeciesData } from "../data/speciesTypes";

export interface SpeciesFilterState {
  sizes?: Set<string>;
  sources?: Set<string>;
  hasDarkvision?: boolean;
}

export function applySpeciesFilters(
  species: SpeciesData[],
  filters: SpeciesFilterState
): SpeciesData[] {
  return species.filter((s) => {
    if (filters.sizes && filters.sizes.size > 0) {
      if (!filters.sizes.has(s.sizeDisplay)) return false;
    }
    if (filters.sources && filters.sources.size > 0) {
      if (!filters.sources.has(s.source)) return false;
    }
    if (filters.hasDarkvision === true) {
      if (!s.darkvision) return false;
    }
    return true;
  });
}

function toggleInSet<T>(set: Set<T> | undefined, value: T): Set<T> {
  const next = new Set(set ?? []);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function useSpeciesFilters(species: SpeciesData[]) {
  const [filters, setFilters] = useState<SpeciesFilterState>({});

  const filtered = useMemo(() => applySpeciesFilters(species, filters), [species, filters]);

  const hasActiveFilters = useMemo(
    () =>
      (filters.sizes?.size ?? 0) > 0 ||
      (filters.sources?.size ?? 0) > 0 ||
      filters.hasDarkvision === true,
    [filters]
  );

  return {
    filters,
    filtered,
    hasActiveFilters,
    toggleSize: (size: string) =>
      setFilters((f) => ({ ...f, sizes: toggleInSet(f.sizes, size) })),
    toggleDarkvision: () =>
      setFilters((f) => ({ ...f, hasDarkvision: f.hasDarkvision ? undefined : true })),
    setSources: (sources: string[]) =>
      setFilters((f) => ({ ...f, sources: new Set(sources) })),
    clearAll: () => setFilters({}),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && npx vitest --run src/hooks/useSpeciesFilters.test.ts
```

- [ ] **Step 5: Write failing test for species search**

Create `app/src/hooks/useSpeciesSearch.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { filterSpeciesBySearch } from "./useSpeciesSearch";
import type { SpeciesData } from "../data/speciesTypes";

function makeSpecies(name: string): SpeciesData {
  return {
    id: name.toLowerCase(),
    name,
    source: "PHB",
    size: ["M"],
    sizeDisplay: "Medium",
    speed: { walk: 30 },
    speedDisplay: "30 ft.",
    darkvision: null,
    traits: [],
  };
}

describe("filterSpeciesBySearch", () => {
  const species = [makeSpecies("Dragonborn"), makeSpecies("Human"), makeSpecies("Elf")];

  it("returns all when query is empty", () => {
    expect(filterSpeciesBySearch(species, "")).toEqual(species);
  });

  it("filters by name substring", () => {
    const result = filterSpeciesBySearch(species, "drag");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Dragonborn");
  });

  it("is case-insensitive", () => {
    expect(filterSpeciesBySearch(species, "ELF")).toHaveLength(1);
  });
});
```

- [ ] **Step 6: Write species search implementation**

Create `app/src/hooks/useSpeciesSearch.ts`:

```typescript
import { useState, useMemo } from "react";
import type { SpeciesData } from "../data/speciesTypes";

export function filterSpeciesBySearch(species: SpeciesData[], query: string): SpeciesData[] {
  if (!query.trim()) return species;
  const q = query.toLowerCase();
  return species.filter((s) => s.name.toLowerCase().includes(q));
}

export function useSpeciesSearch(species: SpeciesData[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filterSpeciesBySearch(species, query), [species, query]);
  return { query, setQuery, results };
}
```

- [ ] **Step 7: Run all new tests**

```bash
cd app && npx vitest --run src/hooks/useSpeciesFilters.test.ts src/hooks/useSpeciesSearch.test.ts
```

Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add app/src/hooks/useSpeciesFilters.ts app/src/hooks/useSpeciesFilters.test.ts \
       app/src/hooks/useSpeciesSearch.ts app/src/hooks/useSpeciesSearch.test.ts
git commit -m "feat(species): add filter and search hooks with tests"
```

---

### Task 6: Species UI components

**Files:**
- Create: `app/src/components/species/SpeciesRow.tsx`
- Create: `app/src/components/species/SpeciesList.tsx`
- Create: `app/src/components/species/SpeciesDetail.tsx`
- Create: `app/src/components/species/SpeciesListView.tsx`
- Create: `app/src/components/species/SpeciesFilters.tsx`

These follow the same patterns as the Spell components. No dedicated tests for UI at this level — the existing pattern doesn't have them either (except for SpellDescription rendering). Focus tests on data/hooks.

- [ ] **Step 1: Create SpeciesRow component**

Create `app/src/components/species/SpeciesRow.tsx`:

```typescript
import type { SpeciesData } from "../../data/speciesTypes";

interface SpeciesRowProps {
  species: SpeciesData;
  selected: boolean;
  onClick: () => void;
  even: boolean;
}

export function SpeciesRow({ species, selected, onClick, even }: SpeciesRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-3 px-4 text-left"
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
        style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}
      >
        {species.name}
      </span>

      {/* Desktop metadata */}
      <span
        className="hidden sm:flex items-center gap-2"
        style={{ fontSize: "11px", color: "var(--text-secondary)", flexShrink: 0 }}
      >
        <span>{species.sizeDisplay}</span>
        <span>{species.speedDisplay}</span>
        {species.darkvision && <span>DV {species.darkvision}</span>}
      </span>

      {/* Mobile metadata */}
      <span
        className="sm:hidden"
        style={{ fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}
      >
        {species.sizeDisplay}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Create SpeciesList component**

Create `app/src/components/species/SpeciesList.tsx`:

Copy `SpellList.tsx` and make these substitutions:
- Import `SpeciesRow` instead of `SpellRow`
- Import `SpeciesData` instead of `SpellData`
- Interface props: `spells` → `species: SpeciesData[]`
- `spells.length` → `species.length`, `spells[idx]` → `species[idx]`
- Map over `species` instead of `spells`
- Use `SpeciesRow` with `species={item}` prop instead of `spell={item}`
- Empty state message: "No species match your filters"
- Keep identical keyboard navigation (ArrowUp/Down/Enter) and scroll behavior

- [ ] **Step 3: Create SpeciesDetail component**

Create `app/src/components/species/SpeciesDetail.tsx`:

Copy the structure of `SpellDetail.tsx` but replace spell-specific content. The component receives `species: SpeciesData`, `onClose`, `onPrev?`, `onNext?` props.

Layout (top to bottom inside the slide-in panel):
1. **Top bar** (48px height): ← button calling `onClose`, species name in DM Sans 18px bold, source text on the right
2. **Header band**: species name large, source below (no school color — use `var(--accent-primary)` as accent)
3. **Stats grid** (reuse `SpellStatsGrid` pattern — 2x2 grid):
   - Size: `species.sizeDisplay`
   - Speed: `species.speedDisplay`
   - Darkvision: `species.darkvision ? species.darkvision + " ft." : "—"`
   - Source: `species.source`
4. **Divider** (1px border-subtle)
5. **Traits section**: `<SpellDescription entries={species.traits} schoolColor="var(--accent-primary)" />`
6. **Footer**: Source + page

Keep the same keyboard handler (Escape/Backspace → close, ArrowUp → prev, ArrowDown → next), same slide-in animation, same backdrop.

- [ ] **Step 4: Create SpeciesFilters component**

Create `app/src/components/species/SpeciesFilters.tsx`:

Props: `filters`, `toggleSize`, `toggleDarkvision`, `setSources`, `allSources`, `hasActiveFilters`, `onClearAll`.

Layout (horizontal row, same style as `SpellFilters.tsx`):
- **Size pills**: "Small", "Medium", "Large" — each a toggleable button styled like the level pills in SpellFilters (active = `var(--accent-primary)` background)
- **Darkvision toggle**: single pill "Darkvision" using same toggle style
- **Source dropdown**: `<MultiDropdown label="Source" options={allSources} selected={[...filters.sources]} onChange={setSources} />`
- **Clear button**: shown when `hasActiveFilters` is true, calls `onClearAll`

- [ ] **Step 5: Create SpeciesListView component**

Create `app/src/components/species/SpeciesListView.tsx`:

Copy `SpellListView.tsx` and make these substitutions:
- Imports: `useSpeciesStore`, `useSpeciesFilters`, `useSpeciesSearch`, `SpeciesFilters`, `SpeciesList`, `SpeciesDetail` instead of spell equivalents
- Remove `useSavedSpellsStore` — species don't have save/unsave (yet)
- Remove the All/Saved toggle and Clear All button from the header
- `useParams<{ speciesId?: string }>()` instead of `spellId`
- Title text: "Species" instead of "Spells"
- Count text: `results.length.toLocaleString() + " species"` 
- Navigate to `/species/${species.id}` on select
- Navigate to `/species` on detail close
- Loading text: "Loading species…"
- Search placeholder: "Search species…" (inline the search input same as SpellSearch pattern)
- Wire `SpeciesFilters` props from `useSpeciesFilters` return values (pass `allSources` from `useSpeciesStore.allSources()`)
- `SpeciesDetail` overlay shown when `selectedSpecies` is found in results
- Keep "/" keyboard shortcut for search focus

- [ ] **Step 6: Add route to App.tsx**

Modify `app/src/App.tsx` — add species routes:

```typescript
import { SpeciesListView } from "./components/species/SpeciesListView";

// Add to router:
{ path: "/species", element: <SpeciesListView /> },
{ path: "/species/:speciesId", element: <SpeciesListView /> },
```

- [ ] **Step 7: Update LandingPage entries**

Modify `app/src/components/landing/LandingPage.tsx` — update the ENTRIES array:

Change the bestiary entry description from "coming soon" and add species, classes, feats entries:

```typescript
const ENTRIES: Entry[] = [
  { id: "spells", label: "spells", description: "reference", active: true, to: "/spells" },
  { id: "species", label: "species", description: "reference", active: true, to: "/species" },
  { id: "classes", label: "classes", description: "coming soon", active: false },
  { id: "feats", label: "feats", description: "coming soon", active: false },
  { id: "bestiary", label: "bestiary", description: "coming soon", active: false },
  { id: "items", label: "items", description: "coming soon", active: false },
];
```

- [ ] **Step 7b: Update LandingPage.test.tsx for new active entries**

Modify `app/src/components/landing/LandingPage.test.tsx`:

The existing test "renders bestiary and items as inactive entries" just checks the text exists — it will still pass since "bestiary" text is still rendered. But we should also verify the species link is active:

```typescript
  it("renders the species link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /species/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/species");
  });
```

Also update the "renders coming soon text for inactive entries" test — it should still pass since classes, feats, bestiary, and items still show "coming soon".

- [ ] **Step 8: Verify app runs with species section working**

```bash
cd app && npm run dev
# Manually test: navigate to species page, verify list loads, search works, detail opens
```

- [ ] **Step 9: Run full test suite**

```bash
cd app && npx vitest --run
```

Expected: All tests pass (existing 202 + new species tests).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(species): add UI components, routing, and landing page entry"
```

---

## Chunk 2: Feats

### Task 7: Feat types

**Files:**
- Create: `app/src/data/featTypes.ts`

- [ ] **Step 1: Write feat type definitions**

Create `app/src/data/featTypes.ts`:

```typescript
import type { SpellEntry } from "./spellTypes";

export interface FeatData {
  id: string;
  name: string;
  source: string;
  category: string | null;       // "G" (General), "EB" (Epic Boon), "FS" (Fighting Style), etc.
  categoryDisplay: string;
  prerequisite: string | null;    // Human-readable prerequisite text
  entries: SpellEntry[];
  page?: number;
}

export interface RawFeat {
  name: string;
  source: string;
  page?: number;
  category?: string;
  prerequisite?: RawPrerequisite[];
  entries?: SpellEntry[];
  _copy?: unknown;
}

export interface RawPrerequisite {
  level?: number | { level: number; class?: { name: string } };
  race?: { name: string; displayEntry?: string }[];
  ability?: Record<string, number>[];
  spellcasting?: boolean;
  spellcasting2020?: boolean;
  feat?: string[];
  other?: string;
  campaign?: string[];
  otherSummary?: { entry: string };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/data/featTypes.ts
git commit -m "feat(feats): add type definitions"
```

---

### Task 8: Feat loader

**Files:**
- Create: `app/src/data/featLoader.ts`
- Create: `app/src/data/featLoader.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/data/featLoader.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildFeatId,
  normalizeFeatCategory,
  normalizePrerequisite,
  normalizeFeat,
} from "./featLoader";

describe("buildFeatId", () => {
  it("creates URL-safe slug", () => {
    expect(buildFeatId("Great Weapon Master", "XPHB")).toBe("great-weapon-master_xphb");
  });
});

describe("normalizeFeatCategory", () => {
  it("maps known category codes", () => {
    expect(normalizeFeatCategory("G")).toBe("General");
    expect(normalizeFeatCategory("EB")).toBe("Epic Boon");
    expect(normalizeFeatCategory("FS")).toBe("Fighting Style");
    expect(normalizeFeatCategory("OF")).toBe("Origin");
  });

  it("returns Other for unknown", () => {
    expect(normalizeFeatCategory(undefined)).toBe("Other");
  });
});

describe("normalizePrerequisite", () => {
  it("returns null for no prerequisites", () => {
    expect(normalizePrerequisite(undefined)).toBeNull();
  });

  it("extracts level prerequisite", () => {
    expect(normalizePrerequisite([{ level: 4 }])).toBe("Level 4+");
  });

  it("extracts ability prerequisite", () => {
    const result = normalizePrerequisite([{ ability: [{ str: 13 }] }]);
    expect(result).toBe("Strength 13+");
  });

  it("extracts spellcasting prerequisite", () => {
    expect(normalizePrerequisite([{ spellcasting: true }])).toBe("Spellcasting");
  });
});

describe("normalizeFeat", () => {
  it("normalizes a raw feat", () => {
    const raw = {
      name: "Alert",
      source: "XPHB",
      page: 200,
      category: "OF",
      entries: ["You gain the following benefits."],
    };
    const result = normalizeFeat(raw);
    expect(result.id).toBe("alert_xphb");
    expect(result.categoryDisplay).toBe("Origin");
    expect(result.prerequisite).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd app && npx vitest --run src/data/featLoader.test.ts
```

- [ ] **Step 3: Write feat loader implementation**

Create `app/src/data/featLoader.ts`:

```typescript
import type { FeatData, RawFeat, RawPrerequisite } from "./featTypes";

// ── ID ────────────────────────────────────────────────────────────────────────

export function buildFeatId(name: string, source: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug(name)}_${slug(source)}`;
}

// ── Category ──────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  G: "General",
  G4: "General (4th Level)",
  G8: "General (8th Level)",
  G12: "General (12th Level)",
  G16: "General (16th Level)",
  EB: "Epic Boon",
  FS: "Fighting Style",
  OF: "Origin",
  D: "Dragonmark",
};

export function normalizeFeatCategory(category: string | undefined): string {
  if (!category) return "Other";
  return CATEGORY_MAP[category] ?? "Other";
}

// ── Prerequisites ─────────────────────────────────────────────────────────────

const ABILITY_NAMES: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export function normalizePrerequisite(prereqs: RawPrerequisite[] | undefined): string | null {
  if (!prereqs || prereqs.length === 0) return null;

  const parts: string[] = [];
  for (const prereq of prereqs) {
    if (prereq.level) {
      if (typeof prereq.level === "number") {
        parts.push(`Level ${prereq.level}+`);
      } else {
        const lvl = prereq.level.level;
        const cls = prereq.level.class?.name;
        parts.push(cls ? `${cls} Level ${lvl}+` : `Level ${lvl}+`);
      }
    }
    if (prereq.ability) {
      for (const abilityReq of prereq.ability) {
        for (const [key, val] of Object.entries(abilityReq)) {
          parts.push(`${ABILITY_NAMES[key] ?? key} ${val}+`);
        }
      }
    }
    if (prereq.spellcasting || prereq.spellcasting2020) {
      parts.push("Spellcasting");
    }
    if (prereq.race) {
      const raceNames = prereq.race.map((r) => r.displayEntry ?? r.name);
      parts.push(raceNames.join(" or "));
    }
    if (prereq.feat) {
      parts.push(prereq.feat.join(", "));
    }
    if (prereq.other) {
      parts.push(prereq.other);
    }
    if (prereq.otherSummary) {
      parts.push(prereq.otherSummary.entry);
    }
  }

  return parts.length > 0 ? parts.join("; ") : null;
}

// ── Feat normalizer ───────────────────────────────────────────────────────────

export function normalizeFeat(raw: RawFeat): FeatData {
  return {
    id: buildFeatId(raw.name, raw.source),
    name: raw.name,
    source: raw.source,
    category: raw.category ?? null,
    categoryDisplay: normalizeFeatCategory(raw.category),
    prerequisite: normalizePrerequisite(raw.prerequisite),
    entries: raw.entries ?? [],
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Dedup ─────────────────────────────────────────────────────────────────────

const SOURCE_PRIORITY: Record<string, number> = {
  XPHB: 100,
  EFA: 90,
  TCE: 50,
  XGE: 40,
  PHB: 10,
};

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loadAllFeats(
  basePath: string = "/data"
): Promise<{ feats: FeatData[]; warnings: string[] }> {
  const res = await fetch(`${basePath}/feats.json`);
  if (!res.ok) throw new Error(`Failed to fetch feats.json: ${res.status}`);

  const data = await res.json();
  const rawFeats: RawFeat[] = data.feat ?? [];

  const allFeats: FeatData[] = [];
  const warnings: string[] = [];

  for (const raw of rawFeats) {
    if (raw._copy) continue;
    try {
      allFeats.push(normalizeFeat(raw));
    } catch (e) {
      warnings.push(`Failed to normalize feat "${raw?.name}": ${e}`);
    }
  }

  // Deduplicate
  const deduped = new Map<string, FeatData>();
  for (const feat of allFeats) {
    const key = feat.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, feat);
    } else {
      const ep = SOURCE_PRIORITY[existing.source] ?? 30;
      const np = SOURCE_PRIORITY[feat.source] ?? 30;
      if (np > ep) deduped.set(key, feat);
    }
  }

  const result = Array.from(deduped.values());
  result.sort((a, b) => a.name.localeCompare(b.name));

  return { feats: result, warnings };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd app && npx vitest --run src/data/featLoader.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add app/src/data/featTypes.ts app/src/data/featLoader.ts app/src/data/featLoader.test.ts
git commit -m "feat(feats): add types and loader with tests"
```

---

### Task 9: Feat store, hooks, and UI

**Files:**
- Create: `app/src/store/useFeatStore.ts`
- Create: `app/src/hooks/useFeatFilters.ts`
- Create: `app/src/hooks/useFeatSearch.ts`
- Create: `app/src/components/feats/FeatRow.tsx`
- Create: `app/src/components/feats/FeatList.tsx`
- Create: `app/src/components/feats/FeatDetail.tsx`
- Create: `app/src/components/feats/FeatFilters.tsx`
- Create: `app/src/components/feats/FeatListView.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/landing/LandingPage.tsx`

Follow the exact same patterns as Species (Tasks 4-6). Key differences:

**Feat filters:**
- Category (General, Epic Boon, Fighting Style, Origin, etc.) — toggleable pills
- Source — MultiDropdown
- Has Prerequisite — toggle

**FeatRow displays:** name, category, prerequisite (truncated)

**FeatDetail displays:**
- Name, category badge, prerequisite block
- Entries rendered with SpellDescription
- Source info

- [ ] **Step 1: Create feat store** (`app/src/store/useFeatStore.ts`)

Same pattern as `useSpeciesStore`. Store has: `feats`, `loading`, `error`, `warnings`, `loadFeats()`, `allSources()`, `allCategories()`.

- [ ] **Step 2: Create feat filter hook** (`app/src/hooks/useFeatFilters.ts`)

Filter by: `categories` (Set<string>), `sources` (Set<string>), `hasPrerequisite` (boolean).

- [ ] **Step 3: Create feat search hook** (`app/src/hooks/useFeatSearch.ts`)

Same pattern as species search.

- [ ] **Step 4: Create FeatRow** (`app/src/components/feats/FeatRow.tsx`)

Props: `feat: FeatData`, `selected`, `onClick`, `even`. Same button structure as SpeciesRow.
- Name (flex-1 truncate, 13px)
- Desktop metadata (hidden sm:flex): category badge + prerequisite text (truncated to 30 chars)
- Mobile metadata (sm:hidden): category only

- [ ] **Step 4b: Create FeatList** (`app/src/components/feats/FeatList.tsx`)

Copy SpeciesList, substitute `FeatData` for `SpeciesData`, `FeatRow` for `SpeciesRow`, `feat` prop for `species`. Empty message: "No feats match your filters".

- [ ] **Step 4c: Create FeatFilters** (`app/src/components/feats/FeatFilters.tsx`)

Props: `filters`, `toggleCategory`, `toggleHasPrerequisite`, `setSources`, `allSources`, `allCategories`, `hasActiveFilters`, `onClearAll`.

Layout:
- **Category pills**: one per category from `allCategories` (General, Origin, Epic Boon, Fighting Style, etc.)
- **Prerequisite toggle**: "Has Prerequisite" pill
- **Source dropdown**: `<MultiDropdown ...>`
- **Clear button**

- [ ] **Step 4d: Create FeatDetail** (`app/src/components/feats/FeatDetail.tsx`)

Props: `feat: FeatData`, `onClose`, `onPrev?`, `onNext?`. Same slide-in panel as SpeciesDetail.

Layout:
1. Top bar: ← close button, feat name, category badge on the right
2. Category badge: colored pill (use accent color based on category)
3. Prerequisite block (only if `feat.prerequisite`): bordered left, bg-panel, shows prerequisite text
4. Entries: `<SpellDescription entries={feat.entries} schoolColor="var(--accent-primary)" />`
5. Footer: Source + page

- [ ] **Step 4e: Create FeatListView** (`app/src/components/feats/FeatListView.tsx`)

Copy SpeciesListView pattern. Key differences:
- Uses `useFeatStore`, `useFeatFilters`, `useFeatSearch`
- Title: "Feats"
- Count: `results.length + " feats"`
- Route param: `featId`
- Navigate to `/feats/${feat.id}` on select
- Wire `FeatFilters` with `allCategories` from store's `allCategories()`

- [ ] **Step 5: Add routes to App.tsx**

```typescript
import { FeatListView } from "./components/feats/FeatListView";
// Add routes:
{ path: "/feats", element: <FeatListView /> },
{ path: "/feats/:featId", element: <FeatListView /> },
```

- [ ] **Step 6: Update LandingPage**

Change feats entry to `active: true, to: "/feats"`.

- [ ] **Step 6b: Update LandingPage.test.tsx for feats**

Add a test to verify the feats link is rendered:

```typescript
  it("renders the feats link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /feats/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/feats");
  });
```

- [ ] **Step 7: Run full test suite**

```bash
cd app && npx vitest --run
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(feats): add store, hooks, UI components, routing"
```

---

## Chunk 3: Bestiary

### Task 10: Bestiary types

**Files:**
- Create: `app/src/data/bestiaryTypes.ts`

- [ ] **Step 1: Write bestiary type definitions**

Create `app/src/data/bestiaryTypes.ts`:

```typescript
import type { SpellEntry } from "./spellTypes";

export interface MonsterData {
  id: string;
  name: string;
  source: string;
  size: string[];
  sizeDisplay: string;
  type: string;                    // "aberration", "beast", "humanoid", etc.
  typeDisplay: string;             // "Aberration", "Beast (aarakocra)", etc.
  alignment: string;
  ac: string;                      // "12" or "15 (natural armor)"
  hp: string;                      // "13 (3d8)" or special text
  speed: string;                   // "30 ft., fly 50 ft."
  abilities: MonsterAbilities;
  cr: string;                      // "1/4", "1", "30"
  crNumber: number;                // Numeric for sorting/filtering: 0.25, 1, 30
  traits: MonsterFeature[];
  actions: MonsterFeature[];
  legendaryActions: MonsterFeature[];
  reactions: MonsterFeature[];
  senses: string;
  languages: string;
  skills: string;
  saves: string;
  immune: string;
  resist: string;
  conditionImmune: string;
  environment: string[];
  page?: number;
}

export interface MonsterAbilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface MonsterFeature {
  name: string;
  entries: SpellEntry[];
}

export interface RawMonster {
  name: string;
  source: string;
  page?: number;
  size?: string[];
  type?: string | { type: string; tags?: (string | { tag: string; prefix?: string })[] };
  alignment?: (string | { alignment: string[] })[];
  ac?: (number | { ac: number; from?: string[]; special?: string })[];
  hp?: { average?: number; formula?: string; special?: string };
  speed?: Record<string, number | { number: number; condition?: string }>;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  cr?: string | { cr: string };
  trait?: { name: string; entries: SpellEntry[] }[];
  action?: { name: string; entries: SpellEntry[] }[];
  legendary?: { name: string; entries: SpellEntry[] }[];
  reaction?: { name: string; entries: SpellEntry[] }[];
  senses?: string[];
  passive?: number;
  languages?: string[];
  skill?: Record<string, string>;
  save?: Record<string, string>;
  immune?: (string | { immune: string[] })[];
  resist?: (string | { resist: string[] })[];
  conditionImmune?: (string | { conditionImmune: string[] })[];
  environment?: string[];
  _copy?: unknown;
  reprintedAs?: string[];
}

export interface RawBestiaryIndex {
  [sourceAbbr: string]: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/data/bestiaryTypes.ts
git commit -m "feat(bestiary): add type definitions"
```

---

### Task 11: Bestiary loader

**Files:**
- Create: `app/src/data/bestiaryLoader.ts`
- Create: `app/src/data/bestiaryLoader.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/data/bestiaryLoader.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildMonsterId,
  normalizeMonsterType,
  normalizeMonsterAC,
  normalizeMonsterHP,
  normalizeMonsterSpeed,
  normalizeMonsterCR,
  normalizeMonster,
} from "./bestiaryLoader";

describe("buildMonsterId", () => {
  it("creates slug from name and source", () => {
    expect(buildMonsterId("Aarakocra", "MM")).toBe("aarakocra_mm");
  });
});

describe("normalizeMonsterType", () => {
  it("handles string type", () => {
    expect(normalizeMonsterType("beast")).toBe("Beast");
  });

  it("handles object type with tags", () => {
    expect(
      normalizeMonsterType({ type: "humanoid", tags: ["aarakocra"] })
    ).toBe("Humanoid (aarakocra)");
  });

  it("handles object type with object tags", () => {
    expect(
      normalizeMonsterType({ type: "humanoid", tags: [{ tag: "elf", prefix: "high" }] })
    ).toBe("Humanoid (high elf)");
  });
});

describe("normalizeMonsterAC", () => {
  it("handles simple number", () => {
    expect(normalizeMonsterAC([12])).toBe("12");
  });

  it("handles object with from", () => {
    expect(normalizeMonsterAC([{ ac: 15, from: ["natural armor"] }])).toBe("15 (natural armor)");
  });

  it("handles object with special", () => {
    expect(normalizeMonsterAC([{ special: "11 + spell level" }])).toBe("11 + spell level");
  });
});

describe("normalizeMonsterHP", () => {
  it("handles average and formula", () => {
    expect(normalizeMonsterHP({ average: 13, formula: "3d8" })).toBe("13 (3d8)");
  });

  it("handles special", () => {
    expect(normalizeMonsterHP({ special: "40 + 10 per level" })).toBe("40 + 10 per level");
  });
});

describe("normalizeMonsterSpeed", () => {
  it("handles walk-only", () => {
    expect(normalizeMonsterSpeed({ walk: 30 })).toBe("30 ft.");
  });

  it("handles walk + fly", () => {
    expect(normalizeMonsterSpeed({ walk: 20, fly: 50 })).toBe("20 ft., fly 50 ft.");
  });

  it("handles nested fly object", () => {
    expect(normalizeMonsterSpeed({ walk: 30, fly: { number: 30, condition: "(hover)" } })).toBe("30 ft., fly 30 ft.");
  });
});

describe("normalizeMonsterCR", () => {
  it("handles string CR", () => {
    expect(normalizeMonsterCR("1/4")).toEqual({ cr: "1/4", crNumber: 0.25 });
  });

  it("handles object CR", () => {
    expect(normalizeMonsterCR({ cr: "5" })).toEqual({ cr: "5", crNumber: 5 });
  });

  it("handles 0", () => {
    expect(normalizeMonsterCR("0")).toEqual({ cr: "0", crNumber: 0 });
  });
});

describe("normalizeMonster", () => {
  it("normalizes a raw monster", () => {
    const raw = {
      name: "Goblin",
      source: "MM",
      page: 166,
      size: ["S"],
      type: "humanoid",
      ac: [15],
      hp: { average: 7, formula: "2d6" },
      speed: { walk: 30 },
      str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
      cr: "1/4",
      action: [{ name: "Scimitar", entries: ["{@atk mw} ..."] }],
    };
    const result = normalizeMonster(raw);
    expect(result.id).toBe("goblin_mm");
    expect(result.typeDisplay).toBe("Humanoid");
    expect(result.ac).toBe("15");
    expect(result.crNumber).toBe(0.25);
    expect(result.actions).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd app && npx vitest --run src/data/bestiaryLoader.test.ts
```

- [ ] **Step 3: Write bestiary loader implementation**

Create `app/src/data/bestiaryLoader.ts`:

```typescript
import type {
  MonsterData,
  MonsterFeature,
  RawMonster,
  RawBestiaryIndex,
} from "./bestiaryTypes";

// ── ID ────────────────────────────────────────────────────────────────────────

export function buildMonsterId(name: string, source: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug(name)}_${slug(source)}`;
}

// ── Size ──────────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<string, string> = {
  T: "Tiny", S: "Small", M: "Medium", L: "Large", H: "Huge", G: "Gargantuan",
};

function normalizeSize(sizes: string[] | undefined): { size: string[]; display: string } {
  if (!sizes || sizes.length === 0) return { size: ["M"], display: "Medium" };
  return { size: sizes, display: sizes.map((s) => SIZE_MAP[s] ?? s).join(" or ") };
}

// ── Type ──────────────────────────────────────────────────────────────────────

export function normalizeMonsterType(
  type: string | { type: string; tags?: (string | { tag: string; prefix?: string })[] } | undefined
): string {
  if (!type) return "Unknown";
  if (typeof type === "string") {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  const base = type.type.charAt(0).toUpperCase() + type.type.slice(1);
  if (!type.tags || type.tags.length === 0) return base;

  const tagStrs = type.tags.map((t) =>
    typeof t === "string" ? t : `${t.prefix ? t.prefix + " " : ""}${t.tag}`
  );
  return `${base} (${tagStrs.join(", ")})`;
}

// ── AC ────────────────────────────────────────────────────────────────────────

export function normalizeMonsterAC(
  ac: (number | { ac?: number; from?: string[]; special?: string })[] | undefined
): string {
  if (!ac || ac.length === 0) return "—";
  const first = ac[0];
  if (typeof first === "number") return String(first);
  if (first.special) return first.special;
  const base = first.ac ?? 10;
  if (first.from && first.from.length > 0) {
    return `${base} (${first.from.join(", ")})`;
  }
  return String(base);
}

// ── HP ────────────────────────────────────────────────────────────────────────

export function normalizeMonsterHP(
  hp: { average?: number; formula?: string; special?: string } | undefined
): string {
  if (!hp) return "—";
  if (hp.special) return hp.special;
  if (hp.average != null && hp.formula) return `${hp.average} (${hp.formula})`;
  if (hp.average != null) return String(hp.average);
  return "—";
}

// ── Speed ─────────────────────────────────────────────────────────────────────

export function normalizeMonsterSpeed(
  speed: Record<string, number | { number: number; condition?: string }> | undefined
): string {
  if (!speed) return "0 ft.";
  const parts: string[] = [];

  const extractNum = (v: number | { number: number; condition?: string }) =>
    typeof v === "number" ? v : v.number;

  if (speed.walk != null) parts.push(`${extractNum(speed.walk)} ft.`);
  if (speed.fly != null) parts.push(`fly ${extractNum(speed.fly)} ft.`);
  if (speed.swim != null) parts.push(`swim ${extractNum(speed.swim)} ft.`);
  if (speed.climb != null) parts.push(`climb ${extractNum(speed.climb)} ft.`);
  if (speed.burrow != null) parts.push(`burrow ${extractNum(speed.burrow)} ft.`);

  return parts.length > 0 ? parts.join(", ") : "0 ft.";
}

// ── CR ────────────────────────────────────────────────────────────────────────

const CR_TO_NUM: Record<string, number> = {
  "0": 0, "1/8": 0.125, "1/4": 0.25, "1/2": 0.5,
};

export function normalizeMonsterCR(
  cr: string | { cr: string } | undefined
): { cr: string; crNumber: number } {
  if (!cr) return { cr: "—", crNumber: -1 };
  const crStr = typeof cr === "string" ? cr : cr.cr;
  const crNum = CR_TO_NUM[crStr] ?? Number(crStr);
  return { cr: crStr, crNumber: isNaN(crNum) ? -1 : crNum };
}

// ── Alignment ─────────────────────────────────────────────────────────────────

const ALIGNMENT_MAP: Record<string, string> = {
  L: "Lawful", N: "Neutral", C: "Chaotic", G: "Good", E: "Evil",
  A: "Any", U: "Unaligned", NX: "Neutral",
};

function normalizeAlignment(
  alignment: (string | { alignment: string[] })[] | undefined
): string {
  if (!alignment || alignment.length === 0) return "Unaligned";
  const parts: string[] = [];
  for (const a of alignment) {
    if (typeof a === "string") {
      parts.push(ALIGNMENT_MAP[a] ?? a);
    }
  }
  return parts.join(" ") || "Unaligned";
}

// ── Damage/Condition lists ────────────────────────────────────────────────────

function normalizeDamageList(
  items: (string | { immune?: string[]; resist?: string[]; conditionImmune?: string[] })[] | undefined
): string {
  if (!items || items.length === 0) return "";
  const parts: string[] = [];
  for (const item of items) {
    if (typeof item === "string") parts.push(item);
    else {
      const inner = item.immune ?? item.resist ?? item.conditionImmune ?? [];
      parts.push(inner.join(", "));
    }
  }
  return parts.join(", ");
}

// ── Feature list ──────────────────────────────────────────────────────────────

function normalizeFeatures(
  features: { name: string; entries: any[] }[] | undefined
): MonsterFeature[] {
  if (!features) return [];
  return features.map((f) => ({ name: f.name, entries: f.entries ?? [] }));
}

// ── Full normalizer ───────────────────────────────────────────────────────────

export function normalizeMonster(raw: RawMonster): MonsterData {
  const id = buildMonsterId(raw.name, raw.source);
  const { size, display: sizeDisplay } = normalizeSize(raw.size);
  const typeDisplay = normalizeMonsterType(raw.type);
  const typeBase = typeof raw.type === "string" ? raw.type : raw.type?.type ?? "unknown";

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
    ...normalizeMonsterCR(raw.cr),
    traits: normalizeFeatures(raw.trait),
    actions: normalizeFeatures(raw.action),
    legendaryActions: normalizeFeatures(raw.legendary),
    reactions: normalizeFeatures(raw.reaction),
    senses: [...(raw.senses ?? []), `passive Perception ${raw.passive ?? 10}`].join(", "),
    languages: (raw.languages ?? []).join(", ") || "—",
    skills: raw.skill ? Object.entries(raw.skill).map(([k, v]) => `${k} ${v}`).join(", ") : "",
    saves: raw.save ? Object.entries(raw.save).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(", ") : "",
    immune: normalizeDamageList(raw.immune),
    resist: normalizeDamageList(raw.resist),
    conditionImmune: normalizeDamageList(raw.conditionImmune),
    environment: raw.environment ?? [],
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Loader ────────────────────────────────────────────────────────────────────

const SOURCE_PRIORITY: Record<string, number> = {
  XPHB: 100, XMM: 95, XDMG: 90, MPMM: 80, VGM: 40, MM: 30,
};

export async function loadAllMonsters(
  basePath: string = "/data/bestiary"
): Promise<{ monsters: MonsterData[]; warnings: string[] }> {
  const indexRes = await fetch(`${basePath}/index.json`);
  if (!indexRes.ok) throw new Error(`Failed to fetch bestiary index: ${indexRes.status}`);

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
        if (raw._copy) continue;
        try {
          allMonsters.push(normalizeMonster(raw));
        } catch (e) {
          warnings.push(`Failed to normalize monster "${raw?.name}": ${e}`);
        }
      }
    } else {
      warnings.push(`Failed to load bestiary file for ${entries[i][0]}: ${result.reason}`);
    }
  }

  // Deduplicate
  const deduped = new Map<string, MonsterData>();
  for (const monster of allMonsters) {
    const key = monster.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, monster);
    } else {
      const ep = SOURCE_PRIORITY[existing.source] ?? 20;
      const np = SOURCE_PRIORITY[monster.source] ?? 20;
      if (np > ep) deduped.set(key, monster);
    }
  }

  const result = Array.from(deduped.values());
  result.sort((a, b) => a.name.localeCompare(b.name));

  return { monsters: result, warnings };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd app && npx vitest --run src/data/bestiaryLoader.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add app/src/data/bestiaryTypes.ts app/src/data/bestiaryLoader.ts app/src/data/bestiaryLoader.test.ts
git commit -m "feat(bestiary): add types and loader with tests"
```

---

### Task 12: Bestiary store, hooks, and UI

**Files:**
- Create: `app/src/store/useBestiaryStore.ts`
- Create: `app/src/hooks/useBestiaryFilters.ts`
- Create: `app/src/hooks/useBestiarySearch.ts`
- Create: `app/src/components/bestiary/MonsterRow.tsx`
- Create: `app/src/components/bestiary/MonsterList.tsx`
- Create: `app/src/components/bestiary/MonsterDetail.tsx`
- Create: `app/src/components/bestiary/BestiaryFilters.tsx`
- Create: `app/src/components/bestiary/BestiaryListView.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/landing/LandingPage.tsx`

**Bestiary filters:**
- CR range (pills for 0, 1/8, 1/4, 1/2, 1-5, 6-10, 11-16, 17-20, 21+)
- Type (Aberration, Beast, Celestial, etc.) — pills or MultiDropdown
- Size — pills
- Source — MultiDropdown
- Environment — MultiDropdown

**MonsterRow displays:** name, CR, type, size

**MonsterDetail is the richest view:**
- Name, type, alignment
- AC, HP, Speed
- Ability scores in a 6-column grid (STR/DEX/CON/INT/WIS/CHA with modifiers)
- Saves, Skills, Senses, Languages
- Damage immunities, resistances, condition immunities
- Traits section
- Actions section
- Reactions section (if any)
- Legendary Actions section (if any)
- Source, environment tags

- [ ] **Step 1: Create bestiary store** (`app/src/store/useBestiaryStore.ts`)

Same pattern as spell store. `monsters`, `loading`, `error`, `warnings`, `loadMonsters()`, `allSources()`, `allTypes()`, `allEnvironments()`.

- [ ] **Step 2: Create bestiary filter hook** (`app/src/hooks/useBestiaryFilters.ts`)

Filter state: `crRanges` (Set<string> of range labels), `types` (Set<string>), `sizes` (Set<string>), `sources` (Set<string>), `environments` (Set<string>).

- [ ] **Step 3: Create bestiary search hook** (`app/src/hooks/useBestiarySearch.ts`)

Same pattern. Search by monster name.

- [ ] **Step 4: Create MonsterRow component** (`app/src/components/bestiary/MonsterRow.tsx`)

Props: `monster: MonsterData`, `selected`, `onClick`, `even`. Same button structure as SpeciesRow.
- Name (flex-1 truncate, 13px)
- Desktop metadata (hidden sm:flex): CR badge, type, size
- Mobile metadata (sm:hidden): CR · type abbreviation (first 3 chars of type)

The CR badge should be styled with a subtle background: `var(--bg-raised)`, border-radius 2px, monospace font, 10px.

- [ ] **Step 5: Create MonsterList component** (`app/src/components/bestiary/MonsterList.tsx`)

Copy SpeciesList pattern. Substitute `MonsterData`, `MonsterRow`, `monster` prop. Empty message: "No creatures match your filters".

- [ ] **Step 6: Create MonsterDetail component** (`app/src/components/bestiary/MonsterDetail.tsx`)

Props: `monster: MonsterData`, `onClose`, `onPrev?`, `onNext?`.

This is the most complex detail view. Structure the slide-in panel as a classic D&D stat block:

```
┌──────────────────────────────────────┐
│ ← [Monster Name]           CR [X]   │  ← Top bar (48px)
├──────────────────────────────────────┤
│ [Size] [Type], [Alignment]           │  ← Type line
│──────────────────────────────────────│
│ AC: [ac]                             │  ← Properties
│ HP: [hp]                             │
│ Speed: [speed]                       │
│──────────────────────────────────────│
│ STR  DEX  CON  INT  WIS  CHA        │  ← Ability scores
│  10   14   10   10   12   11         │    (6 equal columns)
│ (+0) (+2) (+0) (+0) (+1) (+0)       │    with modifiers
│──────────────────────────────────────│
│ Saves: [saves]     (if non-empty)    │  ← Optional properties
│ Skills: [skills]   (if non-empty)    │
│ Damage Resistances: [resist]         │
│ Damage Immunities: [immune]          │
│ Condition Immunities: [condImmune]   │
│ Senses: [senses]                     │
│ Languages: [languages]               │
│──────────────────────────────────────│
│ ## Traits                            │  ← Each section uses
│ [trait.name]: [trait.entries...]      │    SpellDescription
│──────────────────────────────────────│
│ ## Actions                           │
│ [action.name]: [action.entries...]   │
│──────────────────────────────────────│
│ ## Reactions (if any)                │
│ [reaction entries...]                │
│──────────────────────────────────────│
│ ## Legendary Actions (if any)        │
│ [legendary entries...]               │
│──────────────────────────────────────│
│ Source: [source] p. [page]           │
│ Environment: [env tags]              │
└──────────────────────────────────────┘
```

Key implementation details:
- Ability score grid: 6 columns using `grid grid-cols-6 text-center`. Each cell shows abbreviation (STR etc) in `text-muted` 10px, score in `text-primary` 14px bold, modifier in `text-secondary` 11px. Modifier = `Math.floor((score - 10) / 2)`, format as `(+N)` or `(-N)`.
- Feature sections (traits, actions, reactions, legendary): map over array, render each feature's `name` in bold then entries with `<SpellDescription entries={feature.entries} schoolColor="var(--accent-danger)" />`. Use `var(--accent-danger)` as the accent color for bestiary.
- Only render sections that have content (e.g., skip Reactions if `monster.reactions.length === 0`).
- Same keyboard handler, slide-in animation, and backdrop as SpellDetail.

- [ ] **Step 7: Create BestiaryFilters component** (`app/src/components/bestiary/BestiaryFilters.tsx`)

Props: `filters`, `toggleCrRange`, `setTypes`, `toggleSize`, `setSources`, `setEnvironments`, `allTypes`, `allSources`, `allEnvironments`, `hasActiveFilters`, `onClearAll`.

Layout:
- **CR range pills**: "0", "⅛-½", "1-5", "6-10", "11-16", "17-20", "21+" — each a toggleable pill. The filter hook maps these labels to numeric ranges.
- **Size pills**: "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"
- **Type dropdown**: `<MultiDropdown label="Type" options={allTypes} ...>`
- **Source dropdown**: `<MultiDropdown label="Source" options={allSources} ...>`
- **Environment dropdown**: `<MultiDropdown label="Environment" options={allEnvironments} ...>`
- **Clear button**

- [ ] **Step 8: Create BestiaryListView component** (`app/src/components/bestiary/BestiaryListView.tsx`)

Copy SpeciesListView pattern. Key differences:
- Uses `useBestiaryStore`, `useBestiaryFilters`, `useBestiarySearch`
- Title: "Bestiary"
- Count: `results.length + " creatures"`
- Route param: `monsterId`
- Navigate to `/bestiary/${monster.id}` on select
- Wire `BestiaryFilters` with `allTypes`, `allSources`, `allEnvironments` from store
- Loading text: "Loading bestiary…" (this is the largest dataset, ~4400 monsters)

- [ ] **Step 9: Add routes to App.tsx**

```typescript
import { BestiaryListView } from "./components/bestiary/BestiaryListView";
// Add routes:
{ path: "/bestiary", element: <BestiaryListView /> },
{ path: "/bestiary/:monsterId", element: <BestiaryListView /> },
```

- [ ] **Step 10: Update LandingPage**

Change bestiary entry to `active: true, to: "/bestiary"`.

- [ ] **Step 10b: Update LandingPage.test.tsx for bestiary**

Add a test to verify the bestiary link is rendered:

```typescript
  it("renders the bestiary link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /bestiary/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/bestiary");
  });
```

Update the "renders coming soon text for inactive entries" test — now only "items" shows "coming soon":

```typescript
  it("renders coming soon text for inactive entries", () => {
    renderLanding();
    const comingSoon = screen.getAllByText("coming soon");
    expect(comingSoon.length).toBeGreaterThan(0);
  });
```

(This test still passes since "items" remains inactive.)

- [ ] **Step 11: Run full test suite**

```bash
cd app && npx vitest --run
```

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(bestiary): add store, hooks, UI components, routing"
```

---

## Chunk 4: Classes

### Task 13: Class types

**Files:**
- Create: `app/src/data/classTypes.ts`

- [ ] **Step 1: Write class type definitions**

Create `app/src/data/classTypes.ts`:

```typescript
import type { SpellEntry } from "./spellTypes";

export interface ClassData {
  id: string;
  name: string;
  source: string;
  hitDie: number;                  // 6, 8, 10, 12
  primaryAbility: string;          // "Intelligence", "Strength or Dexterity"
  savingThrows: string[];          // ["int", "wis"]
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillChoices: { from: string[]; count: number } | null;
  spellcastingAbility: string | null;
  casterProgression: string | null; // "full", "half", "third", "pact"
  subclasses: SubclassData[];
  classFeatures: ClassFeatureData[];
  page?: number;
}

export interface SubclassData {
  name: string;
  shortName: string;
  source: string;
}

export interface ClassFeatureData {
  name: string;
  level: number;
  entries: SpellEntry[];
  source: string;
}

export interface RawClass {
  name: string;
  source: string;
  page?: number;
  hd?: { number: number; faces: number };
  proficiency?: string[];
  primaryAbility?: Record<string, boolean>[];
  spellcastingAbility?: string;
  casterProgression?: string;
  startingProficiencies?: {
    armor?: string[];
    weapons?: string[];
    skills?: { choose?: { from: string[]; count: number } }[];
  };
  classFeatures?: (string | { classFeature: string })[];
  reprintedAs?: string[];
  _copy?: unknown;
}

export interface RawSubclass {
  name: string;
  shortName: string;
  source: string;
  className: string;
  classSource: string;
}

export interface RawClassFeature {
  name: string;
  source: string;
  className: string;
  classSource: string;
  level: number;
  entries?: SpellEntry[];
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/data/classTypes.ts
git commit -m "feat(classes): add type definitions"
```

---

### Task 14: Class loader

**Files:**
- Create: `app/src/data/classLoader.ts`
- Create: `app/src/data/classLoader.test.ts`

- [ ] **Step 1: Write failing tests**

Create `app/src/data/classLoader.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  buildClassId,
  normalizeHitDie,
  normalizePrimaryAbility,
  normalizeSavingThrows,
  normalizeClassData,
} from "./classLoader";

describe("buildClassId", () => {
  it("creates slug", () => {
    expect(buildClassId("Fighter", "XPHB")).toBe("fighter_xphb");
  });
});

describe("normalizeHitDie", () => {
  it("extracts faces from hd object", () => {
    expect(normalizeHitDie({ number: 1, faces: 10 })).toBe(10);
  });
  it("defaults to 8", () => {
    expect(normalizeHitDie(undefined)).toBe(8);
  });
});

describe("normalizePrimaryAbility", () => {
  it("maps single ability", () => {
    expect(normalizePrimaryAbility([{ int: true }])).toBe("Intelligence");
  });
  it("maps multiple abilities with or", () => {
    expect(normalizePrimaryAbility([{ str: true }, { dex: true }])).toBe(
      "Strength or Dexterity"
    );
  });
});

describe("normalizeSavingThrows", () => {
  it("maps abbreviations to full names", () => {
    expect(normalizeSavingThrows(["str", "con"])).toEqual(["Strength", "Constitution"]);
  });
});

describe("normalizeClassData", () => {
  it("normalizes a raw class", () => {
    const raw = {
      name: "Fighter",
      source: "XPHB",
      page: 90,
      hd: { number: 1, faces: 10 },
      proficiency: ["str", "con"],
      primaryAbility: [{ str: true }, { dex: true }],
      startingProficiencies: {
        armor: ["light", "medium", "heavy", "shield"],
        weapons: ["simple", "martial"],
        skills: [{ choose: { from: ["acrobatics", "athletics"], count: 2 } }],
      },
    };
    const result = normalizeClassData(raw, [], []);
    expect(result.id).toBe("fighter_xphb");
    expect(result.hitDie).toBe(10);
    expect(result.primaryAbility).toBe("Strength or Dexterity");
    expect(result.armorProficiencies).toEqual(["light", "medium", "heavy", "shield"]);
    expect(result.skillChoices?.count).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd app && npx vitest --run src/data/classLoader.test.ts
```

- [ ] **Step 3: Write class loader implementation**

Create `app/src/data/classLoader.ts`:

```typescript
import type {
  ClassData,
  SubclassData,
  ClassFeatureData,
  RawClass,
  RawSubclass,
  RawClassFeature,
} from "./classTypes";

// ── ID ────────────────────────────────────────────────────────────────────────

export function buildClassId(name: string, source: string): string {
  const slug = (s: string) =>
    s.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug(name)}_${slug(source)}`;
}

// ── Hit Die ───────────────────────────────────────────────────────────────────

export function normalizeHitDie(hd: { number: number; faces: number } | undefined): number {
  return hd?.faces ?? 8;
}

// ── Primary Ability ───────────────────────────────────────────────────────────

const ABILITY_FULL: Record<string, string> = {
  str: "Strength", dex: "Dexterity", con: "Constitution",
  int: "Intelligence", wis: "Wisdom", cha: "Charisma",
};

export function normalizePrimaryAbility(
  primary: Record<string, boolean>[] | undefined
): string {
  if (!primary || primary.length === 0) return "—";
  const names = primary.map((p) => {
    const key = Object.keys(p)[0];
    return ABILITY_FULL[key] ?? key;
  });
  return names.join(" or ");
}

// ── Saving Throws ─────────────────────────────────────────────────────────────

export function normalizeSavingThrows(profs: string[] | undefined): string[] {
  if (!profs) return [];
  return profs.map((p) => ABILITY_FULL[p] ?? p);
}

// ── Class normalizer ─────────────────────────────────────────────────────────

export function normalizeClassData(
  raw: RawClass,
  rawSubclasses: RawSubclass[],
  rawFeatures: RawClassFeature[]
): ClassData {
  const id = buildClassId(raw.name, raw.source);
  const hitDie = normalizeHitDie(raw.hd);
  const primaryAbility = normalizePrimaryAbility(raw.primaryAbility);
  const savingThrows = normalizeSavingThrows(raw.proficiency);

  const startProf = raw.startingProficiencies;
  const armorProficiencies = startProf?.armor ?? [];
  const weaponProficiencies = startProf?.weapons ?? [];

  const skillData = startProf?.skills?.[0];
  const skillChoices = skillData?.choose
    ? { from: skillData.choose.from, count: skillData.choose.count }
    : null;

  // Filter subclasses and features for this class
  const subclasses: SubclassData[] = rawSubclasses
    .filter((sc) => sc.className === raw.name && sc.classSource === raw.source)
    .map((sc) => ({ name: sc.name, shortName: sc.shortName, source: sc.source }));

  const classFeatures: ClassFeatureData[] = rawFeatures
    .filter((f) => f.className === raw.name && f.classSource === raw.source)
    .map((f) => ({ name: f.name, level: f.level, entries: f.entries ?? [], source: f.source }))
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
    spellcastingAbility: raw.spellcastingAbility
      ? ABILITY_FULL[raw.spellcastingAbility] ?? raw.spellcastingAbility
      : null,
    casterProgression: raw.casterProgression ?? null,
    subclasses,
    classFeatures,
    ...(raw.page !== undefined ? { page: raw.page } : {}),
  };
}

// ── Dedup ─────────────────────────────────────────────────────────────────────

const SOURCE_PRIORITY: Record<string, number> = {
  XPHB: 100, TCE: 50, PHB: 10,
};

// ── Loader ────────────────────────────────────────────────────────────────────

const CLASS_FILES = [
  "class-artificer.json", "class-barbarian.json", "class-bard.json",
  "class-cleric.json", "class-druid.json", "class-fighter.json",
  "class-monk.json", "class-paladin.json", "class-ranger.json",
  "class-rogue.json", "class-sorcerer.json", "class-warlock.json",
  "class-wizard.json",
];

export async function loadAllClasses(
  basePath: string = "/data/class"
): Promise<{ classes: ClassData[]; warnings: string[] }> {
  const results = await Promise.allSettled(
    CLASS_FILES.map(async (filename) => {
      const res = await fetch(`${basePath}/${filename}`);
      if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status}`);
      return res.json();
    })
  );

  const allClasses: ClassData[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const data = result.value;
      const rawClasses: RawClass[] = data.class ?? [];
      const rawSubclasses: RawSubclass[] = data.subclass ?? [];
      const rawFeatures: RawClassFeature[] = data.classFeature ?? [];

      for (const raw of rawClasses) {
        if (raw._copy) continue;
        try {
          allClasses.push(normalizeClassData(raw, rawSubclasses, rawFeatures));
        } catch (e) {
          warnings.push(`Failed to normalize class "${raw?.name}": ${e}`);
        }
      }
    } else {
      warnings.push(`Failed to load ${CLASS_FILES[i]}: ${result.reason}`);
    }
  }

  // Deduplicate
  const deduped = new Map<string, ClassData>();
  for (const cls of allClasses) {
    const key = cls.name.toLowerCase();
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, cls);
    } else {
      const ep = SOURCE_PRIORITY[existing.source] ?? 30;
      const np = SOURCE_PRIORITY[cls.source] ?? 30;
      if (np > ep) deduped.set(key, cls);
    }
  }

  const result = Array.from(deduped.values());
  result.sort((a, b) => a.name.localeCompare(b.name));

  return { classes: result, warnings };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd app && npx vitest --run src/data/classLoader.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add app/src/data/classTypes.ts app/src/data/classLoader.ts app/src/data/classLoader.test.ts
git commit -m "feat(classes): add types and loader with tests"
```

---

### Task 15: Class store, hooks, and UI

**Files:**
- Create: `app/src/store/useClassStore.ts`
- Create: `app/src/hooks/useClassSearch.ts`
- Create: `app/src/components/classes/ClassRow.tsx`
- Create: `app/src/components/classes/ClassList.tsx`
- Create: `app/src/components/classes/ClassDetail.tsx`
- Create: `app/src/components/classes/ClassListView.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/landing/LandingPage.tsx`

Classes are simpler — there are only ~13 classes, so no complex filters needed. Just search and a list.

**ClassRow displays:** name, hit die, primary ability, caster type

**ClassDetail is rich:**
- Name, source
- Hit die, primary ability, saving throws
- Armor/weapon proficiencies
- Skill choices
- Spellcasting info (if applicable)
- Subclass list (names as pills/tags)
- Class features grouped by level — each rendered with SpellDescription

Note: classes don't need filter hooks (too few items). Just search.

- [ ] **Step 1: Create class store** (`app/src/store/useClassStore.ts`)

Store with: `classes`, `loading`, `error`, `warnings`, `loadClasses()`.

- [ ] **Step 2: Create class search hook** (`app/src/hooks/useClassSearch.ts`)

Same pattern.

- [ ] **Step 3: Create ClassRow** (`app/src/components/classes/ClassRow.tsx`)

Props: `classData: ClassData`, `selected`, `onClick`, `even`. Same button structure.
- Name (flex-1 truncate, 13px bold)
- Desktop metadata: hit die (e.g., "d10"), primary ability, caster type (if any)
- Mobile metadata: hit die only

- [ ] **Step 3b: Create ClassList** (`app/src/components/classes/ClassList.tsx`)

Copy SpeciesList pattern. `ClassData`, `ClassRow`. Empty message: "No classes match your search". Only ~13 items so keyboard nav is still useful.

- [ ] **Step 3c: Create ClassDetail** (`app/src/components/classes/ClassDetail.tsx`)

Props: `classData: ClassData`, `onClose`, `onPrev?`, `onNext?`. Same slide-in panel.

Layout:
1. **Top bar**: ← close, class name, hit die badge ("d10") on right
2. **Summary section** (grid, 2 columns):
   - Hit Die: `d${classData.hitDie}`
   - Primary Ability: `classData.primaryAbility`
   - Saving Throws: `classData.savingThrows.join(", ")`
   - Spellcasting: `classData.spellcastingAbility ?? "None"` + caster progression
3. **Proficiencies section** (after divider):
   - Armor: `classData.armorProficiencies.join(", ") || "None"`
   - Weapons: `classData.weaponProficiencies.join(", ") || "None"`
   - Skills: `Choose ${classData.skillChoices.count} from ${classData.skillChoices.from.join(", ")}` or "None"
4. **Subclasses section** (after divider):
   - Heading: "Subclasses" in accent color
   - List of subclass names as pills/tags with subtle bg-panel background
5. **Class Features section** (after divider):
   - Group features by level. For each level that has features:
     - Level heading: "Level N" in accent-primary, 13px bold
     - For each feature at that level:
       - Feature name in bold
       - `<SpellDescription entries={feature.entries} schoolColor="var(--accent-primary)" />`
6. **Footer**: Source + page

- [ ] **Step 3d: Create ClassListView** (`app/src/components/classes/ClassListView.tsx`)

Simpler than other list views — no filters section (only ~13 classes, search is enough).

Copy SpeciesListView but:
- Remove SpeciesFilters section entirely
- Uses `useClassStore`, `useClassSearch` (no filter hook)
- Title: "Classes"
- Count: `results.length + " classes"`
- Route param: `classId`
- Navigate to `/classes/${cls.id}` on select
- Loading text: "Loading classes…"

- [ ] **Step 4: Add routes to App.tsx**

```typescript
import { ClassListView } from "./components/classes/ClassListView";
// Add routes:
{ path: "/classes", element: <ClassListView /> },
{ path: "/classes/:classId", element: <ClassListView /> },
```

- [ ] **Step 5: Update LandingPage**

Change classes entry to `active: true, to: "/classes"`.

- [ ] **Step 5b: Update LandingPage.test.tsx for classes**

Add test:

```typescript
  it("renders the classes link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /classes/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/classes");
  });
```

- [ ] **Step 6: Update landing page tagline**

Change "spell reference for 5th edition" to "reference for 5th edition" since we now cover more than spells.

- [ ] **Step 7: Run full test suite**

```bash
cd app && npx vitest --run
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(classes): add store, hooks, UI components, routing"
```

---

## Chunk 5: Polish & Integration

### Task 16: Cross-entity tag linking

**Files:**
- Modify: `app/src/data/tagRenderer.tsx`

Currently `tagRenderer.tsx` only links `{@spell ...}` tags. Add support for linking to bestiary creatures and other entity types.

- [ ] **Step 1: Add creature tag linking to tagRenderer**

Modify `app/src/data/tagRenderer.tsx` — add a case for the `creature` tag. Note: when no source is provided (e.g., `{@creature goblin}`), we use an empty string for source which produces a trailing underscore in the ID. We strip it to make the ID cleaner for source-less lookups:

```typescript
case "creature": {
  const pipeIdx = content.indexOf("|");
  const creatureName = pipeIdx === -1 ? content : content.slice(0, pipeIdx);
  const creatureSource = pipeIdx === -1 ? "" : content.slice(pipeIdx + 1);
  // buildMonsterId with empty source produces "name_" — strip trailing underscore
  const rawId = buildMonsterId(creatureName, creatureSource);
  const monsterId = rawId.replace(/_$/, "");
  const href = `#/bestiary/${monsterId}`;
  nodes.push(
    <a key={key} href={href}>{creatureName}</a>
  );
  break;
}
```

Import `buildMonsterId` from `./bestiaryLoader`.

- [ ] **Step 1b: Update tagRenderer.test.tsx for creature tag change**

The existing test at `app/src/data/tagRenderer.test.tsx` asserts that `{@creature goblin}` renders as plain text. Now it renders as a link. Update the test:

Replace this test:

```typescript
  it("{@creature ...} renders plain text", () => {
    const nodes = renderTaggedText("{@creature goblin}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toBe("goblin");
  });
```

With:

```typescript
  it("{@creature name} renders anchor with href to bestiary", () => {
    const nodes = renderTaggedText("{@creature goblin}");
    renderNodes(nodes);
    const link = screen.getByRole("link", { name: "goblin" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("#/bestiary/goblin");
  });

  it("{@creature name|source} renders anchor with source in href", () => {
    const nodes = renderTaggedText("{@creature Goblin|MM}");
    renderNodes(nodes);
    const link = screen.getByRole("link", { name: "Goblin" });
    expect(link.getAttribute("href")).toBe("#/bestiary/goblin_mm");
  });
```

- [ ] **Step 2: Run full test suite**

```bash
cd app && npx vitest --run
```

- [ ] **Step 3: Commit**

```bash
git add app/src/data/tagRenderer.tsx
git commit -m "feat: add creature tag linking in tag renderer"
```

---

### Task 17: Build verification and data pipeline

- [ ] **Step 1: Ensure vite build still works**

```bash
cd app && npm run build
```

Note: This wipes `docs/`. After build, data files need to be restored:

```bash
# Restore spell data (already existed)
# Copy new data
cp -r ../data/bestiary ../docs/data/bestiary 2>/dev/null || true
cp ../data/races.json ../docs/data/races.json
cp ../data/feats.json ../docs/data/feats.json
cp -r ../data/class ../docs/data/class
cp ../data/fluff-races.json ../docs/data/fluff-races.json 2>/dev/null || true
cp ../data/fluff-feats.json ../docs/data/fluff-feats.json 2>/dev/null || true
```

- [ ] **Step 2: Consider adding a build script**

Add to `app/package.json`. Note: `vite build` with `emptyOutDir: true` wipes `docs/`, so we need `mkdir -p` before copying:

```json
"scripts": {
  "build": "tsc -b && vite build",
  "postbuild": "mkdir -p ../docs/data && cp -r ../data/spells ../docs/data/spells && cp ../data/races.json ../docs/data/races.json && cp ../data/feats.json ../docs/data/feats.json && cp -r ../data/bestiary ../docs/data/bestiary && cp -r ../data/class ../docs/data/class"
}
```

- [ ] **Step 3: Run full test suite one final time**

```bash
cd app && npx vitest --run
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: add post-build data copy and final integration"
```

---

## Summary

| Section   | Data Source               | Entity Count | Filters                                    |
|-----------|---------------------------|-------------|---------------------------------------------|
| Species   | `data/races.json`         | ~157 races   | Size, Darkvision, Source                   |
| Feats     | `data/feats.json`         | ~265 feats   | Category, Source, Has Prerequisite         |
| Bestiary  | `data/bestiary/*.json`    | ~4454 monsters| CR, Type, Size, Source, Environment       |
| Classes   | `data/class/class-*.json` | ~13 classes  | Search only (too few for filters)          |

**Total new files:** ~35-40 files across types, loaders, stores, hooks, and UI components.

**Testing:** Each data loader has unit tests. Stores have unit tests. Filter hooks have unit tests. UI components follow established patterns and are verified manually + via existing test patterns.

**Architecture note:** Each entity section is self-contained. The existing `SpellDescription` component and `tagRenderer` are reused for rendering formatted text entries across all entity types, since the underlying `SpellEntry` format is used universally in the 5etools data.
