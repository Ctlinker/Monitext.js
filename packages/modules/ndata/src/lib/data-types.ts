/**
 * A Primitive is any basic serializable data type.
 */
export type Primitive = string | number | boolean | null | undefined | symbol;

/**
 * A recursive structure allowing arrays of primitives or nested structures.
 */
export type PrimitiveArray = (Primitive | PrimitiveArray | PrimitiveObject)[];

/**
 * A plain object composed of primitive values, arrays, or nested objects.
 */
export interface PrimitiveObject {
  [key: string | number]: Primitive | PrimitiveArray | PrimitiveObject;
}

export type PrimitiveData = Primitive | PrimitiveArray | PrimitiveObject;

export type IOKResult<T> = {
  /** The result of a successful operation. */
  value: T;
  error: undefined;
};

export type IFailResult = {
  /** Error returned from a failed operation. */
  error: Error | string;
  value: undefined;
};

/**
 * Generic result wrapper for functions that may succeed or fail.
 *
 * @template T - Return value type, Promise-compatible.
 */
export type IResult<T> = IFailResult | IOKResult<T>;

export type IPrimitiveResult<T extends PrimitiveData> = IResult<T>;
