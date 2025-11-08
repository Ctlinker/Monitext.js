# @monitext/ndata

<!-- Badges: Uncomment and update as needed -->
<!-- ![npm version](https://img.shields.io/npm/v/@monitext/ndata) -->
<!-- ![license](https://img.shields.io/npm/l/@monitext/ndata) -->
<!-- ![build status](https://img.shields.io/github/workflow/status/your-org/your-repo/CI) -->

A small, TypeScript-first utility library for strongly-typed Result wrappers and helpers for working with primitive data structures. Designed to make safe function execution, error handling, and simple data struct typing ergonomic and predictable across environments.

- **Package:** `@monitext/ndata`
- **License:** Apache-2.0
- **Goal:** Provide zero-dependency utilities for Result objects, primitive data types, and small struct helpers.

---

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [API Overview](#api-overview)
- [API Details](#api-details)
  - [`Result`](#resultv-e)
  - [`PrimitiveResult` / `Result.primitives`](#primitiveresultv-e-and-resultprimitives)
  - [`createResult`](#createresultt)
  - [`createResultableFn`](#createresultablefn)
  - [`D` / `DataTypes`](#d-data-types)
- [Error Handling Patterns](#error-handling-patterns)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## API Overview

| Export                       | Description                                                                                   |
|------------------------------|-----------------------------------------------------------------------------------------------|
| `Result`                     | Class for success/failure results, with helpers and type guards                               |
| `Result.primitives`          | Factory for primitive-only results (see [PrimitiveResult](#primitiveresultv-e-and-resultprimitives)) |
| `createResult`               | Wraps a value or error into a result object                                                   |
| `createResultableFn`         | Wraps sync/async functions to always return results (never throws)                            |
| `D` / `DataTypes`            | Namespace for primitive types and result type definitions                                     |

---

## API Details

### Result<V, E>

A simple class used to represent success and failure.

- `Result.ok<V>(v: V): IOKResult<V>`  
  Create a success result (value present, error undefined).

- `Result.fail(e: Error): IFailResult`  
  Create a failure result (error present, value undefined).

- `Result.primitives.ok<V extends PrimitiveData>(v: V): IOKResult<V>`  
  Create a success result for primitive data.

- `Result.primitives.fail(e: Error): IFailResult`  
  Create a failure result for primitive data.

- Methods:  
  - `unwrap()`: Returns value or throws error  
  - `unwrapOr(defaultValue)`: Returns value or default  
  - `isOk()`: Type guard for success  
  - `isErr()`: Type guard for failure  
  - `expect({ msg, handler, throwErr })`: Custom error handling (see [Error Handling Patterns](#error-handling-patterns))

Usage:

```ts
import { Result } from '@monitext/ndata';

const success = Result.ok({ id: 1 });
const failure = Result.fail(new Error('problem'));
```

Type shapes:

- `IOKResult<T>`: `{ value: T; error: undefined }`
- `IFailResult`: `{ value: undefined; error: Error | string }`
- `IResult<T>`: `IOKResult<T> | IFailResult`

---

### PrimitiveResult<V, E> and Result.primitives

A variant intended for primitive-friendly payloads (string/number/boolean/null/undefined/symbol, arrays, and plain primitive objects).  
**Note:** In code, use `Result.primitives.ok` and `Result.primitives.fail` for this functionality.

- `Result.primitives.ok(v)`
- `Result.primitives.fail(error)`

Use when you want additional semantic clarity that the value is limited to primitive-style data.

---

### createResult<T>(v: T): IResult<T>

Wrap a value (or an Error) into an `IResult`:

- If `v` is an `Error` instance -> returns a failure result.
- Otherwise -> returns a success result.

```ts
import { createResult } from '@monitext/ndata';

const r1 = createResult('ok'); // success
const r2 = createResult(new Error()); // failure
```

---

## Error Handling Patterns

The `Result` class provides flexible error handling.  
The `.expect()` method allows you to customize what happens on error:

```ts
const r = Result.fail(new Error('fail!'));
r.expect({
  msg: 'Something went wrong',
  handler: ({ err }) => {
    // Custom logic, e.g., log or transform error
    return 'default value';
  },
  throwErr: false // Prevents throwing, returns handler result
});
```

- If `handler` returns a value, it is returned.
- If `throwErr` is true (default) and no handler returns a value, the error is thrown.
- If both are omitted, an error is thrown by default.

---


### createResultableFn(fn)

Creates a wrapper around the given function so that it never throws — instead it returns `IResult` (for sync functions) or `Promise<IResult>` (for async functions).

- Works with synchronous and asynchronous functions.
- Catches thrown errors and rejected promises, wrapping them as failure results.
- Preserves return typing (the function's return becomes the `value` in success results).

```ts
import { createResultableFn } from '@monitext/ndata';

const safe = createResultableFn((a: number, b: number) => a + b);
const ok = safe(1, 2); // IOKResult<number>

const asyncSafe = createResultableFn(async () => {
	const res = await fetch('https://...');
	return res.json();
});
const result = await asyncSafe(); // Promise<IResult<any>>
```

Notes:

- The wrapper inspects the function text to detect `async`. This provides the correct return signature (sync vs async wrapper).

---

### D / DataTypes

The `D` (or `DataTypes`) export contains type definitions and helpers:

- `D.Primitive` — union of basic primitive types
- `D.PrimitiveArray` — nested arrays of primitives/objects
- `D.PrimitiveObject` — plain object with primitive/array/object values
- `D.PrimitiveData` — union of all primitive data shapes
- `D.IResult<T>`, `D.IOKResult<T>`, `D.IFailResult`, etc.

Example:

```ts
import * as D from '@monitext/ndata'; // or import * as DataTypes from '@monitext/ndata'
type P = D.PrimitiveObject;
```

---

## Installation

Using pnpm (recommended in this monorepo)

```bash
pnpm add @monitext/ndata
```

Using npm

```bash
npm install @monitext/ndata
```

Using yarn

```bash
yarn add @monitext/ndata
```

---

## Quick start

Import the library (TypeScript)

```ts
import { Result, createResult, createResultableFn } from '@monitext/ndata';
import * as D from '@monitext/ndata/src/lib/data-types'; // or `import * as D from '@monitext/ndata'` when consumed via package
```

Create success/failure Results:

```ts
const ok = Result.ok(42); // { value: 42, error: undefined }
const fail = Result.fail(new Error('oops')); // { value: undefined, error: Error }
```

Wrap arbitrary values:

```ts
const wrapped = createResult('hello'); // success result
const wrappedErr = createResult(new Error('boom')); // failure result
```

Make a safe function that returns `IResult` instead of throwing:

```ts
const safeAdd = createResultableFn((a: number, b: number) => a + b);
const r = safeAdd(2, 3);
if (r.error) {
	// handle error
} else {
	console.log(r.value); // 5
}
```

Async support:

```ts
const safeFetch = createResultableFn(async (url: string) => {
	const res = await fetch(url);
	return res.json();
});

const result = await safeFetch('https://example.com/data');
if (result.error) {
	// error handling
} else {
	// use result.value
}
```

---

## API

All examples below are TypeScript-friendly.

### Result<V, E>

A simple class used to represent success and failure.

- `Result.ok<V>(v: V): IOKResult<V>`  
  Create a success result (value present, error undefined).

- `Result.fail(e: Error): IFailResult`  
  Create a failure result (error present, value undefined).

Usage:

```ts
import { Result } from '@monitext/ndata';

const success = Result.ok({ id: 1 });
const failure = Result.fail(new Error('problem'));
```

Type shapes:

- `IOKResult<T>`: `{ value: T; error: undefined }`
- `IFailResult`: `{ value: undefined; error: Error | string }`
- `IResult<T>`: `IOKResult<T> | IFailResult`

---

### PrimitiveResult<V, E>

A variant intended for primitive-friendly payloads (string/number/boolean/null/undefined/symbol, arrays, and plain primitive objects). API mirrors `Result`:

- `PrimitiveResult.ok(v)`
- `PrimitiveResult.fail(error)`

Use when you want additional semantic clarity that the value is limited to primitive-style data.

---

### createResult<T>(v: T): IResult<T>

Wrap a value (or an Error) into an `IResult`:

- If `v` is an `Error` instance -> returns a failure result.
- Otherwise -> returns a success result.

```ts
import { createResult } from '@monitext/ndata';

const r1 = createResult('ok'); // success
const r2 = createResult(new Error()); // failure
```

---

### createResultableFn(fn)

Creates a wrapper around the given function so that it never throws — instead it returns `IResult` (for sync functions) or `Promise<IResult>` (for async functions).

- Works with synchronous and asynchronous functions.
- Catches thrown errors and rejected promises, wrapping them as failure results.
- Preserves return typing (the function's return becomes the `value` in success results).

```ts
import { createResultableFn } from '@monitext/ndata';

const safe = createResultableFn((a: number, b: number) => a + b);
const ok = safe(1, 2); // IOKResult<number>

const asyncSafe = createResultableFn(async () => {
	const res = await fetch('https://...');
	return res.json();
});
const result = await asyncSafe(); // Promise<IResult<any>>
```

Notes:

- The wrapper inspects the function text to detect `async`. This provides the correct return signature (sync vs async wrapper).

### D (data-types)

The `D` export contains type definitions and helpers:

- `D.Primitive` — union of basic primitive types
- `D.PrimitiveArray` — nested arrays of primitives/objects
- `D.PrimitiveObject` — plain object with primitive/array/object values
- `D.PrimitiveData` — union of all primitive data shapes
- `D.IResult<T>`, `D.IOKResult<T>`, `D.IFailResult`, etc.

Example:

```ts
import * as D from '@monitext/ndata';

type P = D.PrimitiveObject;
```

---

## Development

Common scripts (from package.json):

- Format code:
  ```bash
  pnpm run format
  ```
- Typecheck (no emit):
  ```bash
  pnpm run typecheck
  ```
- Run tests:
  ```bash
  pnpm run test
  ```
- Bundle (build artifacts to `dist`):
  ```bash
  pnpm run bundle
  ```
- Full build (typecheck -> tests -> format -> bundle):
  ```bash
  pnpm run build
  ```

Project uses TypeScript + Vitest for tests. Ensure Node >= 18 when running tooling.

---

## Contributing

- Follow the repository's contribution guidelines.
- Run tests and typechecks before opening PRs.
- Keep changes small and well-documented.
- Use the monorepo's project tooling (pnpm workspace) for local development.

---

## License

Apache-2.0
