# @monitext/ndata

A small, TypeScript-first utility library that provides strongly-typed Result wrappers and helpers for working with primitive data structures. Designed to make safe function execution, error handling, and simple data struct typing ergonomic and predictable across environments.

- Package: `@monitext/ndata`
- License: Apache-2.0
- Goal: Provide zero-dependency utilities for Result objects, primitive data types, and small struct helpers.

Table of contents

- Installation
- Quick start
- API
  - `Result`
  - `PrimitiveResult`
  - `createResult`
  - `createResultableFn`
  - `D` (data-types)
- Development
- Contributing
- License

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
