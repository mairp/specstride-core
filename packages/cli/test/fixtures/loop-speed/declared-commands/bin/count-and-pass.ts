import { writeFileSync } from "node:fs";
const [file] = process.argv.slice(2);
writeFileSync(file, "counted\n");
