/**
 * Checks if a value exists (is truthy).
 * - Returns `true` for any non-falsy value (`true`, non-empty string, non-zero number, object, etc.).
 * - Returns `false` for falsy values (`false`, `0`, `""`, `null`, `undefined`, `NaN`).
 *
 * @param d The value to check.
 * @returns `true` if the value is truthy, otherwise `false`.
 *
 * @example
 * exist("hello"); // true
 * exist(0);       // false
 * exist(null);    // false
 */
export function exist(d: unknown): boolean {
	return !!d;
}

/**
 * Checks if a value does not exist (is falsy).
 * - Returns `true` for falsy values (`false`, `0`, `""`, `null`, `undefined`, `NaN`).
 * - Returns `false` for any non-falsy value (`true`, non-empty string, non-zero number, object, etc.).
 *
 * @param d The value to check.
 * @returns `true` if the value is falsy, otherwise `false`.
 *
 * @example
 * notExist("hello"); // false
 * notExist(0);       // true
 * notExist(null);    // true
 */
export function notExist(d: unknown): boolean {
	return !d;
}

/**
 * Check whether all provided arguments are truthy (exist).
 *
 * @param d - Variable number of values to check for truthiness.
 * @returns `true` if all provided values are truthy, otherwise `false`.
 *
 * @example
 * exists("hello", 42, true); // true
 * exists("hello", 0, true); // false (0 is falsy)
 * exists(); // true (vacuous truth - no values to check)
 */
export function exists(...d: unknown[]): boolean {
	return d.every((v) => !!v);
}
