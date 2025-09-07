export const all = {
	/**
	 * Check whether all keys of an object satisfy a given predicate.
	 *
	 * @param obj The object whose keys to check.
	 * @param predicate The predicate function to test each key.
	 * @returns `true` if all keys satisfy the predicate, otherwise `false`.
	 */
	keys<T extends object>(
		obj: T,
		predicate: (key: keyof T) => boolean,
	): boolean {
		return Object.keys(obj).every((key) => predicate(key as keyof T));
	},

	/**
	 * Check whether all values of an object satisfy a given predicate.
	 *
	 * @param obj The object whose values to check.
	 * @param predicate The predicate function to test each value.
	 * @returns `true` if all values satisfy the predicate, otherwise `false`.
	 */
	values<T extends object>(
		obj: T,
		predicate: (value: T[keyof T]) => boolean,
	): boolean {
		return Object.values(obj).every((value) => predicate(value));
	},
};
