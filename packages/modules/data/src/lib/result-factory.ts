import { Result } from "./result";
import { IFailResult, IResult } from "./data-types";

/**
 * @fileoverview
 * This file contains utility functions and classes for working with results.
 */

/**
 * Wraps a value into an `IResult` object.
 * - If the value is **not** an `Error`, wraps it with `Result.ok()`.
 * - If the value **is** an `Error`, wraps it with `Result.fail()`.
 *
 * @template T The type of the successful result value.
 * @param v The value or error to wrap.
 * @returns An `IResult<T>` representing either success or failure.
 */
export function createResult<T>(v: T): IResult<T> {
    return !(v instanceof Error) ? Result.ok(v) : Result.fail(v);
}

/**
 * Creates a safe wrapper around a synchronous function so it returns an `IResult` instead of throwing.
 * - Any error is caught and converted to a failure `IResult`.
 * - Any successful return value is wrapped in a success `IResult`.
 *
 * @template U The return type of the wrapped function.
 * @template C The parameter tuple type of the wrapped function.
 * @param fn The synchronous function to wrap.
 * @returns A new function that returns `IResult<U>` instead of throwing.
 *
 * @example
 * const safeAdd = createResultableFn((a: number, b: number) => a + b);
 * const result = safeAdd(2, 3); // Result.ok(5)
 */
function createSyncResultableFn<U, C extends any[]>(fn: (...p: C) => U) {
    return function (...param: C): IResult<U> {
        try {
            return createResult<U>(fn(...param));
        } catch (error) {
            return createResult(error) as IFailResult;
        }
    };
}

/**
 * Creates a safe wrapper around an asynchronous function so it returns an `IResult` instead of rejecting.
 * - Any thrown or rejected error is caught and converted to a failure `IResult`.
 * - Any resolved value is wrapped in a success `IResult`.
 *
 * @template U The resolved value type of the Promise.
 * @template C The parameter tuple type of the wrapped function.
 * @param fn The asynchronous function to wrap.
 * @returns A new async function that returns `Promise<IResult<U>>` instead of throwing/rejecting.
 *
 * @example
 * const fetchData = createAsyncResultableFn(async (url: string) => {
 *     const res = await fetch(url);
 *     return res.json();
 * });
 * const result = await fetchData("https://api.example.com");
 * if (result.ok) console.log(result.value);
 */
function createAsyncResultableFn<const U extends Promise<any>, C extends any[]>(
    fn: (...p: C) => U,
) {
    return async function (...param: C): Promise<IResult<Awaited<U>>> {
        try {
            return createResult<Awaited<U>>(await fn(...param));
        } catch (error) {
            return createResult(error) as IFailResult;
        }
    };
}

/**
 * Creates a safe wrapper around an asynchronous or synchronous function so it returns an `IResult` instead of rejecting | throwing.
 * - Any thrown or rejected error is caught and converted to a failure `IResult`.
 * - Any resolved value is wrapped in a success `IResult`.
 *
 * @template U The resolved value type of the Promise.
 * @template C The parameter tuple type of the wrapped function.
 * @param fn The asynchronous function to wrap.
 * @returns A new async function that returns `Promise<IResult<U>>` instead of throwing/rejecting.
 *
 * @example
 * const fetchData = createResultableFn(async (url: string) => {
 *     const res = await fetch(url);
 *     return res.json();
 * });
 * const result = await fetchData("https://api.example.com");
 * if (result.ok) console.log(result.value);
 */
export function createResultableFn<const U, C extends any[]>(
    fn: (...param: C) => U,
) {
    const isAsync = fn.toString().trimStart().match(/^async/);

    return (
        !isAsync
            ? createSyncResultableFn(fn as (...param: C) => U)
            : createAsyncResultableFn(fn as (...param: C) => Promise<U>)
    ) as ReturnType<typeof fn> extends Promise<any> ? ReturnType<
            typeof createAsyncResultableFn<
                U extends Promise<any> ? U : never,
                C
            >
        >
        : ReturnType<typeof createSyncResultableFn<U, C>>;
}
