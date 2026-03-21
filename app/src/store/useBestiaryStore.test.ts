import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBestiaryStore } from "./useBestiaryStore";
import type { MonsterData } from "../data/bestiaryTypes";

// Mock the loader
vi.mock("../data/bestiaryLoader", () => ({
  loadAllMonsters: vi.fn(),
}));

import { loadAllMonsters } from "../data/bestiaryLoader";

function makeMonster(overrides: Partial<MonsterData> = {}): MonsterData {
  return {
    id: "test-monster_mm",
    name: "Test Monster",
    source: "MM",
    size: ["M"],
    sizeDisplay: "Medium",
    type: "humanoid",
    typeDisplay: "Humanoid",
    alignment: "Neutral",
    ac: "10",
    hp: "10 (2d8)",
    speed: "30 ft.",
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    cr: "1",
    crNumber: 1,
    traits: [],
    actions: [],
    legendaryActions: [],
    reactions: [],
    senses: "passive Perception 10",
    languages: "Common",
    skills: "",
    saves: "",
    immune: "",
    resist: "",
    conditionImmune: "",
    environment: [],
    ...overrides,
  };
}

beforeEach(() => {
  useBestiaryStore.setState({
    monsters: [],
    loading: false,
    error: null,
    warnings: [],
  });
  vi.clearAllMocks();
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("monsters is empty array", () => {
    expect(useBestiaryStore.getState().monsters).toEqual([]);
  });

  it("loading is false", () => {
    expect(useBestiaryStore.getState().loading).toBe(false);
  });

  it("error is null", () => {
    expect(useBestiaryStore.getState().error).toBeNull();
  });

  it("warnings is empty array", () => {
    expect(useBestiaryStore.getState().warnings).toEqual([]);
  });
});

// ── loadMonsters ──────────────────────────────────────────────────────────────

describe("loadMonsters", () => {
  it("sets loading true then false on success", async () => {
    vi.mocked(loadAllMonsters).mockResolvedValueOnce({ monsters: [], warnings: [] });
    await useBestiaryStore.getState().loadMonsters();
    expect(useBestiaryStore.getState().loading).toBe(false);
  });

  it("populates monsters and warnings on success", async () => {
    const m = makeMonster({});
    vi.mocked(loadAllMonsters).mockResolvedValueOnce({
      monsters: [m],
      warnings: ["a warning"],
    });
    await useBestiaryStore.getState().loadMonsters();
    expect(useBestiaryStore.getState().monsters).toHaveLength(1);
    expect(useBestiaryStore.getState().warnings).toEqual(["a warning"]);
    expect(useBestiaryStore.getState().error).toBeNull();
  });

  it("sets error on failure", async () => {
    vi.mocked(loadAllMonsters).mockRejectedValueOnce(new Error("Load failed"));
    await useBestiaryStore.getState().loadMonsters();
    expect(useBestiaryStore.getState().error).toBe("Load failed");
    expect(useBestiaryStore.getState().loading).toBe(false);
  });
});

// ── allSources ────────────────────────────────────────────────────────────────

describe("allSources", () => {
  it("returns empty array when no monsters", () => {
    expect(useBestiaryStore.getState().allSources()).toEqual([]);
  });

  it("returns unique sorted sources", () => {
    useBestiaryStore.setState({
      monsters: [
        makeMonster({ source: "XPHB" }),
        makeMonster({ source: "MM" }),
        makeMonster({ source: "XPHB" }),
        makeMonster({ source: "VGM" }),
      ],
    });
    expect(useBestiaryStore.getState().allSources()).toEqual(["MM", "VGM", "XPHB"]);
  });
});

// ── allTypes ──────────────────────────────────────────────────────────────────

describe("allTypes", () => {
  it("returns empty array when no monsters", () => {
    expect(useBestiaryStore.getState().allTypes()).toEqual([]);
  });

  it("returns unique capitalized sorted base types", () => {
    useBestiaryStore.setState({
      monsters: [
        makeMonster({ type: "humanoid" }),
        makeMonster({ type: "beast" }),
        makeMonster({ type: "humanoid" }),
        makeMonster({ type: "undead" }),
      ],
    });
    expect(useBestiaryStore.getState().allTypes()).toEqual([
      "Beast",
      "Humanoid",
      "Undead",
    ]);
  });
});

// ── allEnvironments ───────────────────────────────────────────────────────────

describe("allEnvironments", () => {
  it("returns empty array when no monsters", () => {
    expect(useBestiaryStore.getState().allEnvironments()).toEqual([]);
  });

  it("returns unique sorted environments across all monsters", () => {
    useBestiaryStore.setState({
      monsters: [
        makeMonster({ environment: ["forest", "grassland"] }),
        makeMonster({ environment: ["forest", "desert"] }),
        makeMonster({ environment: [] }),
      ],
    });
    expect(useBestiaryStore.getState().allEnvironments()).toEqual([
      "desert",
      "forest",
      "grassland",
    ]);
  });
});
