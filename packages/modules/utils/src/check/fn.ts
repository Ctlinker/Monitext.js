/**
 * !!! WARNING
 * This only works for functions explicitly declared as `async`.
 * If a synchronous function returns a `Promise`, it will not be detected at runtime,
 * even though TypeScript treats it as async.
 *
 * @exemple
 *
 * async function asyncFn() {}
 * function syncFn() {}
 * function promiseFn() { return Promise.resolve(42); }
 *
 * const a = isAsyncFn(asyncFn);   // type: true, runtime: true
 * const b = isAsyncFn(syncFn);    // type: false, runtime: false
 * const c = isAsyncFn(promiseFn); // type: true, runtime: false (!)
 *
 */
export function isAsyncFn<T extends (...args: any[]) => any>(
	fn: T,
): T extends (...args: any[]) => Promise<any> ? true : false {
	return (fn.constructor.name === 'AsyncFunction' ||
		fn.toString().trim().startsWith('async')) as any;
}
