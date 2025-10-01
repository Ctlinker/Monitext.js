# @monitext/typson

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

- Resolved an issue where oneOfSchema was not correctly handled when nested inside object or array schemas
- Resolved an issue where array schemas alike `{ type: "array", items: { Schema } }` could produce mismatched types
- Extended test coverage for all `Schema-Handler` types
