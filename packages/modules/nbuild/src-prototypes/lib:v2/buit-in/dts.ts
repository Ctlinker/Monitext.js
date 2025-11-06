import { Step } from '../step';
import { build } from 'tsup';

type DtsStepParams = {
	mode: 'file';
	entry: string;
	outfile: string;
	tsconfig?: string; // optional
};

export const Dts = new Step<DtsStepParams, "dts">({
	name: 'dts',
	exec: async ({ config, getHelpers }) => {
		const helpers = getHelpers;

		if (!config.entry || !config.outfile) {
			console.warn('⚠️ DTS step requires entry and outfile.');
			return false;
		}

		helpers.run({
			cmd: 'echo',
			args: [`Generating declaration for ${config.entry} → ${config.outfile}`],
		});

		try {
			await build({
				entry: [config.entry],
				dts: true,
				outDir: config.outfile.replace(/\/?[^/]+$/, ''), // folder of outfile
				tsconfig: config.tsconfig,
				minify: false,
				splitting: false,
				format: ['cjs', 'esm'], // optional: could customize
				clean: true,
			});
		} catch (err) {
			console.error('❌ DTS generation failed:', err);
			return false;
		}

		console.log(`✅ Declaration file generated: ${config.outfile}`);
		return true;
	},
});
