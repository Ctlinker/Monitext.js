# @monitext/typsert

**typsert** is a powerful TypeScript compile-time type assertion library that provides utilities for type checking, equality testing, and assignability validation entirely at the type level.

## Overview

typsert enables you to write type-level tests and assertions that are evaluated during TypeScript compilation. Perfect for testing complex type transformations, validating generic constraints, and creating compile-time unit tests for types.

## Features

- 🔍 **Type Equality & Assignability Testing** - Precise type relationship validation
- 🎯 **Enhanced Assertion Patterns** - `AllPass`, `AllFails`, `SomePass`, `SomeFail` utilities
- 📊 **Rich Debugging Output** - See exactly which assertions failed and why
- ⚡ **Zero Runtime Overhead** - All operations happen at compile-time
- 🔧 **Simple API** - Clean, intuitive interface without unnecessary complexity

## Installation

```bash
npm install @monitext/typsert
# or
pnpm add @monitext/typsert
# or
yarn add @monitext/typsert
```

## Quick Start

```typescript
import { TypeAssert, Assignable, AllPass } from '@monitext/typsert';

// Simple assertion
TypeAssert<[
  ['String is assignable to unknown', Assignable<string, unknown>]
]>(true);

// Complex pattern with AllPass
TypeAssert<[
  [
    'Type safety is properly maintained',
    AllPass<[
      Assignable<string, unknown>,
      Assignable<number, unknown>,
      Assignable<boolean, unknown>
    ]>
  ]
]>(true);
```

## Enhanced Assertion Patterns

### `AllPass<T>` - All Must Pass

Check that all assertions in a tuple are `true`. Returns detailed failure information for debugging.

```typescript
import { Typsert, AllPass, Assignable, NotAssignable } from '@monitext/typsert';

type User = { id: string; name: string };
type AdminUser = User & { permissions: string[] };

Typsert<[
  [
    'Admin user inheritance works correctly',
    AllPass<[
      Assignable<AdminUser, User>,        // Admin is a User
      NotAssignable<User, AdminUser>,     // But User is not Admin
      Assignable<AdminUser, { id: string }> // Admin has id
    ]>
  ]
]>(true);

// If any assertion fails, you get detailed output:
// {
//   status: "fail",
//   label: "Admin user inheritance works correctly",
//   output: [true, false, true] // Shows exactly which failed!
// }
```

### `AllFails<T>` - All Must Fail

Check that all assertions in a tuple are `false`. Perfect for testing that certain type relationships should never exist.

```typescript
TypeAssert<[
  [
    'Type safety prevents dangerous assignments',
    AllFails<[
      Assignable<string, number>,
      Assignable<boolean, string>,
      Assignable<object, string>
    ]>
  ]
]>(true);

// If any unexpectedly passes, you get a mapped output:
// {
//   status: "fail",
//   label: "Type safety prevents dangerous assignments",
//   output: {0: true, 1: false, 2: true} // Position 1 unexpectedly passed!
// }
```

### `SomePass<T>` - At Least One Must Pass

Check that at least one assertion in the tuple is `true`.

```typescript
TypeAssert<[
  [
    'At least one compatibility path exists',
    SomePass<[
      Assignable<string, object>,
      Assignable<number, object>,
      Assignable<boolean, object>
    ]>
  ]
]>(true);
```

### `SomeFail<T>` - At Least One Must Fail

Check that at least one assertion in the tuple is `false`.

```typescript
TypeAssert<[
  [
    'Some type relationships properly fail',
    SomeFail<[
      Assignable<string, number>,
      Assignable<number, string>,
      Assignable<string, unknown> // This one passes
    ]>
  ]
]>(true);
```

## Core Type Utilities

### Type Equality

```typescript
import { Equal, NotEqual, Equals } from '@monitext/typsert';

type Test1 = Equal<string, string>;     // true
type Test2 = NotEqual<string, number>;  // true
type Test3 = Equals<[string, string]>;  // true - all equal
```

### Type Assignability

```typescript
import { Assignable, NotAssignable, Assignables } from '@monitext/typsert';

type Test1 = Assignable<'hello', string>;        // true
type Test2 = NotAssignable<string, 'hello'>;     // true
type Test3 = Assignables<['a', 'b'], string>;    // true - all assignable
```

## Real-World Examples

### Testing Complex Type Transformations

```typescript
// Before: Nested conditionals (hard to read)
TypeAssert<[
  [
    'Complex validation',
    Assignable<A, B> extends true
      ? NotAssignable<B, A> extends false
        ? NotAssignable<A, C> extends true
          ? true : false
        : false
      : false
  ]
]>(false);

// After: Clean with AllPass
TypeAssert<[
  [
    'A demonstrates proper subset behavior to B',
    AllPass<[
      Assignable<A, B>,
      NotAssignable<B, A>,
      NotAssignable<A, C>
    ]>
  ]
]>(true);
```

### Array and Tuple Type Testing

```typescript
TypeAssert<[
  [
    'Array type relationships work as expected',
    AllPass<[
      Assignable<[string, number], readonly [string, number]>,
      Assignable<string[], readonly string[]>,
      NotAssignable<readonly string[], string[]>
    ]>
  ],
  [
    'Generic constraints are enforced',
    SomePass<[
      Assignable<string, unknown>,
      Assignable<{ x: number }, object>,
      Assignable<number[], any[]>
    ]>
  ]
]>(true);
```

### Testing Utility Types

```typescript
// Test a conditional type utility
type NonNullable<T> = T extends null | undefined ? never : T;

TypeAssert<[
  [
    'NonNullable removes null and undefined',
    AllPass<[
      Equal<NonNullable<string | null>, string>,
      Equal<NonNullable<number | undefined>, number>,
      Equal<NonNullable<boolean | null | undefined>, boolean>
    ]>
  ],
  [
    'NonNullable preserves other types',
    AllPass<[
      Equal<NonNullable<string>, string>,
      Equal<NonNullable<object>, object>,
      Equal<NonNullable<any[]>, any[]>
    ]>
  ]
]>(true);
```

## API Reference

### Assertion Functions

#### `TypeAssert<T>(param: boolean): CheckAssertions<T>`

Main assertion function with enhanced debugging output.

```typescript
// Parameter must match expected result:
TypeAssert<[['Should pass', true]]>(true);   // ✓
TypeAssert<[['Should fail', false]]>(false); // ✓
// TypeAssert<[['Should pass', true]]>(false); // ✗ Type error
```

#### `Typsert<T>`

Alias for `TypeAssert` - same functionality, shorter name.

### Enhanced Pattern Types

- `AllPass<T extends readonly boolean[]>` - All assertions must be `true`
- `AllFails<T extends readonly boolean[]>` - All assertions must be `false`
- `SomePass<T extends readonly boolean[]>` - At least one must be `true`
- `SomeFail<T extends readonly boolean[]>` - At least one must be `false`

### Core Utility Types

- `Equal<T, U>` - Types are exactly equal
- `NotEqual<T, U>` - Types are not exactly equal
- `Assignable<T, U>` - T is assignable to U
- `NotAssignable<T, U>` - T is not assignable to U
- `Equals<T>` - All types in tuple are equal
- `Assignables<T, U>` - All types in T are assignable to U

## Enhanced Debug Output

The enhanced `TypeAssert` provides rich debugging information:

```typescript
// For AllPass failures:
{
  status: "fail",
  label: "Your assertion label",
  output: [true, false, true] // Shows which specific assertions failed
}

// For AllFails failures:
{
  status: "fail",
  label: "Your assertion label",
  output: {0: true, 1: false, 2: true} // Maps position to pass/fail
}

// For simple boolean failures:
{
  status: "fail",
  label: "Your assertion label",
  output: false // The actual result
}
```

## Best Practices

### 1. Use Descriptive Labels
```typescript
// ✅ Good - Clear intent
['String properly widens to unknown type', Assignable<string, unknown>]

// ❌ Avoid - Vague
['Test 1', Assignable<string, unknown>]
```

### 2. Choose the Right Pattern
```typescript
// ✅ Use AllPass for AND logic
AllPass<[condition1, condition2, condition3]>

// ✅ Use SomePass for OR logic
SomePass<[condition1, condition2, condition3]>

// ✅ Use AllFails to verify all conditions fail
AllFails<[shouldBeFalse1, shouldBeFalse2]>
```

### 3. Group Related Assertions
```typescript
// ✅ Good - Logical grouping
TypeAssert<[
  ['Core type safety rules', AllPass<[/* related assertions */]>],
  ['Edge cases handled properly', AllFails<[/* edge cases */]>]
]>(true);
```

## Migration from v0.0.x

The enhanced patterns are fully backward compatible:

```typescript
// Existing code continues to work:
TypeAssert<[
  ['Basic test', Equal<string, string>]
]>(true);

// Enhanced with new patterns:
TypeAssert<[
  [
    'Enhanced validation',
    AllPass<[
      Equal<string, string>,
      Assignable<'hello', string>,
      NotAssignable<number, string>
    ]>
  ]
]>(true);
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE) for details.
