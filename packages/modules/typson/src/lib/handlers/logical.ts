import { ToType } from "../to-types";

/**
 * Handles `oneOf` in JSON Schema.
 * Produces a TypeScript union of all schemas in the `oneOf` array.
 */
export type HandleOneOf<S> = S extends { oneOf: infer X extends any[] }
	? X extends [infer A, ...never[]]
		? ToType<A>
		: X extends [infer A, ...infer B]
		? ToType<A> | HandleOneOf<{ oneOf: B }>
		: never
	: never;

/**
 * Handles `allOf` in JSON Schema.
 * Produces a TypeScript intersection of all schemas in the `allOf` array.
 */
export type HandleAllOf<S> = S extends { allOf: infer X extends any[] }
  ? X extends [infer A, ...never[]]
    ? ToType<A>
    : X extends [infer A, ...infer B]
    ? ToType<A> & HandleAllOf<{ allOf: B }>
    : never
  : never;