import type { SpellEntry } from "./spellTypes";

export interface ClassData {
  id: string;
  name: string;
  source: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillChoices: { from: string[]; count: number } | null;
  spellcastingAbility: string | null;
  casterProgression: string | null;
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
