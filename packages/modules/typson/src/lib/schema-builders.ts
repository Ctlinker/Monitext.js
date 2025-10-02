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
		T extends {
			[K in keyof T]: T[K] extends TSchema | AssertionSchema ? T[K]
				: never;
		},
		Req extends readonly (keyof T)[] = readonly [],
		Desc extends string | undefined = undefined,
		Add extends boolean | undefined = undefined,
		Def extends
			| HandleSchema<
				{ type: "object"; properties: T; required: [...Req] }
			>
			| undefined = undefined,
	>(opts: {
		readonly properties: T;
		readonly additionalProperties?: Add;
		readonly required?: [...Req];
		default?: Def;
		description?: Desc;
	}) {
		const schema = {
			type: "object",
			...opts,
		};

		return schema as {
			type: "object";
			properties: T;
			additionalProperties: Add;
			required: [...Req] extends never[] ? undefined : [...Req];
			default: Def;
			description: Desc;
		};
	}

	/**
	 * Create an array schema.
	 * - prefixItems: tuple-like schemas for the first N positions
	 * - items: schema or boolean (true = allow anything, false = disallow additional)
	 */
	export function array<
		T extends
			| {
				[K in keyof T]: T[K] extends TSchema | AssertionSchema ? T[K]
					: never;
			}
			| undefined = undefined,
		U extends TSchema | AssertionSchema | undefined = undefined,
		Desc extends string | undefined = undefined,
		Def extends
			| HandleSchema<
				{ type: "array"; prefixItems: T; items: U }
			>
			| undefined = undefined,
	>(opts?: {
		readonly prefixItems?: T;
		readonly items?: U;
		readonly default?: HandleSchema<
			{ type: "array"; prefixItems: T; items: U }
		>;
		description?: Desc;
	}) {
		const schema = {
			type: "array",
			...opts,
		};

		return schema as {
			type: "array";
			items: U;
			default: Def;
			prefixItems: T;
			description: Desc;
		};
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
	export function oneOf<
		T extends {
			[K in keyof T]: T[K] extends TSchema ? T[K]
				: never;
		},
		Desc extends string | undefined = undefined,
		Def extends
			| HandleSchema<
				{ oneOf: T }
			>
			| undefined = undefined,
	>(
		schemas: T,
		opts?: { default?: Def; description?: Desc },
	) {
		return {
			oneOf: schemas,
			...opts,
		} as {
			oneOf: T;
			default: Def;
			description: Desc;
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
