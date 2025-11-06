import { Step } from '../step';
import { build, BuildOptions } from 'esbuild';

type BundlingParameters = {
	mode: 'file';
	targets: {
		entry: string;
		outfile: string;
		variant?: ('esm' | 'cjs' | 'iife')[];
		options: {
			tsconfig?: string;
			eternal?: string[];
			minify?: boolean;
			minifySyntax?: true;
			minifyWhitespace?: true;
			minifyIdentifiers?: boolean;
			plateform: 'node' | 'browser' | 'neutral';
		};
		extraOpts?: Partial<BuildOptions>;
	}[];
};

export const Bundle = new Step<BundlingParameters, "bundle">({
	name: 'bundle',
	exec({ config, getHelpers }) {
		const helpers = getHelpers;

		if (!config.targets || !config.targets.length) {
			console.warn('⚠️ No bundle targets provided.');
			return false;
		}

		for (const target of config.targets) {
			const variants = target.variant ?? ['esm']; // default to esm if no variant
			for (const v of variants) {
				const esbuildOpts: BuildOptions = {
					entryPoints: [target.entry],
					outfile: target.outfile.replace(/\.js$/, `.${v}.js`),
					format: v,
					platform: target.options.plateform,
					tsconfig: target.options.tsconfig,
                    bundle: true,
					minify: !!target.options.minify,
					// fine-grained minify options
					minifySyntax: target.options.minifySyntax ?? undefined,
					minifyWhitespace: target.options.minifyWhitespace ?? undefined,
					minifyIdentifiers: target.options.minifyIdentifiers ?? undefined,
					// allow extra overrides
					...(target.extraOpts ?? {}),
				};

				helpers.run({
					cmd: 'echo',
					args: [`Building ${target.entry} → ${esbuildOpts.outfile} (${v})`],
				});

				try {
					build(esbuildOpts).catch((err) => {
						console.error('❌ esbuild error:', err);
						throw err;
					});
				} catch (err) {
					console.error('❌ Bundle step failed:', err);
					return false;
				}
			}
		}

		return true;
	},
});
