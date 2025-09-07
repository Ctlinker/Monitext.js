import { chalkCSSPolify, ChalkStyleKeys } from './colorPolify';
import { writePseudoColorLang } from './pseudoLang';

/**
 * @fileoverview This file manages the application of chainable styles to strings
 * using a pseudo-language system, inspired by the Chalk library.
 */

/**
 * @class ChainedColor
 * @description
 * Manages the stack of accumulated styles for a style chain.
 * This class maintains the state of the color chaining.
 */
class ChainedColor {
	// Accumulated style stack
	private styleStack: string[] = [];

	/**
	 * Creates an instance of ChainedColor.
	 * @param {string[]} [initialStyles=[]] - Initial styles to add to the stack.
	 */
	constructor(initialStyles: string[] = []) {
		this.styleStack = initialStyles;
	}

	/**
	 * Applies all accumulated styles to one or more strings.
	 * This method is the endpoint of the chaining.
	 * @param {string[]} content - The content to style.
	 * @returns {string} The styled string in pseudo-language.
	 */
	public apply(...content: string[]): string {
		return writePseudoColorLang(this.styleStack, content.join(' '));
	}

	/**
	 * Adds styles to the current stack.
	 * The method prefixes the style stack so that the most recent styles
	 * (those closest to the string) are applied last.
	 * @param {string[]} style - The styles to add.
	 */
	public extends(style: string[]) {
		this.styleStack = [...style, ...this.styleStack];
	}
}

/**
 * @function createChainFn
 * @description
 * Creates a chainable function using a Proxy to apply styles.
 * Each chained call (`.bold`, `.dim`) returns the same Proxy object,
 * which updates its internal state.
 * @returns {unknown} The chainable Proxy.
 */
function createChainFn() {
	const chain = new ChainedColor();
	const styleFn = function (..._text: string[]) {};

	const P = new Proxy(styleFn, {
		apply: function (_target, _thisArg, argumentsList) {
			return chain.apply(...(argumentsList as string[]));
		},
		get(target, property) {
			if (property in chalkCSSPolify) {
				chain.extends([property as string]);
				return P;
			}
			return (target as any)[property] as any;
		},
	});

	/**
	 * Attaches the `extends` method of ChainedColor to the Proxy's prototype.
	 * This allows the `ChainedColor` instance to be shared across chained calls
	 * and different `hex` and `bgHex` functions.
	 * @private
	 */
	P.prototype.___$extends_color_chain___ = chain.extends.bind(chain);

	return P;
}

/**
 * @interface ColorChain
 * @description
 * Represents the structure of a chainable object for colors and styles.
 * It is both a callable function and an object with chaining properties.
 */
export type ColorChain = {
	[K in ChalkStyleKeys]: ((...content: string[]) => string) & ColorChain;
};

/**
 * @interface HexChain
 * @description
 * Represents a chainable object that starts with a hexadecimal style.
 */
export type ColorFn = ((...content: string[]) => string) & ColorChain;

type hex = number | string;

/**
 * @typedef {string} hexadecimal
 * @description
 * A utility type for 3 or 6-digit hexadecimal color formats,
 * prefixed with '#'.
 */
type hexadecimal =
	| `#${hex}${hex}${hex}`
	| `#${hex}${hex}${hex}${hex}${hex}${hex}`;

/**
 * @constant cols
 * @description
 * The entry point for the basic color and style chain.
 * @type {ColorChain}
 */
export const cols = createChainFn() as unknown as ColorChain;

/**
 * @function hex
 * @description
 * Creates a style chain that starts with a hexadecimal color.
 * @param {hexadecimal} hexadecimal - The hexadecimal color (e.g., "#ff0000").
 * @returns {HexChain} A chainable object.
 */
export function hex(hexadecimal: hexadecimal) {
	const hexFn = createChainFn();
	hexFn.prototype.___$extends_color_chain___(['hex' + hexadecimal]);
	return hexFn as unknown as ColorFn;
}

/**
 * @function bgHex
 * @description
 * Creates a style chain that starts with a hexadecimal background color.
 * @param {hexadecimal} hexadecimal - The hexadecimal color (e.g., "#ff0000").
 * @returns {HexChain} A chainable object.
 */
export function bgHex(hexadecimal: hexadecimal) {
	const hexFn = createChainFn();
	hexFn.prototype.___$extends_color_chain___(['bgHex' + hexadecimal]);
	return hexFn as unknown as ColorFn;
}
