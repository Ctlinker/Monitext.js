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

/**
 * Handles a JSON Schema `enum` type.
 * Produces a TypeScript union of all enum values.
 */
export type HandleEnum<S> = S extends { enum: readonly (infer X)[] } ? X
	: never;

