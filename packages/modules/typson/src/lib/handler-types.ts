import { AssertionSchema, TSchema } from "./schema-types";

/**
 * Handles a `string` type schema.
 * If the schema has an `enum`, returns a union of its values.
 * Otherwise returns `string`.
 */
export type HandleString<S> = S extends { type: "string" }
	? S extends { enum: infer EnumTypes extends readonly string[] }
		? EnumTypes[number]
	: string
	: never;

/**
 * Handles a `number` type schema.
 * If the schema has an `enum`, returns a union of its values.
 * Otherwise returns `number`.
 */
export type HandleNumber<S> = S extends { type: "number" }
	? S extends { enum: infer EnumTypes extends readonly number[] }
		? EnumTypes[number]
	: number
	: never;

/**
 * Handles a `boolean` type schema.
 * If the schema has an `enum`, returns a union of its values.
 * Otherwise returns `boolean`.
 */
export type HandleBoolean<S> = S extends { type: "boolean" }
	? S extends { enum: infer EnumTypes extends readonly [boolean] }
		? EnumTypes[number]
	: boolean
	: never;

/** Handles a `null` type schema. */
export type HandleNull<S> = S extends { type: "null" } ? null : never;

/**
 * Constructs a TypeScript object type from a JSON Schema object definition.
 * - Required properties are enforced.
 * - Optional properties are marked optional.
 */
type CreateObjFromConstraint<
	Source extends { properties: any },
	Props extends Record<string, TSchema | AssertionSchema>,
> = Source extends { required: readonly string[] } ?
		& {
			// optional props (those not listed in "required")
			[K in Exclude<keyof Props, Source["required"][number]>]?:
				HandleSchema<
					Props[K]
				>;
		}
		& {
			// required props
			[K in Extract<keyof Props, Source["required"][number]>]:
				HandleSchema<
					Props[K]
				>;
		}
	: {
		// no "required": everything optional
		[K in keyof Props]?: HandleSchema<Props[K]>;
	};

/**
 * Handles a JSON Schema object type.
 */
export type HandleObject<S> = S extends {
	type: "object";
	properties: infer P extends Record<string, TSchema | AssertionSchema>;
} ? CreateObjFromConstraint<S, P>
	: never;

/** Utility to merge two tuples or arrays */
type MergePush<S, N> = [
	...(S extends any[] ? S : never),
	...(N extends any[] ? N : never),
];

/**
 * Maps the `items` property of an array schema to TypeScript types.
 * - If `items` is a boolean, `true` = `any[]`, `false` = `never[]`
 * - If `items` is an array of schemas, maps each schema in the array
 */
// Map `items` to TS types
type HandleItems<S> = S extends
	{ items: infer X extends (TSchema | AssertionSchema)[] } ? {
		[K in keyof X]: HandleSchema<X[K]>;
	}
	: S extends { items: infer X extends boolean } ? X extends true ? any[]
		: never[]
	: S extends { items: infer X extends TSchema | AssertionSchema }
		? HandleSchema<X>[]
	: any[];

/**
 * Handles a JSON Schema array type with `prefixItems` (tuple-like) and optional `items` (rest elements).
 */
export type HandleArray<S> = S extends { type: "array" }
	? S extends { prefixItems: infer P extends readonly TSchema[] }
		? S extends { items: infer I extends TSchema | boolean } ? MergePush<
				{
					[K in keyof P]: HandleSchema<
						P[K extends keyof P ? K : never]
					>;
				},
				I extends boolean ? I extends true ? any[]
					: []
					: I extends TSchema ? HandleSchema<I>[]
					: []
			>
		: { [K in keyof P]: HandleSchema<P[K]> } // prefixItems only
	: HandleItems<S> // no prefixItems, fallback to items
	: never;

/**
 * Handles `oneOf` in JSON Schema.
 * Produces a TypeScript union of all schemas in the `oneOf` array.
 */
export type HandleOneOf<S> = S extends {
	oneOf: infer X extends TSchema[];
} ? {
		[K in keyof X]: HandleSchema<X[K]>;
	}[number] // map each schema in the array to its handled type and union them
	: never;

/**
 * Handles a JSON Schema `enum` type.
 * Produces a TypeScript union of all enum values.
 */
export type HandleEnum<S> = S extends { enum: readonly (infer X)[] } ? X
	: never;

/**
 * Main dispatcher for handling a JSON Schema type to TypeScript type.
 */
export type HandleSchema<S> = S extends { type: "string" } ? HandleString<S>
	: S extends { type: "number" } ? HandleNumber<S>
	: S extends { type: "boolean" } ? HandleBoolean<S>
	: S extends { type: "null" } ? HandleNull<S>
	: S extends { type: "object" } ? HandleObject<S>
	: S extends { type: "array" } ? HandleArray<S>
	: S extends { oneOf: any } ? HandleOneOf<S>
	: S extends { enum: any } ? HandleEnum<S>
	: never;
