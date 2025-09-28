export interface StringSchema {
    type: "string";
    enum?: string[];
    default?: string;
    format?:
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
        | "regex"; // regular expression pattern
    description?: string;
}

export interface NumberSchema {
    type: "number";
    enum?: number[];
    default?: number;
    description?: string;
}

export interface BooleanSchema {
    type: "boolean";
    enum?: readonly [boolean];
    default?: boolean;
    description?: string;
}

export interface NullSchema {
    type: "null";
    description?: string;
}

export interface ObjectSchema {
    type: "object";
    properties: Record<string, Schema>;
    additionalProperties?: boolean;
    required?: string[];
    default?: unknown;
    description?: string;
}

export interface ArraySchema {
    type: "array";
    prefixItems?: Schema[];
    items?: boolean | Schema;
    default?: unknown;
    description?: string;
}

export interface EnumSchema {
    enum: readonly (string | number | boolean | null)[];
    default?: string | number | boolean | null;
    description?: string;
}

export interface OneOfSchema {
    oneOf: TSchema[];
    default?: unknown;
}

export type TSchema =
    | StringSchema
    | NumberSchema
    | BooleanSchema
    | NullSchema
    | ObjectSchema
    | ArraySchema
    | EnumSchema;

export type AssertionSchema = OneOfSchema;

export type Schema = TSchema | AssertionSchema;
