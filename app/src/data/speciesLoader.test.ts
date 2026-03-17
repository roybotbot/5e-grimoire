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
      entries: [{ type: "entries", name: "Languages", entries: ["You can speak, read, and write Common and one extra language."] }],
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
