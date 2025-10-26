const Build: any = null;
const B: any = null;

Build({
    dir: __dirname,
    run: [
        B.pkg({ run: ["types"] }),

        B.exec({
            cmds: [B.cmd({ exec: ["pnpm dlx vitest --run", "./tsconfig"] })],
        }),

        B.dts({
            mode: "file",
            provider: "tsc",
            opts: {
                entry: "./src/main.ts",
                outDir: "./dist/",
                outFile: "main.d.ts",
                tsconfig: "./tsconfig.build.json",
                minify: true, // Use dts-minify for smaller files
            },
        }),

        B.bundle({
            mode: "file",
            provider: "esbuild",
            opts: {
                entry: "./src/main.ts",
                outfile: "lib", // Base name, extensions added automatically
                variants: [
                    {
                        name: "external-deps",
                        formats: ["cjs", "esm"],
                        external: [],
                        bundle: true,
                        minify: false,
                    },
                    {
                        name: "minified-external",
                        formats: ["cjs", "esm"],
                        external: [],
                        bundle: true,
                        minify: true,
                        minifyIdentifiers: false, // Preserve fn names for d.ts match
                    },
                    {
                        name: "standalone",
                        formats: ["cjs", "esm", "iife"],
                        external: [], // Bundle everything
                        bundle: true,
                        minify: true,
                        minifyIdentifiers: false,
                        minifySyntax: true,
                        minifyWhitespace: true,
                        treeShaking: true,
                    },
                ],
            },
        }),

        B.custom((param: { get: { dirname: any } }) => {
            console.log("Ended build Process");
        }),
    ],
});

const C = B.new({
    plugins: [
        {
            name: "parallel",
            func(param: {
                execBuild: (p: any) => any;
                cfg: Record<string, any>;
                get: { dirname: any };
            }) {
                const targets = param.cfg.run.map(
                    (b: any) => new Promise(() => param.execBuild(b)),
                );
                return Promise.all(targets);
            },
        },
    ],
});

Build({
    dir: __dirname,
    run: C.parallel({
        run: [
            B.pkg({ run: ["test"] }),
            B.cmd("pnpm dlx tsx ./build-for-linux.ts"),
            B.cmd("pnpm dlx tsx ./build-for-win.ts"),
            B.cmd("pnpm dlx tsx ./build-for-mac.ts"),
        ],
    }),
});
