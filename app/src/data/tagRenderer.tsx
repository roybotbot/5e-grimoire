import React from "react";
import { buildSpellId } from "./spellLoader";
import { buildMonsterId } from "./bestiaryLoader";

// ── Tag display extractor ─────────────────────────────────────────────────────

/**
 * Extracts the display text from a tag's content string.
 *
 * Rules:
 * - {@b text} / {@i text}  → full content
 * - {@variantrule ...|SRC|Display} → last pipe segment
 * - Everything else → text before first `|`, or full text if no pipe
 */
export function extractTagDisplay(tag: string, content: string): string {
  if (tag === "b" || tag === "i") {
    return content;
  }
  if (tag === "variantrule") {
    const parts = content.split("|");
    // 3+ segments: last is display override (e.g., "Hit Points|XPHB|Hit Point" → "Hit Point")
    // 2 segments: name|source, display is the name (e.g., "Hit Points|XPHB" → "Hit Points")
    // 1 segment: just the name
    if (parts.length >= 3) return parts[parts.length - 1];
    return parts[0];
  }
  const pipeIdx = content.indexOf("|");
  if (pipeIdx === -1) return content;
  return content.slice(0, pipeIdx);
}

// ── Tag renderer ──────────────────────────────────────────────────────────────

/**
 * Parses `{@tag content}` patterns in a string and returns an array of
 * ReactNodes (strings or JSX elements).
 *
 * Supported tags:
 * - {@b ...} → <strong>
 * - {@i ...} → <em>
 * - {@spell name|source} → <a href="#/spells/id">name</a>
 * - Everything else → plain display text
 */
export function renderTaggedText(text: string): React.ReactNode[] {
  // IMPORTANT: regex is declared inside the function to avoid stateful issues
  const TAG_REGEX = /\{@(\w+)\s([^}]+)\}/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_REGEX.exec(text)) !== null) {
    const [fullMatch, tag, content] = match;
    const matchStart = match.index;

    // Push any literal text before this match
    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart));
    }

    const key = matchStart;

    switch (tag) {
      case "b":
        nodes.push(<strong key={key}>{content}</strong>);
        break;

      case "i":
        nodes.push(<em key={key}>{content}</em>);
        break;

      case "spell": {
        // content may be "name|source" or just "name"
        const pipeIdx = content.indexOf("|");
        const spellName = pipeIdx === -1 ? content : content.slice(0, pipeIdx);
        const spellSource = pipeIdx === -1 ? "" : content.slice(pipeIdx + 1);
        const href = `#/spells/${buildSpellId(spellName, spellSource)}`;
        nodes.push(
          <a key={key} href={href}>
            {spellName}
          </a>
        );
        break;
      }

      case "creature": {
        // content may be "name|source" or just "name"
        const pipeIdx = content.indexOf("|");
        const creatureName = pipeIdx === -1 ? content : content.slice(0, pipeIdx);
        const creatureSource = pipeIdx === -1 ? "" : content.slice(pipeIdx + 1);
        const rawId = buildMonsterId(creatureName, creatureSource);
        // Strip trailing underscore when source is empty
        const monsterId = rawId.replace(/_$/, "");
        const href = `#/bestiary/${monsterId}`;
        nodes.push(
          <a key={key} href={href}>
            {creatureName}
          </a>
        );
        break;
      }

      default:
        // All other tags (damage, dice, condition, item, action, skill, etc.)
        // → plain display text
        nodes.push(extractTagDisplay(tag, content));
        break;
    }

    lastIndex = matchStart + fullMatch.length;
  }

  // Push any remaining literal text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
