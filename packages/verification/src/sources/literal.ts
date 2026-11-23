/**
 * T105 — the source "commands declared literally in the plan or the task
 * list", on the CANONICAL SPEC MODEL (F105-FR-015).
 *
 * A consumer writes the command inside the text of a task or of a plan:
 * `` `npm run build` ``, a fenced block of one line, or a line that begins
 * `Command:`. This source reads those out of the canonical spec model (EP-03)
 * and NEVER out of a parse of its own — the model carries the text of every
 * task with its line, and that is where the provenance comes from.
 *
 * What the requirement fixes about such a command:
 *
 *  - the WORKING DIRECTORY is the repository root;
 *  - the TIME LIMIT is that of the entry point of F105-FR-017 whose kind it
 *    runs, else 1800 seconds;
 *  - a command that cannot be written as a fixed argument list is a BLOCKER
 *    and never a guess — so a pipe, a redirection, a `&&`, a variable, a glob
 *    or an unbalanced quotation mark is refused here and recorded among the
 *    `ambiguities` with its provenance (F105-FR-015);
 *  - the launch contract's derivation writes these values into the
 *    verification-commands document it stores, so this source and that
 *    document agree by construction.
 */
import type {
  CanonicalSpecModel,
  SpecPhase,
  SpecSource,
} from "@specstride/contracts/records/canonical-spec-model";
import { pythonJson, stableId } from "../plan/hash.ts";
import { DEFAULT_DECLARED_KIND, type PlanCommand } from "../plan/record.ts";
import { TOOLCHAINS } from "./discovery.ts";
import { notAFixedArgumentList, type Blocker, type Provenance } from "./finding.ts";
import { DEFAULT_TIME_LIMIT_SEC, type SourceContribution } from "./registry.ts";

/** The id this source registers under (F105-FR-015). */
export const SOURCE_ID = "literal" as const;

/** The characters a shell would read, which make a command no fixed list. */
export const CHARACTERS_A_SHELL_WOULD_READ = [
  "|",
  "&",
  ";",
  ">",
  "<",
  "$",
  "`",
  "*",
  "?",
  "(",
  ")",
  "{",
  "}",
  "\n",
] as const;

/** The kinds whose time limit comes from the entry points of F105-FR-017. */
export function timeLimitOfKind(kind: string): number {
  for (const toolchain of TOOLCHAINS) {
    for (const entry of toolchain.entryPoints) {
      if (entry.kind === kind) return entry.timeoutSec;
    }
  }
  return DEFAULT_TIME_LIMIT_SEC;
}

/** The kind a literal command runs, read from the words of the command. */
export function kindOfLiteral(text: string): string {
  const lower = text.toLowerCase();
  for (const kind of ["test", "build", "lint", "format"]) {
    if (new RegExp(`\\b${kind}\\b`).test(lower)) return kind;
  }
  return DEFAULT_DECLARED_KIND;
}

/** The three forms a literal declaration may take (F105-FR-015). */
export const DECLARATION_FORMS = ["back-ticked", "fenced", "command-line"] as const;
export type DeclarationForm = (typeof DECLARATION_FORMS)[number];

/** One literal declaration, before it is read as an argument list. */
export type LiteralDeclaration = {
  readonly text: string;
  readonly form: DeclarationForm;
  readonly phase: number;
  readonly taskId: string;
  readonly provenance: Provenance;
};

/** The declarations inside the text of one task. */
export function declarationsInText(input: {
  readonly text: string;
  readonly phase: number;
  readonly taskId: string;
  readonly file: string;
  readonly line: number;
}): readonly LiteralDeclaration[] {
  const out: LiteralDeclaration[] = [];
  const base = {
    phase: input.phase,
    taskId: input.taskId,
    provenance: Object.freeze({ file: input.file, line: input.line }),
  };
  for (const match of input.text.matchAll(/`([^`\n]+)`/g)) {
    const body = match[1]!.trim();
    // A span of ONE token in back-ticks names a thing of the prose — an
    // identifier, a type, an event name, a file (`scanBeforeTheCommit`,
    // `commit_gate.started`): it is not a command line, and reading it as
    // one made one task's own prose disagree with itself, so the plan of
    // the run refused at launch (F153-FR-010) with the false blocker
    // `declarations-disagree`. F105-FR-015 declares COMMANDS written in
    // the plan or the task list: a command line carries an executable and
    // its arguments, separated by blanks. A span that holds no blank is
    // never a command; the other forms (a `Command:` line, a fenced block)
    // keep their rule.
    if (body !== "" && !/\s/.test(body)) continue;
    out.push(Object.freeze({ text: body, form: "back-ticked" as const, ...base }));
  }
  for (const match of input.text.matchAll(/^[ \t]*Command:[ \t]*(.+)$/gm)) {
    out.push(Object.freeze({ text: match[1]!.trim(), form: "command-line" as const, ...base }));
  }
  for (const match of input.text.matchAll(/```[a-zA-Z]*\n([^\n]+)\n```/g)) {
    out.push(Object.freeze({ text: match[1]!.trim(), form: "fenced" as const, ...base }));
  }
  return Object.freeze(out.filter((one) => one.text !== ""));
}

/**
 * The argument list of a literal declaration, or `undefined` where it cannot
 * be written as one (F105-FR-015). Quotation marks are read; a character a
 * shell would read, and an unbalanced quotation mark, give `undefined` and a
 * blocker — never a guess.
 */
export function argumentListOf(text: string): readonly string[] | undefined {
  const parts: string[] = [];
  let current = "";
  let quote: '"' | "'" | undefined;
  let open = false;
  for (const character of text) {
    if (quote !== undefined) {
      if (character === quote) {
        quote = undefined;
        continue;
      }
      current += character;
      open = true;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      open = true;
      continue;
    }
    if ((CHARACTERS_A_SHELL_WOULD_READ as readonly string[]).includes(character)) return undefined;
    if (character === " " || character === "\t") {
      if (open) parts.push(current);
      current = "";
      open = false;
      continue;
    }
    current += character;
    open = true;
  }
  if (quote !== undefined) return undefined;
  if (open) parts.push(current);
  return parts.length === 0 ? undefined : Object.freeze(parts);
}

/** The blocker a declaration that is no fixed argument list gives. */
export function blockerOf(declaration: LiteralDeclaration): Blocker {
  return notAFixedArgumentList({
    message:
      `the command \`${declaration.taskId}\` declared literally as ` +
      `"${declaration.text}" cannot be written as a fixed argument list and is never guessed`,
    provenance: Object.freeze([declaration.provenance]),
  });
}

/** The source of a model whose kind names the plan or the task list. */
export function sourcesOfTheModel(model: CanonicalSpecModel): readonly SpecSource[] {
  return Object.freeze(model.sources.filter((one) => one.kind === "plan" || one.kind === "tasks"));
}

/** The file a declaration of a phase is reported in (F105-FR-015). */
export function fileOfTheDeclarations(model: CanonicalSpecModel): string {
  const sources = sourcesOfTheModel(model);
  return sources[0]?.path ?? model.sources[0]?.path ?? "";
}

/** Every literal declaration of a phase of the canonical spec model. */
export function declarationsOfPhase(input: {
  readonly phase: Pick<SpecPhase, "number" | "tasks">;
  readonly file: string;
}): readonly LiteralDeclaration[] {
  return Object.freeze(
    (input.phase.tasks ?? []).flatMap((task) =>
      declarationsInText({
        text: task.text,
        phase: input.phase.number,
        taskId: task.id,
        file: input.file,
        line: task.line,
      }),
    ),
  );
}

/** The executables a plan's toolchains actually run (F105-FR-015). */
const TOOL_EXECUTABLES: ReadonlySet<string> = Object.freeze(
  new Set([
    "npm",
    "node",
    "npx",
    "pnpm",
    "yarn",
    "git",
    "sh",
    "bash",
    "cat",
    "grep",
    "sed",
    "awk",
    "make",
    "python",
    "python3",
    "pip",
    "rm",
    "cp",
    "mv",
    "ls",
    "echo",
    "mkdir",
    "touch",
    "curl",
    "jq",
    "diff",
    "tar",
    "sleep",
    "true",
    "false",
    "kill",
    "ps",
    "head",
    "tail",
    "wc",
    "sort",
    "uniq",
    "cut",
    "xargs",
    "find",
    "env",
    "cd",
    "printf",
    "date",
    "sha256sum",
    "base64",
    "chmod",
    "ln",
    "rsync",
    "docker",
    "gh",
    "trap",
    "wait",
    "exit",
    "source",
    "set",
    "unset",
    "export",
    "read",
    "pwd",
    "which",
    "stat",
    "tee",
    "realpath",
    "dirname",
    "basename",
    "mktemp",
    "rmdir",
    "truncate",
    "install",
  ]),
);

/** A path-like executable: the script a task line runs directly. */
function executableIsPathLike(first: string): boolean {
  if (/[\s"'`(){}=<>|;&$#*?!]/.test(first)) return false;
  return first.includes("/") || /\.(ts|mjs|js|sh)$/.test(first);
}

/**
 * The source itself (F105-FR-015): the commands declared literally in the plan
 * or the task list, with the repository root as the working directory and the
 * time limit of the entry point whose kind each runs.
 *
 * The back-ticked spans of a TASK LINE are prose markup first: a corpus that
 * writes identifiers, types, event names and schemas in back-ticks (`T393`
 * declares two constants of code in spans) hands the naive reading — every
 * span is a command — a hundred false declarations per file, and the plan of
 * the run then refuses at launch (F153-FR-010) on the feature's own task
 * list, which no launch may do. So the back-ticked form declares only where
 * the span READS as a command line: it carries blanks (one token is an
 * identifier, never a command), its executable is a word of the toolchains
 * or a script path (a bare word like `scanBeforeTheCommit` or a signature
 * like `process.kill(pid, 0)` is prose, not a program), and it names ONE
 * line per task — a task whose prose holds several declares none (the
 * ambiguity is recorded, never guessed). A template of commands
 * (`counter-<x>.txt`) is never a declaration: its instances would be a
 * guess. The EXPLICIT forms keep the strict rule of F105-FR-015: a
 * `Command:` line or a fenced block that parses declares, and one that
 * cannot be written as a fixed argument list is a blocker and never a guess;
 * a known-tool back-ticked span that cannot be written as one blocks the
 * same way (`cat counter-a.txt | grep one`). Two sources that disagree stay
 * blockers (the conflict rules run over the contributions unchanged).
 */
export function readLiteralSource(input: {
  readonly model: CanonicalSpecModel;
  readonly repositoryRoot: string;
}): SourceContribution {
  const file = fileOfTheDeclarations(input.model);
  const commands: PlanCommand[] = [];
  const blockers: Blocker[] = [];
  const ambiguities: string[] = [];
  /** The back-ticked candidates of one task, keyed `phase:taskId`. */
  const taskCommands = new Map<
    string,
    { declaration: LiteralDeclaration; argv: readonly string[] }[]
  >();
  for (const phase of input.model.phases) {
    for (const declaration of declarationsOfPhase({ phase, file })) {
      if (declaration.form === "back-ticked") {
        // The prose markup of a task line: only a span that reads as a
        // command line may declare, and only alone in its task.
        const text = declaration.text;
        if (!/\s/.test(text)) continue;
        const first = text.split(/\s+/)[0] ?? "";
        if (!TOOL_EXECUTABLES.has(first) && !executableIsPathLike(first)) continue;
        // A template of commands (`counter-<x>.txt`) is never declared: the
        // instances would be a guess (F105-FR-015).
        if (/<[A-Za-z][A-Za-z0-9_-]*>/.test(text)) continue;
        const argv = argumentListOf(text);
        if (argv === undefined) {
          blockers.push(blockerOf(declaration));
          continue;
        }
        const key = `${declaration.phase}:${declaration.taskId}`;
        const bucket = taskCommands.get(key);
        if (bucket === undefined) taskCommands.set(key, [{ declaration, argv }]);
        else bucket.push({ declaration, argv });
        continue;
      }
      const argv = argumentListOf(declaration.text);
      if (argv === undefined) {
        blockers.push(blockerOf(declaration));
        continue;
      }
      const kind = kindOfLiteral(declaration.text);
      const [executable, ...args] = argv;
      commands.push(
        Object.freeze({
          id: stableId(
            "CMD",
            `literal:${declaration.taskId}:${declaration.phase}:${pythonJson([...argv])}:${input.repositoryRoot}`,
          ),
          kind,
          label: `${declaration.taskId} (declared literally)`,
          executable: executable!,
          args: Object.freeze(args),
          // The repository ROOT is the working directory (F105-FR-015).
          cwd: input.repositoryRoot,
          // The time limit of the entry point whose kind it runs, else 1800 s.
          timeoutSec: timeLimitOfKind(kind),
          source: SOURCE_ID,
          declaredId: declaration.taskId,
          phase: declaration.phase,
          provenance: declaration.provenance,
        }),
      );
    }
  }
  // A task whose prose names EXACTLY ONE command line declares it; a task
  // whose prose names several (or whose only spans are identifiers) declares
  // nothing — the ambiguity is recorded, never guessed (F105-FR-015).
  for (const [key, candidates] of taskCommands) {
    if (candidates.length !== 1) {
      ambiguities.push(
        `the task \`${key}\` carries ${String(candidates.length)} spans that read as ` +
          "command lines; the task declares none of them (never a guess)",
      );
      continue;
    }
    const { declaration, argv } = candidates[0]!;
    const kind = kindOfLiteral(declaration.text);
    const [executable, ...args] = argv;
    commands.push(
      Object.freeze({
        id: stableId(
          "CMD",
          `literal:${declaration.taskId}:${declaration.phase}:${pythonJson([...argv])}:${input.repositoryRoot}`,
        ),
        kind,
        label: `${declaration.taskId} (declared literally)`,
        executable: executable!,
        args: Object.freeze(args),
        // The repository ROOT is the working directory (F105-FR-015).
        cwd: input.repositoryRoot,
        // The time limit of the entry point whose kind it runs, else 1800 s.
        timeoutSec: timeLimitOfKind(kind),
        source: SOURCE_ID,
        declaredId: declaration.taskId,
        phase: declaration.phase,
        provenance: declaration.provenance,
      }),
    );
  }
  return Object.freeze({
    sourceId: SOURCE_ID,
    commands: Object.freeze(commands),
    blockers: Object.freeze(blockers),
    findings: Object.freeze([]),
    assumptions: Object.freeze([]),
    ambiguities: Object.freeze(ambiguities),
  });
}
