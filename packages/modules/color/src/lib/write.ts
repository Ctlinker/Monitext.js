import { CodeParam, code as codeStr } from '../lang/code';
import { bgHex, cols, hex } from './colorPack';
import { hr } from './horizontalRule';
import { Theme } from '../lang/regitery';

interface writeParam {
	cols: typeof cols;
	hex: typeof hex;
	code: (p: CodeParam) => string;
	bgHex: typeof bgHex;
	pretty: writingVar['pretty'];
	push: writingVar['push'];
}

type writeFn = (param: writeParam) => void;

type writingVar = ReturnType<typeof createWritingVar>;

type asyncWriteFn = (param: writeParam) => Promise<void>;

function createWritingVar() {
	const configs = {
		join: '\n',
		inputs: [] as string[],
		theme: undefined as undefined | Theme,
	};

	const push = (s: string): void => {
		configs.inputs.push(s);
	};

	const pretty = {
		hr,
		joinWith(char: string) {
			configs.join = char;
		},
		setCodeTheme(s: Theme) {
			configs.theme = s;
		},
	};
	return {
		configs,
		pretty,
		push,
	};
}

function renderWithConstrain({ inputs, join }: writingVar['configs']) {
	return inputs.join(join);
}

/**
 * A utility function that wraps a given write function and determines whether it is asynchronous or synchronous.
 * Based on the type of the provided function, it delegates the execution to either `writeAsync` or `writeSync`.
 *
 * @template T - The type of the write function, which can be either `writeFn` (synchronous) or `asyncWriteFn` (asynchronous).
 *
 * @param fn - The write function to be executed. It can be a synchronous function (`writeFn`) or an asynchronous function (`asyncWriteFn`).
 *
 * @returns - If the provided function is asynchronous (`asyncWriteFn`), it returns the result of `writeAsync`.
 *            If the provided function is synchronous (`writeFn`), it returns the result of `writeSync`.
 */
export function write<T extends writeFn | asyncWriteFn>(
	fn: T,
): T extends asyncWriteFn
	? ReturnType<typeof writeAsync>
	: ReturnType<typeof writeSync> {
	const isAsync = fn.constructor.name === 'AsyncFunction';
	if (isAsync) {
		return writeAsync(fn as asyncWriteFn) as any;
	} else {
		return writeSync(fn as writeFn) as any;
	}
}

/**
 * Synchronously writes data using the provided writing function.
 *
 * @param fn - A callback function of type `writeFn` that is responsible for
 *             handling the writing process. It receives an object containing:
 *             - `pretty`: A utility for formatting output.
 *             - `push`: A function to append data.
 *             - `cols`: Columns or constraints for the data structure.
 *
 * @returns The result of rendering with constraints, based on the configurations.
 */
export function writeSync(fn: writeFn) {
	const { configs, pretty, push } = createWritingVar();
	fn({
		pretty,
		push,
		cols,
		hex,
		bgHex,
		code(param) {
			return codeStr({ ...param, theme: param.theme || configs.theme });
		},
	});
	return renderWithConstrain({ ...configs });
}

/**
 * Asynchronously writes data using the provided `asyncWriteFn` function.
 *
 * This function initializes writing variables, including configurations,
 * a pretty-printing utility, and a push function. It then invokes the
 * provided `asyncWriteFn` with these variables. After the function completes,
 * the configurations are rendered with constraints and returned.
 *
 * @param fn - An asynchronous function (`asyncWriteFn`) that performs the
 *             writing operation. It receives an object containing:
 *             - `pretty`: A utility for pretty-printing.
 *             - `push`: A function to push data.
 *             - `cols`: (Assumed) column-related data.
 *
 * @returns A promise that resolves to the result of `renderWithConstrain`
 *          with the generated configurations.
 */
export async function writeAsync(fn: asyncWriteFn) {
	const { configs, pretty, push } = createWritingVar();
	await fn({
		pretty,
		push,
		cols,
		bgHex,
		hex,
		code(param) {
			return codeStr({ ...param, theme: param.theme || configs.theme });
		},
	});
	return renderWithConstrain({ ...configs });
}
