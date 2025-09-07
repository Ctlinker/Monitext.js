/**
 * Collection of "all" checks.
 *
 * These helpers validate that multiple values match a given type or structure.
 */
export const are = {
	/**
	 * Check whether **all** provided arguments are strings.
	 */
	string(...d: unknown[]) {
		return d.every((v) => typeof v === 'string');
	},

	/**
	 * Check whether **all** provided arguments are numbers (finite).
	 */
	number(...d: unknown[]) {
		return d.every((v) => typeof v === 'number' && Number.isFinite(v));
	},

	/**
	 * Check whether **all** provided arguments are booleans.
	 */
	boolean(...d: unknown[]) {
		return d.every((v) => typeof v === 'boolean');
	},

	/**
	 * Check whether **all** provided arguments are null.
	 */
	null(...d: unknown[]) {
		return d.every((v) => v === null);
	},

	/**
	 * Check whether **all** provided arguments are undefined.
	 */
	undefined(...d: unknown[]) {
		return d.every((v) => v === undefined);
	},

	/**
	 * Check whether **all** provided arguments are symbols.
	 */
	symbol(...d: unknown[]) {
		return d.every((v) => typeof v === 'symbol');
	},

	/**
	 * Check whether **all** provided arguments are objects (non-null).
	 */
	object(...d: unknown[]) {
		return d.every((v) => typeof v === 'object' && v !== null);
	},

	/**
	 * Check whether **all** provided arguments are arrays.
	 */
	array(...d: unknown[]) {
		return d.every(Array.isArray);
	},
};
