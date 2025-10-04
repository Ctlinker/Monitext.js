import { bundleWithConfig } from "@monitext-devtools/bundler";

bundleWithConfig({
	dirname: __dirname,
	label: "TYPSON LIB BUILD",
	options: {
		entryPoints: ["./src/main.ts"],
		outfile: "./dist/lib",
		tsconfig: "./tsconfig.build.json",
		target: "es2015",
		platform: "neutral",
		mainFields: ["main"],
	},
	types: {
		entry: "./src/main.ts",
		outDir: "./dist/",
		tsconfig: "./tsconfig.build.json",
	},
	variants: [
		{
			external: [],
			bundle: true,
			minify: false,
		},
		{
			external: [],
			bundle: true,
			minify: true,
			minifyIdentifiers: false, // preserve fn names for d.ts match
		},
		{
			external: [], // include everything
			bundle: true,
			minify: true,
			minifyIdentifiers: false, // keep names aligned with types
			minifySyntax: true,
			minifyWhitespace: true,
			treeShaking: true,
		},
	],
	output: ["cjs", "esm"],
});
