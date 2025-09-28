import { Not } from './not';

/**
 * Check whether two types are "EXACTLY" equal
 ** Note: non-equality isn't synonym of non-assignability
 */
export type Equal<T, U> =
	(<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
		? true
		: false;

/**
 * Check whether two types are not "EXACTLY" equal
 ** Note: non-equality isn't synonym of non-assignability
 */
export type NotEqual<T, U> = Not<Equal<T, U>>;

/**
 * Check whether all types in a tuple are "EXACTLY" equal
 ** Note : non-equality isn't synonym of non-assignability
 */
export type Equals<T extends any[]> = T extends [infer First, ...infer Rest]
	? Rest extends []
		? true // only one element → trivially equal
		: Rest extends [infer Second, ...infer More]
			? Equal<First, Second> extends true
				? Equals<[Second, ...More]> // recurse
				: false
			: true
	: true;

/**
 * Check whether n types are not "EXACTLY" equal
 ** Note: non-equality isn't synonym of non-assignability
 */
export type NotEquals<T extends any[]> = Not<Equals<T>>;
