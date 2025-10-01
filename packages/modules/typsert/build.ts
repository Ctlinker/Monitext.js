import { createTSCBundle } from "@monitext-devtools/bundler";

createTSCBundle({
    entry: "./src/main.ts",
    dirname: __dirname,
    outDir: "./dist",
    tsconfig: "./tsconfig.build.json",
});
