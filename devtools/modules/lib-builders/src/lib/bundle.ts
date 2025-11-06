import { build, type BuildOptions } from "esbuild";

export type BundlingParameters = {
	mode: "file";
	targets: {
		entry: string;
		outfile: string;
		variant?: ("esm" | "cjs" | "iife")[];
		options: {
			tsconfig?: string;
			eternal?: string[];
			minify?: boolean;
			minifySyntax?: true;
			minifyWhitespace?: true;
			minifyIdentifiers?: boolean;
			plateform: "node" | "browser" | "neutral";
		};
		extraOpts?: Partial<BuildOptions>;
	}[];
};

export async function Bundle(config: BundlingParameters) {
	if (!config.targets?.length) {
		console.warn("\x1b[33m⚠️  No bundle targets provided.\x1b[0m"); // yellow
		return false;
	}

	for (const target of config.targets) {
		const variants = target.variant ?? ["esm"];
		for (const v of variants) {
			const esbuildOpts: BuildOptions = {
				entryPoints: [target.entry],
				outfile: target.outfile.replace(/\.js$/, `.${v}.js`),
				format: v,
				platform: target.options.plateform,
				tsconfig: target.options.tsconfig,
				bundle: true,
				minify: !!target.options.minify,
				minifySyntax: target.options.minifySyntax ?? undefined,
				minifyWhitespace: target.options.minifyWhitespace ?? undefined,
				minifyIdentifiers: target.options.minifyIdentifiers ?? undefined,
				...(target.extraOpts ?? {}),
			};

			console.log(
				`\x1b[36m➡️  Building\x1b[0m \x1b[1m${target.entry}\x1b[0m → \x1b[32m${esbuildOpts.outfile}\x1b[0m (\x1b[35m${v}\x1b[0m)`
			);

			try {
				await build(esbuildOpts);
				console.log(
					`\x1b[32m✅ Successfully built\x1b[0m ${target.entry} → ${esbuildOpts.outfile}`
				);
			} catch (err) {
				console.error("\x1b[31m❌ Bundle step failed:\x1b[0m", err);
				return false;
			}
		}
	}

	return true;
}
