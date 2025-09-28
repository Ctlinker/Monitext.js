/**
 * Compile-time assertion helper
 *
 * - Input: tuple of [label, boolean]
 * - If all pass, evaluates to `true`
 * - Otherwise, returns union of failure messages
 */
export type Assert<T extends readonly (readonly [string, boolean])[]> =
  T extends readonly (readonly [string, true])[] ? true
    : {
      [K in keyof T]: T[K] extends
        readonly [infer Label extends string, infer Result extends boolean]
        ? Result extends false ? `Assertion failed: ${Label}`
        : never
        : never;
    }[number];

/**
 * Convenience strict checks
 */
export type IsTrue<T extends true> = T;
export type IsFalse<T extends false> = T;

/**
 * Rich object result mapping
 */
export type CheckAssertions<T extends readonly (readonly [string, boolean])[]> =
  {
    [K in keyof T]: T[K] extends
      readonly [infer Label extends string, infer Result extends boolean]
      ? Result extends true ? { status: "pass"; label: Label }
      : { status: "fail"; label: Label }
      : never;
  };

/**
 * Runtime no-op function for IDE feedback
 * - Allows inspection of results in tooltips
 */
export declare function TypeAssert<
  T extends readonly (readonly [string, boolean])[],
>(
  param?: T extends readonly (readonly [string, true])[] ? true
    : CheckAssertions<T>,
): CheckAssertions<T>;
