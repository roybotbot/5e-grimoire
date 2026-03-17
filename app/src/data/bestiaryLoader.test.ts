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
    expect(normalizeMonsterType({ type: "humanoid", tags: ["aarakocra"] })).toBe("Humanoid (aarakocra)");
  });
  it("handles object type with object tags", () => {
    expect(normalizeMonsterType({ type: "humanoid", tags: [{ tag: "elf", prefix: "high" }] })).toBe("Humanoid (high elf)");
  });
});

describe("normalizeMonsterAC", () => {
  it("handles simple number", () => { expect(normalizeMonsterAC([12])).toBe("12"); });
  it("handles object with from", () => { expect(normalizeMonsterAC([{ ac: 15, from: ["natural armor"] }])).toBe("15 (natural armor)"); });
  it("handles object with special", () => { expect(normalizeMonsterAC([{ ac: 0, special: "11 + spell level" } as any])).toBe("11 + spell level"); });
});

describe("normalizeMonsterHP", () => {
  it("handles average and formula", () => { expect(normalizeMonsterHP({ average: 13, formula: "3d8" })).toBe("13 (3d8)"); });
  it("handles special", () => { expect(normalizeMonsterHP({ special: "40 + 10 per level" })).toBe("40 + 10 per level"); });
});

describe("normalizeMonsterSpeed", () => {
  it("handles walk-only", () => { expect(normalizeMonsterSpeed({ walk: 30 })).toBe("30 ft."); });
  it("handles walk + fly", () => { expect(normalizeMonsterSpeed({ walk: 20, fly: 50 })).toBe("20 ft., fly 50 ft."); });
  it("handles nested fly object", () => { expect(normalizeMonsterSpeed({ walk: 30, fly: { number: 30, condition: "(hover)" } })).toBe("30 ft., fly 30 ft."); });
});

describe("normalizeMonsterCR", () => {
  it("handles string CR", () => { expect(normalizeMonsterCR("1/4")).toEqual({ cr: "1/4", crNumber: 0.25 }); });
  it("handles object CR", () => { expect(normalizeMonsterCR({ cr: "5" })).toEqual({ cr: "5", crNumber: 5 }); });
  it("handles 0", () => { expect(normalizeMonsterCR("0")).toEqual({ cr: "0", crNumber: 0 }); });
});

describe("normalizeMonster", () => {
  it("normalizes a raw monster", () => {
    const raw = {
      name: "Goblin", source: "MM", page: 166, size: ["S"], type: "humanoid",
      ac: [15], hp: { average: 7, formula: "2d6" }, speed: { walk: 30 },
      str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8, cr: "1/4",
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
