import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";
import fg from "fast-glob";
import { cols, render } from "@monitext/nprint";

export async function runTypeTests(params: { tsconfig?: string; directory: string; cwd: string }) {
  const { tsconfig, directory, cwd } = params;

  // Glob all *.typsert-test.ts files
  const files = await fg("**/*.typsert-test.ts", { cwd: path.resolve(cwd, directory) });

  if (files.length === 0) {
    console.log(...render(cols.bold.yellow("⚠️ No typsert test files found.")));
    return { total: 0, passed: 0, failed: 0 };
  }

  // Initialize ts-morph project
  const project = new Project({ tsConfigFilePath: path.resolve(tsconfig || "") });
  const sourceFiles = files.map(f => project.addSourceFileAtPath(path.join(directory, f)));

  let total = 0;
  let passed = 0;
  let failed = 0;

  for (const file of sourceFiles) {
    const calls = file.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      const fnName = call.getExpression().getText();
      if (fnName !== "TypeAssert") continue;

      total++;
      const type = call.getType();
      const returnType = type.getText();

      if (returnType.trim().startsWith("\"✅")) {
        console.log(`✅ ${file.getBaseName()}: ${call.getText()}`);
        passed++;
      } else if (returnType.trim().startsWith("\"❌")) {
        console.log(`❌ ${file.getBaseName()}: ${returnType}`);
        failed++;
      } else {
        console.log(`⚠️ ${file.getBaseName()}: unknown result for ${returnType}`);
      }
    }
  }

  console.log(`\nType assertion summary: ${passed}/${total} passed, ${failed} failed`);
  return { total, passed, failed };
}