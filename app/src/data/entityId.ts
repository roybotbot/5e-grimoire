/**
 * Creates a URL-safe identifier from a name and source.
 * Used across all entity types (spells, species, feats, classes, monsters).
 *
 * Examples:
 *   buildEntityId("Fireball", "PHB") → "fireball_phb"
 *   buildEntityId("Half-Elf", "XPHB") → "half-elf_xphb"
 */
export function buildEntityId(name: string, source: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(name)}_${slug(source)}`;
}
