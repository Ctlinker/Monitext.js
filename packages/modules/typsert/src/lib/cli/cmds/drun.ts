import path from "node:path";
import { TypeAssertionCLI } from "../cmd.js";
import { runTypeTests } from "../exec.js";
import chokidar from "chokidar";

TypeAssertionCLI
  .command("drun <directory>")
  .description("Run type assertions in a directory")
  .option("-w, --watch", "Watch files and rerun on changes")
  .action(async (directory: string, options: { tsConfig?: string; watch?: boolean }) => {
    const cwd = process.cwd();
    const tsconfigPath = options.tsConfig ?? path.join(cwd, "tsconfig.json");

    const run = async () => {
      console.clear();
      console.log(`\n🧠 Running type assertions in: ${directory}`);
      const result = await runTypeTests({ tsconfig: tsconfigPath, directory, cwd });
      console.log("\n");
      return result;
    };

    // Initial run
    let result = await run();

    // Watch mode
    if (options.watch) {
      const watcher = chokidar.watch(path.join(directory, "**/*.typsert-test.ts"), {
        ignoreInitial: true,
      });

      watcher.on("all", async (event, changedPath) => {
        console.log(`\n🔄 Detected ${event} on ${changedPath}`);
        result = await run();
      });

      console.log(`\n👀 Watching for changes in ${directory}...`);
    } else {
      process.exit(result.failed > 0 ? 1 : 0);
    }
  });