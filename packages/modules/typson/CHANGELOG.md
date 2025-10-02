# @monitext/typson

## 0.1.2

### Patch Changes

- Stabilized `ToType` conversion for schema builders:
  - `T.object`
  - `T.array`
  - `T.oneOf`

  > Mixed object/array/oneOf now fully operational. Extended type coverage for
  > these builders as well. Schema to type conversion now fully stable, with
  > full test coverage.

## 0.1.1

### Patch Changes

- Stabilized `ToType` conversion for schema builder `T.object`

  > Extended Test Coverage for `T.object` (excluding `array` and `oneOf`)

## 0.1.0

### Minor Changes

- Added `T.Infer<S>` utility for schema to type conversion

  > deleted `T.null`, `T.enum` and replaced by `T.literals`

## 0.0.2

### Patch Changes

- Stabilized `ToType` conversion for schema builders:
  - `T.string`
  - `T.number`
  - `T.boolean`
  - `T.null`
  - `T.enum`
  - `T.literal`

  > Extended type coverage for these builders as well.

## 0.0.1

### Patch Changes

- Resolved an issue where oneOfSchema was not correctly handled when nested
  inside object or array schemas
- Resolved an issue where array schemas alike
  `{ type: "array", items: { Schema } }` could produce mismatched types
- Extended test coverage for all `Schema-Handler` types
