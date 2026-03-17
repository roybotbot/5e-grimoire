import { describe, it, expect } from "vitest";
import { buildFeatId, normalizeFeatCategory, normalizePrerequisite, normalizeFeat } from "./featLoader";

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
    const raw = { name: "Alert", source: "XPHB", page: 200, category: "OF", entries: ["You gain the following benefits."] };
    const result = normalizeFeat(raw);
    expect(result.id).toBe("alert_xphb");
    expect(result.categoryDisplay).toBe("Origin");
    expect(result.prerequisite).toBeNull();
  });
});
