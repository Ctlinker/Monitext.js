import { HandleArray } from "./handlers/array";
import { HandleObject } from "./handlers/object";

import {
  HandleBoolean,
  HandleEnum,
  HandleNumber,
  HandleString,
} from "./handlers/literals";

import {
  AllOfSchema,
  ArraySchema,
  BooleanSchema,
  EnumSchema,
  FunctionSchemaExtension,
  NumberSchema,
  ObjectSchema,
  OneOfSchema,
  StringSchema,
} from "./schema";

import { HandleAllOf, HandleOneOf } from "./handlers/logical";
import { HandleFunc } from "./handlers/funcs";

/**
 * **ToType** is the core type-mapper that transforms a {@link JSONSchema}-like
 * structure into its **TypeScript equivalent type**.
 *
 * It acts as a central dispatcher that selects the appropriate handler
 * (`HandleString`, `HandleObject`, `HandleFunc`, etc.) based on the schema’s kind.
 *
 * ### Supported Schema Types:
 * - `StringSchema` → `string` (via {@link HandleString})
 * - `NumberSchema` → `number` (via {@link HandleNumber})
 * - `BooleanSchema` → `boolean` (via {@link HandleBoolean})
 * - `EnumSchema` → union of literal values (via {@link HandleEnum})
 * - `ObjectSchema` → structured object type (via {@link HandleObject})
 * - `ArraySchema` → typed array (via {@link HandleArray})
 * - `OneOfSchema` → discriminated union type (via {@link HandleOneOf})
 * - `AllOfSchema` → intersection type (via {@link HandleAllOf})
 * - `FunctionSchemaExtension` → callable function signature (via {@link HandleFunc})
 *
 * @template S - The input schema type to convert into its TypeScript representation.
 * @returns The inferred TypeScript type corresponding to the given schema.
 *
 * @example
 * ```ts
 * // Example 1: Primitive
 * type T1 = ToType<{ type: "string" }>
 * // => string
 *
 * // Example 2: Object
 * type T2 = ToType<{
 *   type: "object",
 *   properties: { name: { type: "string" }, age: { type: "number" } }
 * }>
 * // => { name?: string; age?: number }
 *
 * // Example 3: Function schema
 * type T3 = ToType<{
 *   type: "function",
 *   params: { required: true, schema: { type: "string" } },
 *   return: { type: "number" },
 *   async: true
 * }>
 * // => (param: string) => Promise<number>
 * ```
 */
export type ToType<S> = S extends StringSchema
  ? HandleString<S>
  : S extends NumberSchema
  ? HandleNumber<S>
  : S extends BooleanSchema
  ? HandleBoolean<S>
  : S extends EnumSchema
  ? HandleEnum<S>
  : S extends ObjectSchema
  ? HandleObject<S>
  : S extends ArraySchema
  ? HandleArray<S>
  : S extends OneOfSchema
  ? HandleOneOf<S>
  : S extends AllOfSchema
  ? HandleAllOf<S>
  : S extends FunctionSchemaExtension 
  ? HandleFunc<S> 
  : never;
