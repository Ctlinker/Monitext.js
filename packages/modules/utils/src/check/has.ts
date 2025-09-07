export const has = {
	/**
	 * Check if a value has a specific length.
	 *
	 * @param d The value to check (string, array, or object with a length property).
	 * @param length The length to compare against, e.g., ">5", "<10", "3".
	 * @returns `true` if the value satisfies the length condition, otherwise `false`.
	 */
	length(d: { length: number }, length: `${'<' | '>' | ''}${number}`): boolean {
		const targetLength = parseInt(length.slice(1) || length, 10);
		if (length.startsWith('>')) return d.length > targetLength;
		if (length.startsWith('<')) return d.length < targetLength;
		return d.length === targetLength;
	},

	/**
	 * Check if an object has a specific key.
	 *
	 * @param d The object to check.
	 * @param k The key to look for.
	 * @returns `true` if the object has the key, otherwise `false`.
	 */
	key(d: object, k: string | number | symbol): boolean {
		return Object.prototype.hasOwnProperty.call(d, k);
	},

	/**
	 * Check if an object has all specified keys.
	 *
	 * @param d The object to check.
	 * @param k The keys to look for.
	 * @returns `true` if the object has all the keys, otherwise `false`.
	 */
	keys(d: object, ...k: (string | number | symbol)[]): boolean {
		return k.every((key) => Object.prototype.hasOwnProperty.call(d, key));
	},
};
