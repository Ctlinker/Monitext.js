import { build, type Options } from "tsup";

export type DtsStepParams = {
	mode: "file";
	entry: string;
	outfile: string;
	tsconfig?: string;
};

export async function GenerateDts(config: DtsStepParams) {
	if (!config.entry || !config.outfile) {
		console.warn("\x1b[33m⚠️ DTS step requires entry and outfile.\x1b[0m");
		return false;
	}

	console.log(
		`\x1b[36m➡️  Generating DTS\x1b[0m \x1b[1m${config.entry}\x1b[0m → \x1b[32m${config.outfile}\x1b[0m`
	);

	const tsupOptions: Options = {
		entry: [config.entry],
		dts: true,
		outDir: config.outfile.replace(/\/?[^/]+$/, ""),
		format: ["cjs", "esm"],
		minify: false,
		clean: false,
		tsconfig: config.tsconfig,
		splitting: false, // optional,
	};

	try {
		await build(tsupOptions);
		console.log(`\x1b[32m✅ Declaration file generated:\x1b[0m ${config.outfile}`);
	} catch (err) {
		console.error("\x1b[31m❌ DTS generation failed:\x1b[0m", err);
		return false;
	}

	return true;
}
