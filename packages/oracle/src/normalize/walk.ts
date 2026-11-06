/**
 * T052 — the two walks every rule of the normalizer is written with.
 *
 * Most rules of annex X §X.8 replace values inside a captured surface, and a
 * surface is a tree of objects, arrays and strings. `mapStrings` walks such a
 * tree and gives back a new tree with every string run through one function,
 * together with how many strings the function CHANGED — which is the count
 * F141-FR-020 asks for ("how many values each rule replaced").
 *
 * `countStrings` is the same walk without a change, for the rules that compare as
 * written and count the values they were applied to.
 */

/** What one replacement function gives back for one string. */
export type Replace = (value: string) => string;

/** A tree with every string replaced, and how many strings changed. */
export function mapStrings(value: unknown, replace: Replace): { value: unknown; changed: number } {
  let changed = 0;
  const walk = (node: unknown): unknown => {
    if (typeof node === "string") {
      const next = replace(node);
      if (next !== node) changed += 1;
      return next;
    }
    if (Array.isArray(node)) return node.map(walk);
    if (node !== null && typeof node === "object") {
      const out: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(node as Record<string, unknown>)) {
        out[key] = walk(entry);
      }
      return out;
    }
    return node;
  };
  return { value: walk(value), changed };
}

/** How many strings of a tree a predicate holds for. */
export function countStrings(value: unknown, holds: (value: string) => boolean): number {
  let count = 0;
  const walk = (node: unknown): void => {
    if (typeof node === "string") {
      if (holds(node)) count += 1;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node !== null && typeof node === "object") {
      Object.values(node as Record<string, unknown>).forEach(walk);
    }
  };
  walk(value);
  return count;
}

/** Every value of a tree a predicate holds for, as a flat list. */
export function collect<T>(value: unknown, pick: (node: unknown) => T | undefined): T[] {
  const found: T[] = [];
  const walk = (node: unknown): void => {
    const picked = pick(node);
    if (picked !== undefined) found.push(picked);
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node !== null && typeof node === "object") {
      Object.values(node as Record<string, unknown>).forEach(walk);
    }
  };
  walk(value);
  return found;
}

/**
 * Replace values in the surfaces a rule acts on, and count the changes. A rule
 * that names no surface acts on every surface of the capture.
 */
export function replaceInSurfaces(
  surfaces: Record<string, unknown>,
  names: readonly string[],
  replace: Replace,
): number {
  let changed = 0;
  for (const name of Object.keys(surfaces)) {
    const base = name.split(".")[0] as string;
    if (names.length > 0 && !names.includes(base)) continue;
    const result = mapStrings(surfaces[name], replace);
    surfaces[name] = result.value;
    changed += result.changed;
  }
  return changed;
}

/** A numbered placeholder maker: the same value always gets the same number. */
export function numberer(prefix: string): (value: string) => string {
  const seen = new Map<string, number>();
  return (value: string): string => {
    let n = seen.get(value);
    if (n === undefined) {
      n = seen.size + 1;
      seen.set(value, n);
    }
    return `<${prefix}-${String(n)}>`;
  };
}
