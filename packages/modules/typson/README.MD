# @monitext/typson

A lightweight TypeScript schema-to-type library that converts JSON Schema-like
objects into TypeScript types at compile time.

## Overview

Typson provides a type-safe way to define schemas and automatically infer
TypeScript types from them. Unlike runtime validation libraries, Typson focuses
purely on compile-time type generation, making it perfect for scenarios where
you need strong typing without runtime overhead.

## Installation

```bash
npm install @monitext/typson
# or
pnpm add @monitext/typson
# or
yarn add @monitext/typson
```

## Basic Usage

### Schema Builders

Typson provides a fluent API through the `T` object for creating schemas:

```typescript
import { HandleSchema, T } from "@monitext/typson";

// Basic types
const stringSchema = T.string();
const numberSchema = T.number();
const booleanSchema = T.boolean();
const nullSchema = T.null();

// Extract TypeScript types
type StringType = HandleSchema<typeof stringSchema>; // string
type NumberType = HandleSchema<typeof numberSchema>; // number
type BooleanType = HandleSchema<typeof booleanSchema>; // boolean
type NullType = HandleSchema<typeof nullSchema>; // null
```

### Object Schemas

Define object schemas with optional and required properties:

```typescript
const userSchema = T.object({
  properties: {
    id: T.number(),
    name: T.string(),
    email: T.string({ format: "email" }),
    age: T.number(),
  },
  required: ["id", "name"],
});

type User = HandleSchema<typeof userSchema>;
// Result: { id: number; name: string; email?: string; age?: number }
```

### Array Schemas

Create array schemas with tuple-like behavior or homogeneous arrays:

```typescript
// Homogeneous array
const numbersSchema = T.array({
  items: T.number(),
});
type Numbers = HandleSchema<typeof numbersSchema>; // number[]

// Tuple with prefix items
const tupleSchema = T.array({
  prefixItems: [T.string(), T.number(), T.boolean()],
  items: T.string(), // additional items must be strings
});
type Tuple = HandleSchema<typeof tupleSchema>; // [string, number, boolean, ...string[]]
```

### Enums and Literals

Define enum types and literal values:

```typescript
// Enum from array of values
const statusSchema = T.enum(["pending", "approved", "rejected"]);
type Status = HandleSchema<typeof statusSchema>; // 'pending' | 'approved' | 'rejected'

// Single literal value
const literalSchema = T.literal("hello");
type Literal = HandleSchema<typeof literalSchema>; // 'hello'

// Typed enums on primitives
const numberEnumSchema = T.number({ enum: [1, 2, 3] });
type NumberEnum = HandleSchema<typeof numberEnumSchema>; // 1 | 2 | 3
```

### Union Types (OneOf)

Create union types using oneOf:

```typescript
const unionSchema = T.oneOf([
  T.string(),
  T.number(),
  T.object({
    properties: { type: T.literal("object") },
    required: ["type"],
  }),
]);
type Union = HandleSchema<typeof unionSchema>; // string | number | { type: 'object' }
```

## Advanced Features

### String Formats

Typson supports various string format constraints:

```typescript
const emailSchema = T.string({ format: "email" });
const uuidSchema = T.string({ format: "uuid" });
const dateSchema = T.string({ format: "date-time" });

// Note: Formats are for documentation/tooling - they don't affect the TypeScript type
type Email = HandleSchema<typeof emailSchema>; // still `string`
```

### Default Values and Descriptions

Add metadata to your schemas:

```typescript
const configSchema = T.object({
  properties: {
    host: T.string({
      default: "localhost",
      description: "Server hostname",
    }),
    port: T.number({
      default: 3000,
      description: "Server port number",
    }),
    ssl: T.boolean({
      default: false,
      description: "Enable SSL/TLS",
    }),
  },
});
```

### Complex Nested Schemas

Build complex, deeply nested type structures:

```typescript
const apiResponseSchema = T.object({
  properties: {
    success: T.boolean(),
    data: T.oneOf([
      T.object({
        properties: {
          users: T.array({
            items: T.object({
              properties: {
                id: T.string({ format: "uuid" }),
                profile: T.object({
                  properties: {
                    name: T.string(),
                    avatar: T.string({ format: "uri" }),
                  },
                  required: ["name"],
                }),
              },
              required: ["id", "profile"],
            }),
          }),
        },
        required: ["users"],
      }),
      T.null(),
    ]),
    error: T.string(),
  },
  required: ["success"],
});

type ApiResponse = HandleSchema<typeof apiResponseSchema>;
```

## API Reference

### Schema Builders (`T`)

#### `T.string(options?)`

Creates a string schema.

- `options.enum?: string[]` - Array of allowed string values
- `options.format?: string` - String format constraint
- `options.default?: string` - Default value
- `options.description?: string` - Schema description

#### `T.number(options?)`

Creates a number schema.

- `options.enum?: number[]` - Array of allowed numeric values
- `options.default?: number` - Default value
- `options.description?: string` - Schema description

#### `T.boolean(options?)`

Creates a boolean schema.

- `options.enum?: boolean[]` - Array of allowed boolean values
- `options.default?: boolean` - Default value
- `options.description?: string` - Schema description

#### `T.null(options?)`

Creates a null schema.

- `options.description?: string` - Schema description

#### `T.object(options)`

Creates an object schema.

- `options.properties: Record<string, TSchema>` - Object property schemas
- `options.required?: string[]` - Array of required property names
- `options.additionalProperties?: boolean` - Allow additional properties
- `options.default?` - Default object value
- `options.description?: string` - Schema description

#### `T.array(options?)`

Creates an array schema.

- `options.prefixItems?: TSchema[]` - Tuple-like schemas for first N items
- `options.items?: TSchema | boolean` - Schema for additional items
- `options.default?` - Default array value
- `options.description?: string` - Schema description

#### `T.enum(values, options?)`

Creates an enum schema from an array of values.

- `values: readonly (string | number | boolean | null)[]` - Enum values
- `options.default?` - Default enum value
- `options.description?: string` - Schema description

#### `T.oneOf(schemas, options?)`

Creates a union schema.

- `schemas: TSchema[]` - Array of schemas to union
- `options.default?` - Default value
- `options.description?: string` - Schema description

#### `T.literal(value)`

Creates a single-value enum schema.

- `value: string | number | boolean | null` - The literal value

### Type Handlers

#### `HandleSchema<S>`

Main type handler that converts any schema to its TypeScript type equivalent.

#### Individual Handlers

- `HandleString<S>` - Handles string schemas
- `HandleNumber<S>` - Handles number schemas
- `HandleBoolean<S>` - Handles boolean schemas
- `HandleNull<S>` - Handles null schemas
- `HandleObject<S>` - Handles object schemas
- `HandleArray<S>` - Handles array schemas
- `HandleOneOf<S>` - Handles oneOf (union) schemas
- `HandleEnum<S>` - Handles enum schemas

## Limitations and Constraints

Since Typson operates purely at the TypeScript type level, it has some inherent
limitations:

1. **No Runtime Validation**: Schemas don't provide runtime type checking or
   validation
2. **Type-Level Only**: All processing happens during compilation
3. **TypeScript Constraints**: Limited by TypeScript's type system capabilities
4. **No Recursive Types**: Deep recursion may hit TypeScript's recursion limits
5. **Format Constraints**: String formats are metadata only and don't affect
   types

## Comparison with Similar Tools

| Feature            | Typson                                 | Zod                                     | TypeBox                                 | JSON Schema                                 |
| ------------------ | -------------------------------------- | --------------------------------------- | --------------------------------------- | ------------------------------------------- |
| Runtime validation | ❌                                     | ✅                                      | ✅                                      | ✅                                          |
| Type inference     | ✅                                     | ✅                                      | ✅                                      | ❌                                          |
| Bundle size        | **Tiny**                               | **Large**                               | **Medium**                              | **N/A**                                     |
| JSON Schema compat | ✅                                     | **Partial**                             | ✅                                      | ✅                                          |
| Performance        | **Compile-time only** (0 runtime cost) | Runtime overhead                        | Runtime overhead (fast with AJV)        | Depends on validator (AJV is fast)          |
| Test Coverage      | **100% (type-level, exhaustive)**      | **High** (runtime + partial type tests) | **High** (runtime + schema correctness) | **Spec-defined**, depends on validator impl |

## Use Cases

Typson is ideal for:

- **API Type Definitions**: Define request/response shapes
- **Configuration Schemas**: Type-safe config objects
- **Data Modeling**: Structure complex data types
- **Interface Contracts**: Shared type definitions between modules
- **Documentation**: Self-documenting schemas with metadata

## Contributing

Contributions are welcome! Please see the main Monitext.js repository for
contribution guidelines.

## License

Apache-2.0

## Related Packages

- `@monitext/typsert` - Type-level testing utilities used by Typson
- `@monitext/core` - Core Monitext functionality
- `@monitext/utils` - Shared utilities

---

Made with ❤️ by the Monitext team
