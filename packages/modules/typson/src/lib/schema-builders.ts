import { HandleSchema } from "./handler-types";

import type {
	ArraySchema,
	AssertionSchema,
	BooleanSchema,
	EnumSchema,
	NullSchema,
	NumberSchema,
	ObjectSchema,
	OneOfSchema,
	StringSchema,
	TSchema,
} from "./schema-types";

/**
 * Lightweight Zod-like schema builders that produce JSON-Schema-like objects
 * (typed to your Schema interfaces).
 *
 * Usage:
 *   const s = T.string({ format: "email", description: "user email" });
 *   const o = T.object({
 *     properties: { id: T.number(), name: T.string() },
 *     required: ["id"]
 *   });
 */
export const T = {
	/**
	 * Create a string schema.
	 */
	string(opts?: {
		enum?: string[];
		default?: string;
		format?: StringSchema["format"];
		description?: string;
	}): StringSchema {
		return { type: "string" as const, ...opts };
	},

	/**
	 * Create a number schema.
	 */
	number(opts?: {
		enum?: number[];
		default?: number;
		description?: string;
	}): NumberSchema {
		return { type: "number" as const, ...opts };
	},

	/**
	 * Create a boolean schema.
	 */
	boolean(opts?: {
		enum?: boolean[] | readonly [boolean];
		default?: boolean;
		description?: string;
	}): BooleanSchema {
		return {
			type: "boolean" as const,
			enum: opts?.enum as any,
			default: opts?.default,
			description: opts?.description,
		};
	},

	/**
	 * Create a null schema.
	 */
	null(opts?: { description?: string }): NullSchema {
		return { type: "null", ...(opts ?? {}) };
	},

	/**
	 * Create an object schema.
	 * - `properties` should be a map of name -> TSchema
	 * - optional extra options: required, additionalProperties, default, description
	 */
	object<
		T extends Record<string, TSchema | AssertionSchema>,
		U extends (keyof T)[] = [],
	>(opts: {
		readonly properties: T;
		readonly additionalProperties?: boolean;
		required?: U;
		default?: HandleSchema<
			{ type: "object"; properties: T; required: U }
		>;
		readonly description?: string;
	}) {
		const {
			properties,
			additionalProperties,
			required,
			default: d,
			description,
		} = opts;

		const schema = {
			type: "object" as const,
			properties: properties as T,
			...(additionalProperties === undefined
				? {}
				: { additionalProperties }),
			...(required === undefined ? {} : { required }) as U extends
				undefined ? {} : { required: U },
			...(d === undefined ? {} : { default: d }),
			...(description ? { description } : {}),
		};

		return schema;
	},

	/**
	 * Create an array schema.
	 * - prefixItems: tuple-like schemas for the first N positions
	 * - items: schema or boolean (true = allow anything, false = disallow additional)
	 */
	array<T extends TSchema[], U extends TSchema>(opts?: {
		readonly prefixItems?: T;
		readonly items?: U;
		readonly default?: HandleSchema<
			{ type: "array"; prefixItems: T; items: U }
		>;
		description?: string;
	}) {
		const { prefixItems, items, default: d, description } = opts ?? {};

		const schema = {
			type: "array" as const,
			...(prefixItems ? { prefixItems } : {}) as T extends undefined ? {}
				: { readonly prefixItems: T },
			...(items === undefined ? {} : { items }) as U extends undefined
				? {}
				: { items: U },
			...(d === undefined ? {} : { default: d }),
			...(description ? { description } : {}),
		};
		return schema;
	},

	/**
	 * Create an enum schema from an array of literals.
	 * Accepts string | number | boolean | null values.
	 */
	enum(
		values: readonly (string | number | boolean | null)[],
		opts?: {
			default?: string | number | boolean | null;
			description?: string;
		},
	): EnumSchema {
		return {
			enum: values,
			...(opts?.default === undefined ? {} : { default: opts.default }),
			...(opts?.description ? { description: opts.description } : {}),
		};
	},

	/**
	 * Create a oneOf schema (union of schemas).
	 */
	oneOf(
		schemas: TSchema[],
		opts?: { default?: unknown; description?: string },
	): OneOfSchema {
		return {
			oneOf: schemas,
			...(opts?.default === undefined ? {} : { default: opts.default }),
			...(opts?.description ? { description: opts.description } : {}),
		};
	},

	/**
	 * Shortcut for literal values (single-value enum)
	 */
	literal<T extends string | number | boolean | null>(value: T): EnumSchema {
		return { enum: [value] };
	},
};
