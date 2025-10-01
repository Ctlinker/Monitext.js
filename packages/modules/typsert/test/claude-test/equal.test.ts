import { Equal, Equals, NotEqual, NotEquals } from "../../src/main";
import { IsFalse, IsTrue } from "../TEST-UTILS";

// === Basic Equal Tests ===

// Same primitive types should be equal
IsTrue<Equal<string, string>>;
IsTrue<Equal<number, number>>;
IsTrue<Equal<boolean, boolean>>;
IsTrue<Equal<null, null>>;
IsTrue<Equal<undefined, undefined>>;

// Different primitive types should not be equal
IsFalse<Equal<string, number>>;
IsFalse<Equal<number, boolean>>;
IsFalse<Equal<boolean, string>>;
IsFalse<Equal<null, undefined>>;

// Literal types equality
IsTrue<Equal<"hello", "hello">>;
IsTrue<Equal<42, 42>>;
IsTrue<Equal<true, true>>;
IsTrue<Equal<false, false>>;
IsFalse<Equal<"hello", "world">>;
IsFalse<Equal<42, 43>>;
IsFalse<Equal<true, false>>;

// Literal types vs base types should NOT be equal (stricter than assignability)
IsFalse<Equal<"hello", string>>;
IsFalse<Equal<42, number>>;
IsFalse<Equal<true, boolean>>;
IsFalse<Equal<string, "hello">>;
IsFalse<Equal<number, 42>>;
IsFalse<Equal<boolean, true>>;

// === Special Types ===

// never equality
IsTrue<Equal<never, never>>;
IsFalse<Equal<never, string>>;
IsFalse<Equal<string, never>>;

// any equality
IsTrue<Equal<any, any>>;
IsFalse<Equal<any, string>>;
IsFalse<Equal<string, any>>;

// unknown equality
IsTrue<Equal<unknown, unknown>>;
IsFalse<Equal<unknown, any>>;
IsFalse<Equal<unknown, string>>;

// void equality
IsTrue<Equal<void, void>>;
IsFalse<Equal<void, undefined>>;
IsFalse<Equal<void, null>>;

// === Basic NotEqual Tests ===

// Different types should be not equal
IsTrue<NotEqual<string, number>>;
IsTrue<NotEqual<number, boolean>>;
IsTrue<NotEqual<"hello", "world">>;
IsTrue<NotEqual<42, 43>>;

// Same types should NOT be not equal (double negative)
IsFalse<NotEqual<string, string>>;
IsFalse<NotEqual<number, number>>;
IsFalse<NotEqual<"hello", "hello">>;
IsFalse<NotEqual<42, 42>>;

// === Object Type Equality ===

type User = { name: string; age: number };
type SameUser = { name: string; age: number };
type DifferentUser = { name: string; age: string }; // age is string instead of number
type ExtendedUser = { name: string; age: number; email: string };

// Structurally identical objects should be equal
IsTrue<Equal<User, SameUser>>;

// Different property types should not be equal
IsFalse<Equal<User, DifferentUser>>;

// Extended objects should not be equal to base (even if assignable)
IsFalse<Equal<User, ExtendedUser>>;
IsFalse<Equal<ExtendedUser, User>>;

// Optional vs required properties
type OptionalProp = { x?: string };
type RequiredProp = { x: string };
IsFalse<Equal<OptionalProp, RequiredProp>>;

// === Array and Tuple Equality ===

// Same array types should be equal
IsTrue<Equal<string[], string[]>>;
IsTrue<Equal<number[], number[]>>;

// Different array types should not be equal
IsFalse<Equal<string[], number[]>>;
IsFalse<Equal<string[], (string | number)[]>>;

// Readonly vs mutable arrays should not be equal
IsFalse<Equal<string[], readonly string[]>>;
IsFalse<Equal<readonly string[], string[]>>;

// Tuple equality
IsTrue<Equal<[string, number], [string, number]>>;
IsFalse<Equal<[string, number], [number, string]>>;
IsFalse<Equal<[string, number], [string, number, boolean]>>;

// === Function Type Equality ===

type StringToString = (x: string) => string;
type SameStringToString = (x: string) => string;
type StringToNumber = (x: string) => number;
type NumberToString = (x: number) => string;

// Same function signatures should be equal
IsTrue<Equal<StringToString, SameStringToString>>;

// Different return types should not be equal
IsFalse<Equal<StringToString, StringToNumber>>;

// Different parameter types should not be equal
IsFalse<Equal<StringToString, NumberToString>>;

// Parameter names don't matter for equality
type NamedParam = (name: string) => string;
type DifferentNamedParam = (value: string) => string;
IsTrue<Equal<NamedParam, DifferentNamedParam>>;

// === Union Type Equality ===

// Same unions should be equal (order doesn't matter)
IsTrue<Equal<string | number, string | number>>;
IsTrue<Equal<string | number, number | string>>;

// Different unions should not be equal
IsFalse<Equal<string | number, string | boolean>>;
IsFalse<Equal<string | number, string | number | boolean>>;

// === Intersection Type Equality ===

type A = { a: string };
type B = { b: number };

IsTrue<Equal<A & B, A & B>>;
IsTrue<Equal<A & B, B & A>>; // order doesn't matter
IsFalse<Equal<A & B, A>>;
IsFalse<Equal<A & B, B>>;

// === Generic Type Equality ===

type Generic<T> = { value: T };
type StringGeneric = Generic<string>;
type NumberGeneric = Generic<number>;

IsTrue<Equal<Generic<string>, StringGeneric>>;
IsFalse<Equal<Generic<string>, Generic<number>>>;
IsFalse<Equal<StringGeneric, NumberGeneric>>;

// === Tuple Equality Tests with Equals ===

// All same types should be equal
IsTrue<Equals<[string, string, string]>>;
IsTrue<Equals<[number, number]>>;
IsTrue<Equals<[boolean]>>; // single element is trivially equal

// Mixed types should not all be equal
IsFalse<Equals<[string, number, string]>>;
IsFalse<Equals<[string, number]>>;

// Empty tuple should be vacuously equal
IsTrue<Equals<[]>>;

// Complex type equality in tuples
type ComplexType = { x: string; y: number };
IsTrue<Equals<[ComplexType, ComplexType, ComplexType]>>;
IsFalse<Equals<[ComplexType, User, ComplexType]>>;

// === Tuple Non-Equality Tests with NotEquals ===

// Mixed types should satisfy NotEquals
IsTrue<NotEquals<[string, number, boolean]>>;
IsTrue<NotEquals<[string, number]>>;

// All same types should NOT satisfy NotEquals
IsFalse<NotEquals<[string, string, string]>>;
IsFalse<NotEquals<[number, number]>>;

// Single element should satisfy NotEquals (vacuously true - nothing to compare against)
IsTrue<NotEquals<[string]>>;

// Empty tuple should satisfy NotEquals (vacuously true - no elements to compare)
IsTrue<NotEquals<[]>>;

// === Complex Edge Cases ===

// Conditional types equality
type IsString<T> = T extends string ? true : false;
IsTrue<Equal<IsString<string>, true>>;
IsTrue<Equal<IsString<number>, false>>;
IsFalse<Equal<IsString<string>, false>>;

// Mapped types equality
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type ReadonlyUser = Readonly<User>;
type ManualReadonlyUser = { readonly name: string; readonly age: number };

IsTrue<Equal<ReadonlyUser, ManualReadonlyUser>>;

// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;
IsTrue<Equal<ToArray<string | number>, string[] | number[]>>;

// Index access types
type UserName = User["name"];
IsTrue<Equal<UserName, string>>;
IsFalse<Equal<UserName, number>>;

// keyof equality
IsTrue<Equal<keyof User, "name" | "age">>;
IsTrue<Equal<keyof User, "age" | "name">>; // order doesn't matter in unions

// === Recursive and Self-Referencing Types ===

type LinkedList<T> = {
	value: T;
	next: LinkedList<T> | null;
};

type SameLinkedList<T> = {
	value: T;
	next: SameLinkedList<T> | null;
};

IsTrue<Equal<LinkedList<string>, SameLinkedList<string>>>;
IsFalse<Equal<LinkedList<string>, LinkedList<number>>>;

// === Branded Types ===

type Brand<T, B> = T & { __brand: B };
type UserId = Brand<number, "UserId">;
type ProductId = Brand<number, "ProductId">;

IsFalse<Equal<UserId, ProductId>>;
IsFalse<Equal<UserId, number>>;
IsTrue<Equal<UserId, Brand<number, "UserId">>>;
