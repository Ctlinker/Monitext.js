import type { IFailResult, IOKResult, PrimitiveData } from "./data-types";

/**
 * A utility class for creating standardized result objects.
 * The `Result` class provides static methods to create success (`ok`) and failure (`fail`) results.
 */
export class Result<V, E extends Error | string | undefined> {
    constructor(public value: V, public error: E) {}

    /**
     * Creates a success result object.
     *
     * @template Y - The type of the value contained in the success result.
     * @param v - The value to be wrapped in the success result.
     * @returns An object representing a successful result, containing the provided value.
     */
    static ok<Y>(v: Y): IOKResult<Y> {
        return new Result(v, undefined);
    }

    /**
     * Creates a failure result object.
     *
     * @param v - The error to be wrapped in the failure result.
     * @returns An object representing a failed result, containing the provided error.
     */
    static fail(v: Error): IFailResult {
        return new Result(undefined, v);
    }
}

export class PrimitiveResult<
    V extends PrimitiveData,
    E extends Error | undefined,
> {
    constructor(public value: V, public error: E) {}

    /**
     * Creates a success result object.
     *
     * @template Y - The type of the value contained in the success result.
     * @param v - The value to be wrapped in the success result.
     * @returns An object representing a successful result, containing the provided value.
     */
    static ok<Y extends PrimitiveData>(v: Y): IOKResult<Y> {
        return new PrimitiveResult(v, undefined);
    }

    /**
     * Creates a failure result object.
     *
     * @param v - The error to be wrapped in the failure result.
     * @returns An object representing a failed result, containing the provided error.
     */
    static fail(v: Error): IFailResult {
        return new PrimitiveResult(undefined, v);
    }
}
