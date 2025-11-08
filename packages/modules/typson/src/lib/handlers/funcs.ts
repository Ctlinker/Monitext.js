import { FunctionSchemaExtension, JSONSchema } from "../schema";
import { ToType } from "../to-types";

/**
 * Infers the **TypeScript function signature** from a given {@link FunctionSchemaExtension}.
 *
 * Depending on whether `params` is defined as an object or an array,
 * it will generate either:
 *  - a single-parameter function `(param) => result`, or
 *  - a multi-parameter function `(...args) => result`.
 *
 * It also respects the `async` flag, wrapping the result in a `Promise` when `true`.
 *
 * @template S - The functional schema to infer from.
 */
export type HandleFunc<S extends FunctionSchemaExtension> = S extends {
  params?: infer X extends object;
  async?: infer Y;
  return?: infer Z;
}
  ? X extends any[]
    ? InferFnMultiParam<X, InferResult<Y, Z>>
    : InferFn<X, InferResult<Y, Z>>
  : never;

/**
 * Infers a single-parameter function from a schema.
 *
 * @template Param - Parameter schema definition.
 * @template Result - Return type inferred from `InferResult`.
 *
 * @example
 * ```ts
 * // { required: true, schema: { type: "string" } }
 * // => (param: string) => Result
 * ```
 */
type InferFn<Param, Result> = Param extends never | null | undefined
  ? () => Result
  : Param extends {
      required?: infer X extends boolean | undefined;
      schema: infer U extends JSONSchema;
    }
  ? X extends true
    ? (param: ToType<U>) => Result
    : (param?: ToType<U>) => Result
  : never;

/**
 * Infers a multi-parameter function from an array of schemas.
 *
 * @template Params - Array of parameter schemas.
 * @template Result - Return type inferred from `InferResult`.
 *
 * @example
 * ```ts
 * // [{ schema: { type: "string" } }, { schema: { type: "number" } }]
 * // => (a: string, b: number) => Result
 * ```
 */
type InferFnMultiParam<Params, Result> =
  Params extends readonly (infer P)[]
    ? (...args: {
        [K in keyof Params]:
          Params[K] extends { required?: infer X extends boolean; schema: infer S extends JSONSchema }
            ? X extends true
              ? ToType<S>
              : ToType<S> | undefined
            : never
      }) => Result
    : never


/**
 * Determines the correct return type based on the `async` flag and `return` schema.
 *
 * @template IsAsync - Whether the function is asynchronous.
 * @template RSchema - The return type schema.
 * @template Result - The result type inferred from {@link ToType}.
 *
 * @example
 * ```ts
 * // async: true, return: { type: "number" }
 * // => Promise<number>
 * ```
 */
type InferResult<
  IsAsync,
  RSchema,
  Result = ToType<RSchema>
> = IsAsync extends true
  ? Result extends never
    ? Promise<void>
    : Promise<Result>
  : Result extends never
  ? void
  : Result;