import { Not } from "../../src/main";
import { IsFalse, IsTrue } from "../TEST-UTILS";

// === Basic Not Tests ===

// Not<true> should be false
IsTrue<Not<true> extends false ? true : false>;
IsFalse<Not<true>>;

// Not<false> should be true
IsTrue<Not<false> extends true ? true : false>;
IsTrue<Not<false>>;

// === Non-Boolean Types ===

// Not of most non-true types should be true, but some special types behave differently
IsTrue<Not<false>>;
IsTrue<Not<string>>;
IsTrue<Not<number>>;
IsTrue<Not<object>>;
IsFalse<Not<any>>; // any extends [true] in this context
IsTrue<Not<unknown>>;
IsFalse<Not<never>>; // never extends [true] in this context
IsTrue<Not<void>>;

// === Literal Types ===

// String literals should result in true
IsTrue<Not<"hello">>;
IsTrue<Not<"">>;

// Number literals should result in true
IsTrue<Not<42>>;
IsTrue<Not<0>>;
IsTrue<Not<-1>>;

// Other boolean literal
IsFalse<Not<true>>;
IsTrue<Not<false>>;

// === Union Types ===

// Unions containing true should be inverted properly
// Note: Not<T> where T is a union will distribute
type UnionWithTrue = true | false;
type UnionWithoutTrue = string | number;

// When T extends true, we get false, otherwise true
// For unions, this becomes complex due to distribution
IsTrue<Not<false>>;
IsTrue<Not<string | number>>;

// === Complex Boolean Expressions ===

import { Assignable, Equal } from "../../src/main";

// Not applied to type comparisons
IsTrue<Not<Equal<string, number>>>; // Equal<string, number> is false, so Not<false> is true
IsFalse<Not<Equal<string, string>>>; // Equal<string, string> is true, so Not<true> is false

IsTrue<Not<Assignable<string, number>>>; // Assignable<string, number> is false, so Not<false> is true
IsFalse<Not<Assignable<string, string>>>; // Assignable<string, string> is true, so Not<true> is false

// === Conditional Types ===

type IsString<T> = T extends string ? true : false;

// Not applied to conditional types
IsFalse<Not<IsString<string>>>; // IsString<string> is true, so Not<true> is false
IsTrue<Not<IsString<number>>>; // IsString<number> is false, so Not<false> is true

// === Nested Not Operations ===

// Double negation should return to original for boolean literals
IsTrue<Not<Not<true>>>; // Not<Not<true>> = Not<false> = true

// Actually, let's trace this carefully:
// Not<true> = false
// Not<false> = true
// So Not<Not<true>> = Not<false> = true
// But we want to test if double negation works
// For true: Not<Not<true>> = Not<false> = true ❌ This is wrong!

// Let me reconsider the Not type definition:
// Not<T> = [T] extends [true] ? false : true
// So for Not<true>: [true] extends [true] ? false : true = false ✓
// For Not<false>: [false] extends [true] ? false : true = true ✓

// Double negation:
// Not<Not<true>> = Not<false> = [false] extends [true] ? false : true = true
// Not<Not<false>> = Not<true> = [true] extends [true] ? false : true = false

IsTrue<Not<Not<true>>>; // Not<false> = true
IsFalse<Not<Not<false>>>; // Not<true> = false

// Triple negation
IsFalse<Not<Not<Not<true>>>>; // Not<Not<false>> = Not<true> = false
IsTrue<Not<Not<Not<false>>>>; // Not<Not<true>> = Not<false> = true

// === Integration with Other Utilities ===

// Not combined with complex type operations
type ComplexCheck<T> = Not<Equal<T, never>>;
IsTrue<ComplexCheck<string>>; // Equal<string, never> is false, so Not<false> is true
IsTrue<ComplexCheck<any>>; // Equal<any, never> is false, so Not<false> is true
IsFalse<ComplexCheck<never>>; // Equal<never, never> is true, so Not<true> is false

// Not with assignability checks
type IsNotAssignable<T, U> = Not<Assignable<T, U>>;
IsTrue<IsNotAssignable<string, number>>; // Not assignable, so Not<false> = true
IsFalse<IsNotAssignable<string, string>>; // Assignable, so Not<true> = false
IsFalse<IsNotAssignable<"hello", string>>; // Assignable, so Not<true> = false
IsTrue<IsNotAssignable<string, "hello">>; // Not assignable, so Not<false> = true

// === Edge Cases ===

// Not with generic types
type Generic<T> = { value: T };
type AreGenericsDifferent<T, U> = Not<Equal<Generic<T>, Generic<U>>>;

IsTrue<AreGenericsDifferent<string, number>>; // Generics are different
IsFalse<AreGenericsDifferent<string, string>>; // Generics are same

// Not with mapped types
type ReadonlyVersion<T> = { readonly [K in keyof T]: T[K] };
type User = { name: string; age: number };
type IsReadonlyDifferent = Not<Equal<User, ReadonlyVersion<User>>>;

IsTrue<IsReadonlyDifferent>; // Readonly version is different from mutable

// Not with conditional types and infer
type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type IsVoidReturn<T> = Equal<ExtractReturnType<T>, void>;
type IsNotVoidReturn<T> = Not<IsVoidReturn<T>>;

IsTrue<IsNotVoidReturn<() => string>>; // Returns string, not void
IsFalse<IsNotVoidReturn<() => void>>; // Returns void
IsTrue<IsNotVoidReturn<(x: number) => number>>; // Returns number, not void

// === Performance and Stress Tests ===

// Test with deeply nested types
type DeepNot = Not<Not<Not<Not<Not<true>>>>>;
IsFalse<DeepNot>; // Not<true> -> Not<false> -> Not<true> -> Not<false> -> Not<true> = false

type DeepNotFalse = Not<Not<Not<Not<Not<false>>>>>;
IsTrue<DeepNotFalse>; // Not<false> -> Not<true> -> Not<false> -> Not<true> -> Not<false> = true

// Even number of Nots on true:
type EvenNots = Not<Not<Not<Not<true>>>>;
// Not<true> = false -> Not<false> = true -> Not<true> = false -> Not<false> = true
IsTrue<EvenNots>;

// The key insight is that Not only returns false when input is exactly true
// For all other inputs, including false, it returns true

// === Practical Use Cases ===

// Type guards and validations
type IsNullOrUndefined<T> = Equal<T, null> extends true ? true
	: Equal<T, undefined>;
type IsNotNullOrUndefined<T> = Not<IsNullOrUndefined<T>>;

IsTrue<IsNotNullOrUndefined<string>>;
IsTrue<IsNotNullOrUndefined<number>>;
IsFalse<IsNotNullOrUndefined<null>>;
// Note: IsNullOrUndefined<undefined> might not work as expected due to the conditional type structure

// Better version:
type IsNullish<T> = T extends null | undefined ? true : false;
type IsNotNullish<T> = Not<IsNullish<T>>;
IsTrue<IsNotNullish<string>>; // IsNullish<string> = false, Not<false> = true
IsTrue<IsNotNullish<number>>; // IsNullish<number> = false, Not<false> = true
IsTrue<IsNotNullish<{}>>; // IsNullish<{}> = false, Not<false> = true
IsFalse<IsNotNullish<null>>; // IsNullish<null> = true, Not<true> = false
IsFalse<IsNotNullish<undefined>>; // IsNullish<undefined> = true, Not<true> = false

// Array vs non-array check
type IsArray<T> = T extends any[] ? true : false;
type IsNotArray<T> = Not<IsArray<T>>;

IsTrue<IsNotArray<string>>;
IsTrue<IsNotArray<number>>;
IsTrue<IsNotArray<{}>>;
IsFalse<IsNotArray<string[]>>;
IsFalse<IsNotArray<number[]>>;
IsFalse<IsNotArray<[]>>;
