export { write, writeAsync, writeSync } from './lib/write';
export { bgHex, cols, hex } from './lib/colorPack';
export { detectRuntime } from './lib/getRuntime';
export { getTerminalWidth } from './lib/terminal';
export { code, registerLang } from './lang/code';
export { hr } from './lib/horizontalRule';

export {
	createRenderer,
	render,
	renderToBrowser,
	renderToNodeLike,
} from './lib/render';
