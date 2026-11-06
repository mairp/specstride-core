// T094 — the two file ports of feature 117 IN MEMORY, for the unit tests of
// the core (`assumption: CQ-185`). The shapes are those of
// `packages/core/src/critic-input/ports.ts`, implemented structurally: this
// module imports no core package, and no file of a core package names it
// (F100-FR-012).
//
// The memory store maps an absolute path to the bytes, the mode and the
// modification time of one file. `moveFile` copies the entry and drops the
// source; a move whose source is missing fails and leaves everything where
// it was. `setAside` moves the entry under the aside root, which stands in
// for the control plane.

/** One file in the memory store. */
export type MemoryFile = {
  readonly bytes: Uint8Array;
  readonly mode: number;
  readonly mtimeMs: number;
};

/** The stat of one path, as `packages/core/src/critic-input/ports.ts` shapes it. */
export interface MemoryPortStat {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtimeMs: number;
  mode?: number;
}

/** The file-reading port in memory. */
export interface MemoryFileReadingPort {
  stat(path: string, options?: { readonly noFollow?: boolean }): MemoryPortStat | undefined;
  read(path: string, offset: number, limit: number): Uint8Array | undefined;
  realpath(path: string): string | undefined;
  listDirectory(path: string): readonly string[] | undefined;
  matchBelow(root: string, pattern: string): readonly string[];
}

/** A move carries the bytes, the mode and the modification time. */
export interface MemoryMovedFile {
  readonly bytes: Uint8Array;
  readonly mode: number;
  readonly mtimeMs: number;
}

/** The file-moving port in memory. */
export interface MemoryFileMovingPort {
  moveFile(from: string, to: string, file: MemoryMovedFile): void;
  setAside(from: string, asideRoot: string): void;
  exists(path: string): boolean;
  listWorkerRoot(): readonly string[];
}

/** The store the two ports share: absolute paths to files. */
export type MemoryStore = Map<string, MemoryFile>;

/** A store preloaded with files, for a test tree. */
export function memoryStore(
  entries: Readonly<Record<string, { bytes: Uint8Array; mode?: number; mtimeMs?: number }>> = {},
): MemoryStore {
  const store: MemoryStore = new Map();
  for (const [path, file] of Object.entries(entries)) {
    store.set(path, {
      bytes: file.bytes,
      mode: file.mode ?? 0o644,
      mtimeMs: file.mtimeMs ?? 0,
    });
  }
  return store;
}

function basename(path: string): string {
  const index = path.lastIndexOf("/");
  return index === -1 ? path : path.slice(index + 1);
}

/** The file-reading port over a memory store (T094). */
export function memoryReader(store: MemoryStore): MemoryFileReadingPort {
  return {
    stat(path) {
      const file = store.get(path);
      if (file === undefined) {
        // A directory is any path that is a prefix of a stored path.
        for (const key of store.keys()) {
          if (key.startsWith(`${path}/`)) {
            return { isFile: false, isDirectory: true, size: 0, mtimeMs: 0, mode: 0o755 };
          }
        }
        return undefined;
      }
      return {
        isFile: true,
        isDirectory: false,
        size: file.bytes.byteLength,
        mtimeMs: file.mtimeMs,
        mode: file.mode,
      };
    },
    read(path, offset, limit) {
      const file = store.get(path);
      if (file === undefined) return undefined;
      return file.bytes.slice(offset, offset + limit);
    },
    realpath(path) {
      return store.has(path) ? path : undefined;
    },
    listDirectory(path) {
      const names = new Set<string>();
      for (const key of store.keys()) {
        if (!key.startsWith(`${path}/`)) continue;
        const rest = key.slice(path.length + 1);
        names.add(rest.includes("/") ? rest.slice(0, rest.indexOf("/")) : rest);
      }
      return [...names].sort();
    },
    matchBelow(root, pattern) {
      const source = pattern
        .split("**/")
        .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
        .join("(?:.*/)?");
      const regex = new RegExp(`^${source}$`);
      return [...store.keys()]
        .filter((key) => key.startsWith(`${root}/`))
        .map((key) => key.slice(root.length + 1))
        .filter((relative) => regex.test(relative))
        .sort();
    },
  };
}

/** The file-moving port over a memory store (T094); `workerRoot` is its logical root. */
export function memoryMover(store: MemoryStore, workerRoot: string): MemoryFileMovingPort {
  return {
    moveFile(from, to, file) {
      if (!store.has(from)) {
        // A failed move leaves the file at its old place — here: nothing
        // moves at all, and no entry appears at the target.
        throw new Error(`moveFile: nothing at ${from}`);
      }
      store.set(to, { bytes: file.bytes, mode: file.mode, mtimeMs: file.mtimeMs });
      store.delete(from);
    },
    setAside(from, asideRoot) {
      const file = store.get(from);
      if (file === undefined) throw new Error(`setAside: nothing at ${from}`);
      store.set(`${asideRoot}/${basename(from)}`, file);
      store.delete(from);
    },
    exists(path) {
      return store.has(path);
    },
    listWorkerRoot() {
      const prefix = workerRoot.endsWith("/") ? workerRoot : `${workerRoot}/`;
      const names = new Set<string>();
      for (const key of store.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        names.add(rest.includes("/") ? rest.slice(0, rest.indexOf("/")) : rest);
      }
      return [...names].sort();
    },
  };
}
