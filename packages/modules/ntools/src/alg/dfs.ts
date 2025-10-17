type Visitor = (p: {
	key: string | number;
	value: any;
	stop(): void;
	path: (string | number)[];
}) => void;

/**
 * Performs a depth-first traversal (DFS) on a given object or array, invoking a visitor function
 * for each key-value pair encountered. The traversal can be stopped early by calling the `stop` method
 * provided in the visitor callback.
 *
 * @typeParam T - The type of the input object or array. It can be a record (object) or an array.
 *
 * @param obj - The object or array to traverse.
 * @param visitor - A callback function that is invoked for each key-value pair during the traversal.
 * The visitor receives an object containing:
 *   - `key`: The current key or index being visited.
 *   - `value`: The value associated with the current key or index.
 *   - `stop`: A function that can be called to abort the traversal early.
 *   - `path`: An array representing the path to the current key or index.
 *
 * The traversal avoids revisiting objects or arrays that have already been visited, preventing infinite
 * loops in the case of circular references.
 *
 * @example
 * ```typescript
 * const obj = {
 *   a: 1,
 *   b: { c: 2, d: [3, 4] },
 * };
 *
 * dfs(obj, ({ key, value, path, stop }) => {
 *   console.log(`Key: ${key}, Value: ${value}, Path: ${path.join('.')}`);
 *   if (key === 'c') stop(); // Stops traversal when key 'c' is encountered
 * });
 * ```
 */
export function dfs<T extends Record<string, any> | any[]>(
	obj: T,
	visitor: Visitor,
): void {
	const abortRef = { abort: false };
	const visited = new WeakSet();

	function dfsObject(obj: Record<string, any>, path: (string | number)[]) {
		if (visited.has(obj)) return;
		visited.add(obj);

		for (const key in obj) {
			if (abortRef.abort) return;

			const value = obj[key];
			const currentPath = [...path, key];

			visitor({
				key,
				value,
				stop: () => (abortRef.abort = true),
				path: currentPath,
			});
			if (abortRef.abort) return;

			if (value && typeof value === 'object') {
				if (Array.isArray(value)) dfsArray(value, currentPath);
				else dfsObject(value, currentPath);
			}
		}
	}

	function dfsArray(arr: any[], path: (string | number)[]) {
		if (visited.has(arr)) return;
		visited.add(arr);

		for (let index = 0; index < arr.length; index++) {
			if (abortRef.abort) return;

			const value = arr[index];
			const currentPath = [...path, index];

			visitor({
				key: index,
				value,
				stop: () => (abortRef.abort = true),
				path: currentPath,
			});
			if (abortRef.abort) return;

			if (value && typeof value === 'object') {
				if (Array.isArray(value)) dfsArray(value, currentPath);
				else dfsObject(value, currentPath);
			}
		}
	}

	Array.isArray(obj) ? dfsArray(obj, []) : dfsObject(obj, []);
}
