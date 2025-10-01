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
export namespace T {
	export type Infer<S> = HandleSchema<S>;

	/**
	 * Create a string schema.
	 */
	export function string<
		E extends readonly string[],
		Desc extends string | undefined = undefined,
		Format extends StringSchema["format"] | undefined = undefined,
		Def extends (E extends string[] ? (E[number]) : string) | undefined =
			undefined,
	>(opts?: {
		enum?: [...E];
		default?: Def;
		format?: Format;
		description?: Desc;
	}) {
		return { type: "string" as const, ...opts } as {
			type: "string";
			enum: E extends any[] ? E : undefined;
			default: Def;
			format: Format;
			description: Desc;
		};
	}

	/**
	 * Create a number schema.
	 */
	export function number<
		E extends readonly number[],
		Def extends (E extends number[] ? E[number] : number) | undefined =
			undefined,
		Desc extends string | undefined = undefined,
	>(opts?: {
		enum?: [...E];
		default?: Def;
		description?: Desc;
	}) {
		return { type: "number" as const, ...opts } as {
			type: "number";
			enum: E extends any[] ? E : undefined;
			default: Def;
			description: Desc;
		};
	}

	/**
	 * Create a boolean schema.
	 */
	export function boolean<
		E extends readonly boolean[],
		Def extends (E extends any[] ? E[number] : boolean) | undefined =
			undefined,
		Desc extends string | undefined = undefined,
	>(opts?: {
		enum?: [...E];
		default?: Def;
		description?: Desc;
	}) {
		return {
			type: "boolean",
			enum: opts?.enum,
			default: opts?.default,
			description: opts?.description,
		} as {
			type: "boolean";
			enum: E extends boolean[] ? E : undefined;
			description: Desc;
			default: Def;
		};
	}

	/**
	 * Create an object schema.
	 * - `properties` should be a map of name -> TSchema
	 * - optional extra options: required, additionalProperties, default, description
	 */
	export function object<
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
	}

	/**
	 * Create an array schema.
	 * - prefixItems: tuple-like schemas for the first N positions
	 * - items: schema or boolean (true = allow anything, false = disallow additional)
	 */
	export function array<T extends TSchema[], U extends TSchema>(opts?: {
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
	}

	/**
	 * Create an enum schema from an array of literals.
	 * Accepts string | number | boolean | null values.
	 */
	export function literals<
		E extends readonly (string | number | boolean | null)[],
		Def extends (E[number]) | undefined = undefined,
		Desc extends string | undefined = undefined,
	>(
		opts: {
			enum: [...E];
			default?: Def;
			description?: Desc;
		},
	) {
		return { ...opts } as {
			enum: [...E];
			default: Def;
			description: Desc;
		};
	}

	/**
	 * Create a oneOf schema (union of schemas).
	 */
	export function oneOf(
		schemas: TSchema[],
		opts?: { default?: unknown; description?: string },
	): OneOfSchema {
		return {
			oneOf: schemas,
			...(opts?.default === undefined ? {} : { default: opts.default }),
			...(opts?.description ? { description: opts.description } : {}),
		};
	}

	/**
	 * Shortcut for literal values (single-value enum)
	 */
	export function literal<
		T extends string | number | boolean | null,
	>(value: T) {
		return { enum: [value] } as { enum: [T] };
	}
}
