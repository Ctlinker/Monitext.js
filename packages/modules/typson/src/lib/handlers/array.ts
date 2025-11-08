import { ExtendedSchema } from "../schema"
import { ToType } from "../to-types"

/**
 * Handles a JSON Schema array type with `prefixItems` (tuple-like) and optional `items` (rest elements).
 */
export type HandleArray<S> = S extends { type: "array" }
	? S extends { prefixItems: infer P extends readonly ExtendedSchema[] }
		? S extends { items: infer I extends ExtendedSchema | boolean } ? MergePush<
				{
					[K in keyof P]: ToType<
						P[K extends keyof P ? K : never]
					>;
				},
				I extends boolean ? I extends true ? any[]
					: []
					: I extends ExtendedSchema ? ToType<I>[]
					: []
			>
		: { [K in keyof P]: ToType<P[K]> } // prefixItems only
	: HandleItems<S> // no prefixItems, fallback to items
	: never;

/**
 * Maps the `items` property of an array schema to TypeScript types.
 * - If `items` is a boolean, `true` = `any[]`, `false` = `never[]`
 * - If `items` is an array of schemas, maps each schema in the array
 */
// Map `items` to TS types
type HandleItems<S> = S extends
	{ items: infer X extends (ExtendedSchema)[] } ? {
		[K in keyof X]: ToType<X[K]>;
	}
	: S extends { items: infer X extends boolean } ? X extends true ? any[]
		: never[]
	: S extends { items: infer X extends ExtendedSchema }
		? ToType<X>[]
	: any[];

/** Utility to merge two tuples or arrays */
type MergePush<S, N> = [
	...(S extends any[] ? S : never),
	...(N extends any[] ? N : never),
];