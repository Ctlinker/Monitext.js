#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createMinifier } from "dts-minify";
import * as ts from "typescript";
import { Script } from "../lib/command";

Script
    .command("ts-dts-minify")
    .description("Minify TypeScript declaration files (.d.ts)")
    .requiredOption("-i, --input <file>", "input .d.ts file")
    .requiredOption("-o, --output <file>", "output file path")
    .action((options: { input: string; output: string }) => {
        const inPath = resolve(options.input);
        const outPath = resolve(options.output);

        console.log(`🔄 Minifying TypeScript declaration: ${inPath}`);
        const minifier = createMinifier(ts);
        const content = readFileSync(inPath, "utf8");
        const minified = minifier.minify(content);

        writeFileSync(outPath, minified);
        console.log(`✅ Minified file saved to: ${outPath}`);
    });
