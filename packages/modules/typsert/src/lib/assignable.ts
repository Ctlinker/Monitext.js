/**
 * Check whether a given type `T` is assignable to a source `U`
 * > Note: assignability DOESN'T MEAN EQUALITY
 *
 * - `true` if every value of `T` can be assigned to `U`
 * - `false` otherwise
 */
export type Assignable<T, U> = [T] extends [U] ? true : false;

/**
 * Check whether a given type `T` is not assignable to a source `U`
 */
export type NotAssignable<T, U> = Assignable<T, U> extends true ? false : true;

/**
 * Check whether all types in tuple `T` are assignable to `U`
 */
export type Assignables<T extends any[], U> = T extends [
	infer First,
	...infer Rest extends any[],
] ? Assignable<First, U> extends true ? Assignables<Extract<Rest, any[]>, U> // ensure Rest is still a tuple
	: false
	: true; // empty tuple → vacuously true

/**
 * Check whether all types in tuple `T` are not assignable to `U`
 */
export type NotAssignables<T extends any[], U> = T extends
	[infer First, ...infer Rest]
	? Assignable<First, U> extends false
		? NotAssignables<Extract<Rest, any[]>, U>
	: false
	: true;
