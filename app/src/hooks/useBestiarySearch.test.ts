import { describe, it, expect } from "vitest";
import { filterMonstersBySearch } from "./useBestiarySearch";
import type { MonsterData } from "../data/bestiaryTypes";

function makeMonster(name: string, overrides: Partial<MonsterData> = {}): MonsterData {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
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

const MONSTERS = [
  makeMonster("Goblin"),
  makeMonster("Goblin Boss"),
  makeMonster("Orc"),
  makeMonster("Ancient Red Dragon"),
];

describe("filterMonstersBySearch", () => {
  it("returns all monsters when query is empty", () => {
    expect(filterMonstersBySearch(MONSTERS, "")).toHaveLength(MONSTERS.length);
  });

  it("returns all monsters when query is only whitespace", () => {
    expect(filterMonstersBySearch(MONSTERS, "   ")).toHaveLength(MONSTERS.length);
  });

  it("filters by case-insensitive substring match", () => {
    const result = filterMonstersBySearch(MONSTERS, "goblin");
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.name)).toContain("Goblin");
    expect(result.map((m) => m.name)).toContain("Goblin Boss");
  });

  it("is case-insensitive (uppercase query)", () => {
    const result = filterMonstersBySearch(MONSTERS, "ORC");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Orc");
  });

  it("returns empty array when no monsters match", () => {
    expect(filterMonstersBySearch(MONSTERS, "xyzzy")).toHaveLength(0);
  });

  it("returns exact match", () => {
    const result = filterMonstersBySearch(MONSTERS, "Ancient Red Dragon");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ancient Red Dragon");
  });

  it("matches partial name within longer name", () => {
    const result = filterMonstersBySearch(MONSTERS, "dragon");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Ancient Red Dragon");
  });

  it("returns empty array when monsters list is empty", () => {
    expect(filterMonstersBySearch([], "goblin")).toHaveLength(0);
  });
});
