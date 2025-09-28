# @monitext/typsert

**typsert** is a powerful TypeScript compile-time type assertion library that provides utilities for type checking, equality testing, and assignability validation entirely at the type level.

## Overview

typsert enables you to write type-level tests and assertions that are evaluated during TypeScript compilation. This is particularly useful for:

- Testing complex type transformations
- Validating generic type constraints
- Ensuring type safety in library APIs
- Creating compile-time unit tests for types

## Features

- **Type Equality Testing**: Check if two types are exactly equal
- **Type Assignability Testing**: Verify if one type can be assigned to another
- **Type Assertions**: Create compile-time assertions with descriptive error messages
- **Batch Operations**: Test multiple types at once
- **Zero Runtime Overhead**: All operations happen at compile-time

## Installation

```bash
npm install @monitext/typsert
# or
pnpm add @monitext/typsert
# or
yarn add @monitext/typsert
```

## API Reference

### Type Equality

#### `Equal<T, U>`

Check whether two types are **exactly** equal.

```typescript
import { Equal } from 'typsert';

type Test1 = Equal<string, string>; // true
type Test2 = Equal<string, number>; // false
type Test3 = Equal<'hello', string>; // false (not exactly equal)
```

#### `NotEqual<T, U>`

Check whether two types are **not** exactly equal.

```typescript
import { NotEqual } from 'typsert';

type Test1 = NotEqual<string, number>; // true
type Test2 = NotEqual<string, string>; // false
```

#### `Equals<T>`

Check whether all types in a tuple are exactly equal to each other.

```typescript
import { Equals } from 'typsert';

type Test1 = Equals<[string, string, string]>; // true
type Test2 = Equals<[string, number, string]>; // false
type Test3 = Equals<[string]>; // true (single element)
```

#### `NotEquals<T>`

Check whether not all types in a tuple are exactly equal.

```typescript
import { NotEquals } from 'typsert';

type Test1 = NotEquals<[string, number, boolean]>; // true
type Test2 = NotEquals<[string, string, string]>; // false
```

### Type Assignability

#### `Assignable<T, U>`

Check whether type `T` is assignable to type `U`.

```typescript
import { Assignable } from 'typsert';

type Test1 = Assignable<'hello', string>; // true
type Test2 = Assignable<string, 'hello'>; // false
type Test3 = Assignable<number, string>; // false
```

#### `NotAssignable<T, U>`

Check whether type `T` is **not** assignable to type `U`.

```typescript
import { NotAssignable } from 'typsert';

type Test1 = NotAssignable<number, string>; // true
type Test2 = NotAssignable<'hello', string>; // false
```

#### `Assignables<T, U>`

Check whether all types in tuple `T` are assignable to type `U`.

```typescript
import { Assignables } from 'typsert';

type Test1 = Assignables<['a', 'b', 'c'], string>; // true
type Test2 = Assignables<[1, 2, 'c'], string>; // false
```

#### `NotAssignables<T, U>`

Check whether not all types in tuple `T` are assignable to type `U`.

```typescript
import { NotAssignables } from 'typsert';

type Test1 = NotAssignables<[1, 2, 'c'], string>; // true
type Test2 = NotAssignables<['a', 'b', 'c'], string>; // false
```

### Type Assertions

#### `Assert<T>`

Create compile-time assertions with descriptive error messages.

```typescript
import { Assert } from 'typsert';

type MyTest = Assert<[
  ["String should equal string", Equal<string, string>],
  ["Number should not equal string", NotEqual<number, string>],
  ["Literal should be assignable to string", Assignable<'hello', string>]
]>;

// If all assertions pass, MyTest will be `true`
// If any fail, you'll get descriptive compile-time errors
```

#### `TypeAssert`

Runtime function for type assertions (compile-time validation).

```typescript
import { TypeAssert } from 'typsert';

const result = TypeAssert<[
  ["Basic equality test", Equal<string, string>],
  ["Assignability test", Assignable<'hello', string>]
]>();

// Returns an array of assertion results with status and labels
```

#### `IsTrue<T>` and `IsFalse<T>`

Utility types to assert that a type is exactly `true` or `false`.

```typescript
import { IsTrue, IsFalse } from 'typsert';

type Test1 = IsTrue<Equal<string, string>>; // ✓ Compiles
type Test2 = IsFalse<Equal<string, number>>; // ✓ Compiles
// type Test3 = IsTrue<Equal<string, number>>; // ✗ Compile error
```

### Utility Types

#### `Not<T>`

Invert the result of a boolean type.

```typescript
import { Not } from 'typsert';

type Test1 = Not<true>; // false
type Test2 = Not<false>; // true
```

## Usage Examples

### Testing Complex Type Transformations

```typescript
import { Assert, Equal, Assignable } from 'typsert';

// Test a complex utility type
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type TestDeepReadonly = Assert<[
  [
    "DeepReadonly should make nested properties readonly",
    Equal<
      DeepReadonly<{ a: { b: string } }>,
      { readonly a: { readonly b: string } }
    >
  ]
]>;
```

### Validating Generic Constraints

```typescript
import { Assert, Assignable } from 'typsert';

function processItems<T extends string[]>(items: T): T {
  return items;
}

type TestGenericConstraint = Assert<[
  ["String array should be assignable", Assignable<string[], string[]>],
  ["Tuple should be assignable to string array", Assignable<['a', 'b'], string[]>]
]>;
```

### Creating Type-Level Unit Tests

```typescript
import { Assert, Equal, NotEqual, Assignable } from 'typsert';

// Test suite for a utility type
type Reverse<T extends readonly unknown[]> = T extends readonly [...infer Rest, infer Last]
  ? [Last, ...Reverse<Rest>]
  : [];

type ReverseTests = Assert<[
  ["Empty array", Equal<Reverse<[]>, []>],
  ["Single element", Equal<Reverse<[1]>, [1]>],
  ["Multiple elements", Equal<Reverse<[1, 2, 3]>, [3, 2, 1]>],
  ["String tuple", Equal<Reverse<['a', 'b', 'c']>, ['c', 'b', 'a']>]
]>;
```

## Key Concepts

### Equality vs Assignability

It's important to understand the difference between **equality** and **assignability**:

- **Equality** (`Equal<T, U>`): Types must be exactly the same
- **Assignability** (`Assignable<T, U>`): Type `T` can be assigned to type `U`

```typescript
import { Equal, Assignable } from 'typsert';

// These demonstrate the difference:
type EqualTest = Equal<'hello', string>; // false - not exactly equal
type AssignableTest = Assignable<'hello', string>; // true - 'hello' can be assigned to string
```

### Compile-Time Only

All typsert operations happen at compile-time. The library has zero runtime overhead and is purely for TypeScript type checking and validation.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
