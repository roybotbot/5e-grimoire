import type { SpellEntry } from "./spellTypes";

export interface SpeciesData {
  id: string;
  name: string;
  source: string;
  size: string[];
  sizeDisplay: string;
  speed: SpeciesSpeed;
  speedDisplay: string;
  darkvision: number | null;
  traits: SpellEntry[];
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
