import { all, exist, is } from '../check/main';
import { warnErr } from '../warn';
import { detectRuntime, type JSRuntime } from '../platform/platform';

const defaultLookUp = { default: 2 };

const lookUpFnName = 'lookUpInStack';

/**
 * Utility function to inspect the call stack at a specified depth.
 *
 * This function attempts to parse the JavaScript error stack trace to
 * extract file path, filename, line, and column information at a
 * configurable depth level relative to the runtime environment.
 *
 * @param p - Configuration object specifying stack frame indices by runtime.
 *   - `default` (required): fallback stack depth index to use if no runtime-specific index is provided.
 *   - Other keys (optional): runtime-specific stack depth indices, keyed by `JSRuntime` string.
 *
 * @note
 * - Stack trace output can vary between synchronous and asynchronous calls,
 *   as well as across different runtimes (Node, Bun, Deno, Browser, etc.).
 * - Manual tuning of depth indices may be required for reliable results.
 * - Depth index 1 corresponds to the immediate call of this function.
 * - Depth index 2 corresponds to the caller of this fn.
 *
 * @returns An object containing:
 * - `stack`: Array of trimmed stack trace lines.
 * - `filepath`: Full path (string) to the source file at the target stack depth, or `null` if unavailable.
 * - `filename`: Base filename extracted from the path, or `null`.
 * - `line`: Line number (string) in the source file, or `null`.
 * - `column`: Column number (string) in the source file, or `null`.
 */
export function lookUpInStack(
	p?: { default: number } & Partial<Record<JSRuntime, number>>,
) {
	const param = { ...defaultLookUp, ...(p || {}) };
	const runtime = detectRuntime();

	if (!all.values(param, (v) => is.number(v))) {
		warnErr({
			label: lookUpFnName,
			error: new TypeError('Invalig Param', {
				cause: 'Expecting every keys of the lookUpConfig to be a number',
			}),
			throw: true,
		});
	}

	const index = param[runtime] || param['default'];
	const mock = new Error()?.stack || '';
	const stack = mock.split('\n').map((v) => v.trim());
	stack.shift(); // Remove the 1st element;

	const target = stack[index];

	if (!exist(target)) {
		warnErr({
			label: lookUpFnName,
			error: new Error(
				'Target line in stack could not be found, defaulting to full stack',
			),
			nostack: true,
		});
		return { stack, filepath: null, line: null, column: null, filename: null };
	}

	const filepath = target
		?.split(' ')
		.map((l) => l.trim())
		.filter(exist)
		.at(-1)
		?.replace(/^\(|\)$/g, '');

	const infos = filepath?.match(/(.*):(\d+):(\d+)/);

	const filename = infos?.[1]?.split(/\//g).filter(exist).at(-1) || null;
	const line = infos?.[2] || null;
	const column = infos?.[3] || null;

	return { stack, filepath, filename, column, line };
}

export type StackLookUp = ReturnType<typeof lookUpInStack>;
