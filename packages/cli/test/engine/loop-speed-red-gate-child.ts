/**
 * The driver of the killed run of `loop-speed-red-gate.test.ts` (T346): a
 * separate process that runs the engine exactly as the test would, so the
 * test can SIGKILL it between two red gates. The engine module and the work
 * directory come from `argv[2]` and `argv[3]`.
 */
const [modulePath, workdir] = process.argv.slice(2);
const { runFeature } = await import(modulePath!);
try {
  const exit = await runFeature({ argv: [], workdir: workdir! });
  process.exit(exit);
} catch (error) {
  console.error(error);
  process.exit(99);
}
