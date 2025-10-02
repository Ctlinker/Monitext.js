# Test Note

**array:** prefixItems creates a tuple of required element items append a
`...(types)[]` as end value

**typsert:** Double Union type can fool the `Assignable` helper to some extend,
eg:

```ts
const c: { type: "admin"; id: "admin-123" } extends
    | ({
        id?: string | undefined;
    } & {
        type: "user";
    })
    | ({
        permissions?: "all"[] | undefined;
    } & {
        type: "admin";
    }) ? true
    : false = true;
```

is true, yet when using the type itself eg:

```ts
const c = { type: "admin"; id: "admin-123" } satisfies
    | ({
        id?: string | undefined;
    } & {
        type: "user";
    })
    | ({
        permissions?: "all"[] | undefined;
    } & {
        type: "admin";
    });
```

TS while rise an error as `{ type: "admin"; id: "admin-123" }` violate the
constrain
