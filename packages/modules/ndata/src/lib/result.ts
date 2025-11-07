import type { IFailResult, IOKResult, PrimitiveData } from './data-types';

type ExpectHandler<V, E> = (param: {
	err: E;
	value?: Partial<V>;
}) => any;

type AsNonVoidableNorNullable<H> =
  H extends (...args: any[]) => infer R
    ? Exclude<R, void | undefined | null>
    : never;

/**
 * Generic Result class for handling success/failure outcomes.
 * Can optionally constrain to primitive data types.
 */
export class Result<
	V extends any,
	E extends Error | string | undefined = undefined,
> {
	constructor(
		public value: V,
		public error: E,
	) {}

	public unwrap(): V {
		if (this.error) throw this.error;
		return this.value;
	}

	public unwrapOr(defaultValue: V): V {
		return this.error ? defaultValue : this.value;
	}

	public isOk(): this is Result<V, undefined> {
		return this.error === undefined;
	}

	public isErr(): this is Result<undefined, E> {
		return this.error !== undefined;
	}

	public expect<H extends ExpectHandler<V, E>>({
		msg,
		handler,
		throwErr = true, // default safer: true
	}: {
		msg?: string;
		handler?: H;
		throwErr?: boolean;
	}): AsNonVoidableNorNullable<H> | V {
		const hasError = this.error != null;

		if (!hasError) return this.value;

		if (msg) console.warn(`${msg}: ${String(this.error)}`);

		if (typeof handler === 'function') {
			const result = handler({ err: this.error, value: this.value });
			if (result != undefined) return result;
		}

		if (throwErr) {
			throw new Error(String(this.error));
		}

		// 🚨 explicit fail: no return path
		throw new Error('Unhandled error without handler return or throwErr=false');
	}

	/**
	 * Creates a success result.
	 */
	static ok<Y>(v: Y) {
		return new Result(v, undefined);
	}

	/**
	 * Creates a failure result.
	 */
	static fail(e: Error | string): IFailResult {
		return new Result(undefined, e as any);
	}

	/**
	 * Factory for primitive-only results.
	 */
	static primitives = Object.freeze({
		ok<Y extends PrimitiveData>(v: Y) {
			return new Result(v, undefined);
		},
		fail(e: Error): IFailResult {
			return new Result(undefined, e);
		},
	});
}

Result.primitives.ok("test").expect({ handler() { return  1 } });
