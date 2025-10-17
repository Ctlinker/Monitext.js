import { is } from '../check/is';

/**
 * Deep clone using structuredClone (Node 17+, Deno, modern browsers)
 *
 * This function uses the `structuredClone` method if available, which provides
 * a more robust and efficient way to clone objects, including handling circular
 * references and special object types. If `structuredClone` is not supported,
 * it falls back to using `JSON.stringify` and `JSON.parse`, which may not handle
 * all edge cases (e.g., functions, `undefined`, or circular references).
 *
 * @template T - The type of the object to be cloned.
 * @param obj - The object to be deeply cloned.
 * @returns A deep clone of the input object.
 */
export function deepClone<T>(obj: T): T {
	return typeof structuredClone === 'function'
		? structuredClone(obj)
		: JSON.parse(JSON.stringify(obj));
}

/**
 * Deep merge (non-mutating, return a new object)
 *
 * Deeply merges two objects, combining properties from the source object into the target object.
 * If a property exists in both objects:
 * - Arrays are cloned from the source.
 * - Nested objects are recursively merged.
 * - Primitive values are overwritten by the source.
 *
 * @template T - The type of the target object.
 * @template U - The type of the source object.
 * @param target - The target object to merge properties into.
 * @param source - The source object to merge properties from.
 * @returns A new object that is the result of deeply merging the target and source objects.
 */
export function deepMerge<T extends object, U extends object>(
	target: T,
	source: U,
): T & U {
	const output = deepClone(target);

	Object.keys(source).forEach((key) => {
		const srcVal = (source as any)[key];
		const tgtVal = (output as any)[key];

		if (Array.isArray(srcVal)) {
			(output as any)[key] = deepClone(srcVal);
		} else if (is.object(srcVal) && is.object(tgtVal)) {
			(output as any)[key] = deepMerge(tgtVal, srcVal);
		} else {
			(output as any)[key] = deepClone(srcVal);
		}
	});

	return output as T & U;
}
