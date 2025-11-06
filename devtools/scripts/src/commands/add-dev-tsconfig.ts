import { writeFileSync } from "fs";
import { Script } from "../lib/command";
import { join } from "node:path";

Script.command("gen-ts <at>")
    .description("Generate a set of tsconfig ts config")
    .action(({ at }: { at: string }) => {
        const configs = {
            base: { extends: "@monitext-devtools/tsconfig" },
            main: {
                extends: "tsconfig.base.json",
                include: ["./src/**", "./test/**"],
            },
            build: {
                extends: "tsconfig.base.json",
                include: ["./src/**"],
            },
        };

        const files: string[] = [];

        for (const [key, value] of Object.entries(configs)) {
            files.push(`tsconfig${key === "main" ? "." + key : ""}.json`);
            writeFileSync(
                join(at, files.at(-1) as string),
                JSON.stringify(value),
            );
        }

        console.log("Wrtiten at :", at, "Files:", "\n", files.join("\n"));
    });
