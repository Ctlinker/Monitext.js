import { HandleSchema } from './handler-types';

import type {
	ArraySchema,
	BooleanSchema,
	EnumSchema,
	NullSchema,
	NumberSchema,
	ObjectSchema,
	OneOfSchema,
	StringSchema,
	TSchema,
} from './schema-types';

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
		format?: StringSchema['format'];
		description?: string;
	}): StringSchema {
		return { type: 'string', ...opts };
	},

	/**
	 * Create a number schema.
	 */
	number(opts?: {
		enum?: number[];
		default?: number;
		description?: string;
	}): NumberSchema {
		return { type: 'number', ...opts };
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
			type: 'boolean',
			enum: opts?.enum as any,
			default: opts?.default,
			description: opts?.description,
		};
	},

	/**
	 * Create a null schema.
	 */
	null(opts?: { description?: string }): NullSchema {
		return { type: 'null', ...(opts ?? {}) };
	},

	/**
	 * Create an object schema.
	 * - `properties` should be a map of name -> TSchema
	 * - optional extra options: required, additionalProperties, default, description
	 */
	object<
		T extends Record<string, TSchema>,
		U extends (keyof T extends string ? keyof T : never)[] = [],
	>(opts: {
		properties: T;
		additionalProperties?: boolean;
		required?: U;
		default?: HandleSchema<{ type: 'object'; properties: T }>;
		description?: string;
	}) {
		const {
			properties,
			additionalProperties,
			required,
			default: d,
			description,
		} = opts;
		const schema = {
			type: 'object',
			properties,
			...(additionalProperties === undefined ? {} : { additionalProperties }),
			...(required ? { required } : {}),
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
	array(opts?: {
		prefixItems?: TSchema[];
		items?: boolean | TSchema;
		default?: unknown;
		description?: string;
	}): ArraySchema {
		const { prefixItems, items, default: d, description } = opts ?? {};
		const schema: ArraySchema = {
			type: 'array',
			...(prefixItems ? { prefixItems } : {}),
			...(items === undefined ? {} : { items }),
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
