import type { SpellEntry } from "./spellTypes";

export interface FeatData {
  id: string;
  name: string;
  source: string;
  category: string | null;
  categoryDisplay: string;
  prerequisite: string | null;
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
