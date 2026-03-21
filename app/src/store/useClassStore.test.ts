import { describe, it, expect, beforeEach, vi } from "vitest";
import { useClassStore } from "./useClassStore";
import type { ClassData } from "../data/classTypes";

// ── Mock loadAllClasses ───────────────────────────────────────────────────────

vi.mock("../data/classLoader", () => ({
  loadAllClasses: vi.fn(),
}));

import { loadAllClasses } from "../data/classLoader";
const mockLoadAllClasses = vi.mocked(loadAllClasses);

// ── Helper ────────────────────────────────────────────────────────────────────

const makeClass = (overrides: Partial<ClassData> = {}): ClassData => ({
  id: "fighter_xphb",
  name: "Fighter",
  source: "XPHB",
  hitDie: 10,
  primaryAbility: "Strength",
  savingThrows: ["Strength", "Constitution"],
  armorProficiencies: ["All armor", "Shields"],
  weaponProficiencies: ["Simple weapons", "Martial weapons"],
  skillChoices: { from: ["Acrobatics", "Athletics"], count: 2 },
  spellcastingAbility: null,
  casterProgression: null,
  subclasses: [],
  classFeatures: [],
  ...overrides,
});

// ── Reset store before each test ──────────────────────────────────────────────

beforeEach(() => {
  useClassStore.setState({
    classes: [],
    loading: false,
    error: null,
    warnings: [],
  });
  vi.clearAllMocks();
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("classes is empty array", () => {
    expect(useClassStore.getState().classes).toEqual([]);
  });

  it("loading is false", () => {
    expect(useClassStore.getState().loading).toBe(false);
  });

  it("error is null", () => {
    expect(useClassStore.getState().error).toBeNull();
  });

  it("warnings is empty array", () => {
    expect(useClassStore.getState().warnings).toEqual([]);
  });
});

// ── loadClasses ───────────────────────────────────────────────────────────────

describe("loadClasses", () => {
  it("sets loading true during fetch then false on success", async () => {
    mockLoadAllClasses.mockResolvedValueOnce({ classes: [], warnings: [] });
    await useClassStore.getState().loadClasses();
    expect(useClassStore.getState().loading).toBe(false);
  });

  it("populates classes and warnings on success", async () => {
    const cls = makeClass();
    mockLoadAllClasses.mockResolvedValueOnce({
      classes: [cls],
      warnings: ["some warning"],
    });
    await useClassStore.getState().loadClasses();
    expect(useClassStore.getState().classes).toHaveLength(1);
    expect(useClassStore.getState().classes[0].name).toBe("Fighter");
    expect(useClassStore.getState().warnings).toEqual(["some warning"]);
    expect(useClassStore.getState().error).toBeNull();
  });

  it("sets error and clears loading on failure", async () => {
    mockLoadAllClasses.mockRejectedValueOnce(new Error("Network error"));
    await useClassStore.getState().loadClasses();
    expect(useClassStore.getState().loading).toBe(false);
    expect(useClassStore.getState().error).toBe("Network error");
    expect(useClassStore.getState().classes).toEqual([]);
  });

  it("clears previous error on new load attempt", async () => {
    mockLoadAllClasses.mockRejectedValueOnce(new Error("First error"));
    await useClassStore.getState().loadClasses();
    expect(useClassStore.getState().error).toBe("First error");

    mockLoadAllClasses.mockResolvedValueOnce({ classes: [], warnings: [] });
    await useClassStore.getState().loadClasses();
    expect(useClassStore.getState().error).toBeNull();
  });

  it("handles non-Error throws", async () => {
    mockLoadAllClasses.mockRejectedValueOnce("string error");
    await useClassStore.getState().loadClasses();
    expect(useClassStore.getState().error).toBe("string error");
  });
});
