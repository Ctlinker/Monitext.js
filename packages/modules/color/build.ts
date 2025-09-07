import { bundleWithConfig } from '@monitext-devtools/bundler';
import { dependencies } from './package.json';

bundleWithConfig({
	dirname: __dirname,
	label: 'COLOR LIB BUILD',
	options: {
		entryPoints: ['./src/main.ts'],
		outfile: './dist/lib',
		tsconfig: './tsconfig.build.json',
		target: 'es2015',
		platform: 'neutral',
		mainFields: ['main'],
	},
	types: {
		entry: './src/main.ts',
		outDir: './dist/',
		tsconfig: './tsconfig.build.json',
	},
	variants: [
		{
			external: [...Object.keys(dependencies || {})],
			bundle: true,
			minify: false,
		},
		{
			external: [...Object.keys(dependencies || {})],
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
	output: ['cjs', 'esm'],
});
