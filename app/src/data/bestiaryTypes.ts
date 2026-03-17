import type { SpellEntry } from "./spellTypes";

export interface MonsterData {
  id: string;
  name: string;
  source: string;
  size: string[];
  sizeDisplay: string;
  type: string;
  typeDisplay: string;
  alignment: string;
  ac: string;
  hp: string;
  speed: string;
  abilities: MonsterAbilities;
  cr: string;
  crNumber: number;
  traits: MonsterFeature[];
  actions: MonsterFeature[];
  legendaryActions: MonsterFeature[];
  reactions: MonsterFeature[];
  senses: string;
  languages: string;
  skills: string;
  saves: string;
  immune: string;
  resist: string;
  conditionImmune: string;
  environment: string[];
  page?: number;
}

export interface MonsterAbilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface MonsterFeature {
  name: string;
  entries: SpellEntry[];
}

export interface RawMonster {
  name: string;
  source: string;
  page?: number;
  size?: string[];
  type?:
    | string
    | { type: string; tags?: (string | { tag: string; prefix?: string })[] };
  alignment?: (string | { alignment: string[] })[];
  ac?: (number | { ac: number; from?: string[]; special?: string })[];
  hp?: { average?: number; formula?: string; special?: string };
  speed?: Record<string, number | { number: number; condition?: string }>;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  cr?: string | { cr: string };
  trait?: { name: string; entries: SpellEntry[] }[];
  action?: { name: string; entries: SpellEntry[] }[];
  legendary?: { name: string; entries: SpellEntry[] }[];
  reaction?: { name: string; entries: SpellEntry[] }[];
  senses?: string[];
  passive?: number;
  languages?: string[];
  skill?: Record<string, string>;
  save?: Record<string, string>;
  immune?: (string | { immune: string[] })[];
  resist?: (string | { resist: string[] })[];
  conditionImmune?: (string | { conditionImmune: string[] })[];
  environment?: string[];
  _copy?: unknown;
  reprintedAs?: string[];
}

export interface RawBestiaryIndex {
  [sourceAbbr: string]: string;
}
