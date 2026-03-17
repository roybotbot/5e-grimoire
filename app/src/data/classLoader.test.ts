import { describe, it, expect } from "vitest";
import { buildClassId, normalizeHitDie, normalizePrimaryAbility, normalizeSavingThrows, normalizeClassData } from "./classLoader";

describe("buildClassId", () => {
  it("creates slug", () => { expect(buildClassId("Fighter", "XPHB")).toBe("fighter_xphb"); });
});

describe("normalizeHitDie", () => {
  it("extracts faces from hd object", () => { expect(normalizeHitDie({ number: 1, faces: 10 })).toBe(10); });
  it("defaults to 8", () => { expect(normalizeHitDie(undefined)).toBe(8); });
});

describe("normalizePrimaryAbility", () => {
  it("maps single ability", () => { expect(normalizePrimaryAbility([{ int: true }])).toBe("Intelligence"); });
  it("maps multiple abilities with or", () => { expect(normalizePrimaryAbility([{ str: true }, { dex: true }])).toBe("Strength or Dexterity"); });
});

describe("normalizeSavingThrows", () => {
  it("maps abbreviations to full names", () => { expect(normalizeSavingThrows(["str", "con"])).toEqual(["Strength", "Constitution"]); });
});

describe("normalizeClassData", () => {
  it("normalizes a raw class", () => {
    const raw = {
      name: "Fighter", source: "XPHB", page: 90,
      hd: { number: 1, faces: 10 },
      proficiency: ["str", "con"],
      primaryAbility: [{ str: true } as Record<string, boolean>, { dex: true } as Record<string, boolean>],
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
