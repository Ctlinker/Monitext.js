/**
 * Collection of single-value type and structure checks.
 */

export const is = {
	/**
	 * Check if a value is an instance of a given constructor/class.
	 */
	instanceof<T>(d: unknown, t: new (...args: any[]) => T): d is T {
		return d instanceof t;
	},

	/** Single value type checks for primitives */
	string(d: unknown): d is string {
		return typeof d === 'string';
	},

	number(d: unknown): d is number {
		return typeof d === 'number' && Number.isFinite(d);
	},

	boolean(d: unknown): d is boolean {
		return typeof d === 'boolean';
	},

	null(d: unknown): d is null {
		return d === null;
	},

	undefined(d: unknown): d is undefined {
		return d === undefined;
	},

	symbol(d: unknown): d is symbol {
		return typeof d === 'symbol';
	},

	object(d: unknown): d is object {
		return typeof d === 'object' && d !== null;
	},

	array(d: unknown): d is unknown[] {
		return Array.isArray(d);
	},
};
