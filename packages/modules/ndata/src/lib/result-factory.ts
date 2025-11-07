import { Result } from './result';
import { IFailResult, IResult } from './data-types';

/**
 * Wraps a value into an `IResult` object.
 * If the value is an Error instance it becomes a failure result,
 * otherwise it's wrapped as a success result.
 */
export function createResult<T>(v: T): IResult<T> {
	return !(v instanceof Error) ? Result.ok(v) : Result.fail(v);
}

/**
 * Create a wrapper for synchronous functions:
 * - Returns a function that returns `IResult<ReturnType>`.
 */
function createSyncResultableFn<ReturnType, Args extends any[]>(
	fn: (...args: Args) => ReturnType,
) {
	return function (...args: Args): IResult<ReturnType> {
		try {
			const value = fn(...args);
			return createResult<ReturnType>(value);
		} catch (error: unknown) {
			// createResult expects a value; when we get an error we pass it through.
			// Casts used here keep TypeScript satisfied while the runtime behavior is preserved.
			return createResult(error as any) as IFailResult;
		}
	};
}

/**
 * Create a wrapper for async functions:
 * - Returns a function that returns `Promise<IResult<Awaited<ReturnType>>>`.
 */
function createAsyncResultableFn<ReturnType, Args extends any[]>(
	fn: (...args: Args) => Promise<ReturnType>,
) {
	return async function (...args: Args): Promise<IResult<ReturnType>> {
		try {
			const value = await fn(...args);
			return createResult<ReturnType>(value);
		} catch (error: unknown) {
			return createResult(error as any) as IFailResult;
		}
	};
}

/**
 * Overloads for createResultableFn so consumers get correct typings for sync vs async functions.
 */
export function createResultableFn<ReturnType, Args extends any[]>(
	fn: (...args: Args) => Promise<ReturnType>,
): (...args: Args) => Promise<IResult<ReturnType>>;

export function createResultableFn<ReturnType, Args extends any[]>(
	fn: (...args: Args) => ReturnType,
): (...args: Args) => IResult<ReturnType>;

/**
 * Implementation: detects async functions at runtime and returns the appropriate wrapper.
 */
export function createResultableFn<ReturnType, Args extends any[]>(
	fn: (...args: Args) => any,
) {
	// Reliable runtime check for async functions:
	const isAsync =
		fn.constructor && fn.constructor.name === 'AsyncFunction'
			? true
			: fn.toString().trimStart().startsWith('async');

	if (isAsync) {
		return createAsyncResultableFn(
			fn as (...args: Args) => Promise<ReturnType>,
		);
	}
	return createSyncResultableFn(fn as (...args: Args) => ReturnType);
}

