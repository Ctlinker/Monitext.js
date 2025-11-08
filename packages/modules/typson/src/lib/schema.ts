type BaseSchema<S extends object> = {
  description?: string;
} & S;

export type StringFormat =
  | "date-time" // ISO 8601 date-time string
  | "date" // ISO 8601 date string
  | "time" // ISO 8601 time string
  | "email" // email address
  | "idn-email" // internationalized email address
  | "hostname" // valid hostname
  | "idn-hostname" // internationalized hostname
  | "ipv4" // IPv4 address
  | "ipv6" // IPv6 address
  | "uri" // URI (Uniform Resource Identifier)
  | "uri-reference" // URI or relative reference
  | "iri" // Internationalized URI (IRI)
  | "iri-reference" // IRI or relative reference
  | "uuid" // universally unique identifier (UUID)
  | "json-pointer" // JSON Pointer (RFC 6901)
  | "regex"; // regular expression patterns

export type StringSchema = BaseSchema<{
  type: "string";
  enum?: string[];
  default?: string;
  format?: StringFormat;
}>;

export type NumberSchema = BaseSchema<{
  type: "number";
  enum?: number[];
  default?: number;
}>;

export type BooleanSchema = BaseSchema<{
  type: "boolean";
  enum?: boolean[];
  default?: boolean;
}>;

export type EnumSchema = BaseSchema<{
  enum: (string | number | boolean | null)[];
  default?: string | number | boolean | null;
}>;

export type ArraySchema = BaseSchema<{
  type: "array";
  prefixItems?: ExtendedSchema[];
  items?: boolean | ExtendedSchema;
  default?: (unknown)[];
  description?: string;
}>;

export type ObjectSchema = BaseSchema<{
  type: "object";
  properties: Record<string, ExtendedSchema>;
  additionalProperties?: boolean;
  required?: string[];
  default?: unknown;
  description?: string;
}>;


export type OneOfSchema = BaseSchema<{
  oneOf: (Exclude<ExtendedSchema, OneOfSchema>)[];
  default?: unknown;
}>;

export type AllOfSchema = BaseSchema<{
  allOf: (ExtendedSchema)[];
  default?: unknown;
}>;

export type FunctionSchemaExtension = BaseSchema<{
  type: "function";
  params?:
    | {
        required?: boolean;
        schema: ExtendedSchema;
      }
    | {
        required?: boolean;
        schema: ExtendedSchema;
      }[];
  async?: boolean;
  return?: JSONSchema;
}>;

export type Schema =
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | ArraySchema
  | ObjectSchema;

export type LogicalSchema = OneOfSchema | AllOfSchema

export type JSONSchema = Schema | LogicalSchema;

export type ExtendedSchema = JSONSchema | FunctionSchemaExtension;

