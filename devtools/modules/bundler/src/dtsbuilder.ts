import { spawn } from 'node:child_process';
import { basename, dirname as dir, resolve } from 'node:path';

/**
 * Utility function to run a shell command.
 * @param cmd - The command to execute.
 * @param args - The arguments to pass to the command.
 * @returns A promise that resolves when the command completes successfully or rejects on failure.
 */
function run(cmd: string, args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { stdio: 'inherit' });
		child.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(
					new Error(
						`Command "${cmd} ${args.join(' ')}" failed with code ${code}`,
					),
				);
			}
		});
	});
}

/**
 * Generates a TypeScript declaration bundle and resolves path aliases.
 * @param param - Configuration parameters for the bundle generation.
 * @param param.entry - The entry file for the TypeScript compiler.
 * @param param.outfile - The output file for the generated declaration bundle.
 * @param param.tsconfig - (Optional) Path to the TypeScript configuration file.
 * @param param.dirname - The base directory for resolving relative paths.
 */
export async function createTSCBundle(param: {
	entry: string;
	outDir: string;
	tsconfig?: string;
	dirname: string;
}) {
	const p = Object.fromEntries(
		Object.keys(param).map((k) => [
			k,
			param[k as keyof typeof param]?.startsWith('.') ||
			!param[k as keyof typeof param]?.startsWith('/')
				? resolve(param.dirname, param[k as keyof typeof param] as string)
				: param[k as keyof typeof param],
		]),
	) as typeof param;

	const base = basename(p.entry);

	function appendToBase(str: string) {
		let intermediate = base.split('.');
		intermediate.pop();
		intermediate.push(str);
		return intermediate.join('.');
	}

	let outfile = appendToBase('d.ts');

	const steps: [string, string[], string][] = [
		[
			'tsup',
			[
				'--dts-only',
				'--dts',
				p.entry, // Remplace 'outfile' par le point d'entrée réel de ton app
				...(p.tsconfig ? ['--tsconfig', p.tsconfig] : []),
				'-d',
				p.outDir,
				p.entry,
			],
			'\n⚙ Tsup:',
		],
		[
			'pnpm',
			[
				'dlx',
				'tsc-alias',
				...(p.tsconfig ? ['-p', p.tsconfig] : []),
				'--outDir',
				dir(p.outDir),
			],
			'\n   → Resolving possible path aliases',
		],
	];

	console.log('📜 Starting TypeScript declaration generation');

	// Execute commands sequentially
	for (const [cmd, args, msg] of steps) {
		try {
			msg.trim() != '' && console.log(msg);
			await run(cmd, args);
		} catch (error) {
			console.error(
				`❌ Error: TSC generation failed for command "${cmd} ${args.join(
					' ',
				)}".`,
			);
			return;
		}
	}

	console.log('   → Files: ', outfile);

	console.log('\n✅ TypeScript declaration generation completed successfully!');
}
