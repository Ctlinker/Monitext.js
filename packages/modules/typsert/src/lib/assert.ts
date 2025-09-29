/**
 * Compile-time assertion helper
 *
 * - Input: tuple of [label, boolean]
 * - If all pass, evaluates to `true`
 * - Otherwise, returns union of failure messages
 */
export type Assert<T extends readonly (readonly [string, boolean])[]> =
	T extends readonly (readonly [string, true])[] ? true
		: {
			[K in keyof T]: T[K] extends readonly [
				infer Label extends string,
				infer Result extends boolean,
			] ? Result extends false ? `Assertion failed: ${Label}`
				: never
				: never;
		}[number];

/**
 * Convenience strict checks
 */
export type IsTrue<T extends true> = T;
export type IsFalse<T extends false> = T;

/**
 * Enhanced assertion utilities for complex patterns
 */

/**
 * Check that all assertions in tuple pass (are true)
 */
export type AllPass<T extends readonly boolean[]> = T extends readonly true[]
	? true
	: T;

/**
 * Check that all assertions in tuple fail (are false)
 */
export type AllFails<T extends readonly boolean[]> = T extends readonly false[]
	? true
	: {
		[K in keyof T]: T[K] extends false ? true : false;
	};

/**
 * Check that some (at least one) assertions in tuple pass
 */
export type SomePass<T extends readonly boolean[]> = T extends
	readonly boolean[] ? true extends T[number] ? true
	: false
	: false;

/**
 * Check that some (at least one) assertions in tuple fail
 */
export type SomeFail<T extends readonly boolean[]> = T extends
	readonly boolean[] ? false extends T[number] ? true
	: false
	: false;

/**
 * Rich object result mapping
 */
export type CheckAssertions<
	T extends readonly (readonly [string, boolean | boolean[]])[],
> = {
	[K in keyof T]: T[K] extends readonly [
		infer Label extends string,
		infer Result extends boolean | boolean[],
	] ? Result extends true ? { status: "pass"; label: Label; output: true }
		: { status: "fail"; label: Label; output: Result }
		: never;
};

/**
 * Runtime no-op function for IDE feedback
 * - Allows inspection of results in tooltips, to see result
 */
export declare function TypeAssert<
	T extends readonly (readonly [string, boolean | boolean[]])[],
>(
	param: T extends readonly (readonly [string, true])[] ? true
		: false,
): CheckAssertions<T>;

/**
 * Runtime no-op function for IDE feedback
 * - Allows inspection of results in tooltips
 * - Alias for TypeAssert
 */
export const Typsert = TypeAssert;
