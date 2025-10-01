import {
    Assignable,
    Assignables,
    NotAssignable,
    NotAssignables,
} from "../../src/main";
import { IsFalse, IsTrue } from "../TEST-UTILS";

// === Basic Assignable Tests ===

// Same types should be assignable
IsTrue<Assignable<string, string>>;
IsTrue<Assignable<number, number>>;
IsTrue<Assignable<boolean, boolean>>;
IsTrue<Assignable<null, null>>;
IsTrue<Assignable<undefined, undefined>>;

// Literal types should be assignable to their base types
IsTrue<Assignable<"hello", string>>;
IsTrue<Assignable<42, number>>;
IsTrue<Assignable<true, boolean>>;
IsTrue<Assignable<false, boolean>>;

// Types should be assignable to unions containing them
IsTrue<Assignable<string, string | number>>;
IsTrue<Assignable<number, string | number>>;
IsTrue<Assignable<boolean, string | number | boolean>>;

// never should be assignable to anything
IsTrue<Assignable<never, string>>;
IsTrue<Assignable<never, number>>;
IsTrue<Assignable<never, any>>;

// Nothing should be assignable to never (except never itself)
IsFalse<Assignable<string, never>>;
IsFalse<Assignable<number, never>>;
IsFalse<Assignable<any, never>>;
IsTrue<Assignable<never, never>>;

// any should be assignable to anything and anything to any
IsTrue<Assignable<any, string>>;
IsTrue<Assignable<string, any>>;
IsTrue<Assignable<any, any>>;

// === Basic NotAssignable Tests ===

// Different primitive types should not be assignable
IsTrue<NotAssignable<string, number>>;
IsTrue<NotAssignable<number, string>>;
IsTrue<NotAssignable<boolean, string>>;
IsTrue<NotAssignable<string, boolean>>;

// Base types should not be assignable to literal types
IsTrue<NotAssignable<string, "hello">>;
IsTrue<NotAssignable<number, 42>>;
IsTrue<NotAssignable<boolean, true>>;

// Types not in unions should not be assignable
IsTrue<NotAssignable<symbol, string | number>>;
IsTrue<NotAssignable<bigint, string | number | boolean>>;

// Same types should NOT be in NotAssignable (double negative)
IsFalse<NotAssignable<string, string>>;
IsFalse<NotAssignable<number, number>>;

// === Object and Array Assignability ===

type User = { name: string; age: number };
type PartialUser = { name: string };
type ExtendedUser = { name: string; age: number; email: string };

// More specific objects should be assignable to less specific
IsTrue<Assignable<ExtendedUser, User>>;
IsTrue<Assignable<User, PartialUser>>;

// Less specific should not be assignable to more specific
IsTrue<NotAssignable<User, ExtendedUser>>;
IsTrue<NotAssignable<PartialUser, User>>;

// Array assignability
IsTrue<Assignable<string[], (string | number)[]>>;
IsTrue<Assignable<readonly string[], readonly (string | number)[]>>;
IsTrue<NotAssignable<(string | number)[], string[]>>;

// === Function Assignability ===

type StringFn = (x: string) => string;
type NumberFn = (x: number) => number;
type AnyFn = (x: any) => any;

// Functions with compatible signatures
IsTrue<Assignable<StringFn, AnyFn>>;
IsTrue<Assignable<NumberFn, AnyFn>>;
IsTrue<NotAssignable<StringFn, NumberFn>>;
IsTrue<NotAssignable<NumberFn, StringFn>>;

// === Tuple Assignability Tests with Assignables ===

// All strings should be assignable to string
IsTrue<Assignables<["hello", "world", "test"], string>>;

// Mixed types should not all be assignable to string
IsFalse<Assignables<["hello", 42, true], string>>;

// All numbers should be assignable to number
IsTrue<Assignables<[1, 2, 3, 42], number>>;

// All types should be assignable to any
IsTrue<Assignables<[string, number, boolean, object], any>>;

// Empty tuple should vacuously be assignable (all elements assignable)
IsTrue<Assignables<[], string>>;

// All elements should be assignable to union
IsTrue<Assignables<["hello", 42, true], string | number | boolean>>;

// === Tuple Non-Assignability Tests with NotAssignables ===

// All numbers should not be assignable to string
IsTrue<NotAssignables<[1, 2, 3], string>>;

// Mixed types where some are assignable should fail NotAssignables
IsFalse<NotAssignables<["hello", 42], string>>;

// All strings should not be assignable to number
IsTrue<NotAssignables<["hello", "world"], number>>;

// Empty tuple should vacuously satisfy NotAssignables
IsTrue<NotAssignables<[], string>>;

// None should be assignable to never
IsTrue<NotAssignables<[string, number, boolean], never>>;

// === Complex Generic Types ===

type Generic<T> = { value: T };
type ConcreteString = { value: string };
type ConcreteNumber = { value: number };

IsTrue<Assignable<ConcreteString, Generic<string>>>;
IsTrue<Assignable<ConcreteNumber, Generic<number>>>;
IsTrue<NotAssignable<ConcreteString, Generic<number>>>;
IsTrue<NotAssignable<ConcreteNumber, Generic<string>>>;

// === Union and Intersection Types ===

type A = { a: string };
type B = { b: number };
type AOrB = A | B;
type AAndB = A & B;

IsTrue<Assignable<A, AOrB>>;
IsTrue<Assignable<B, AOrB>>;
IsTrue<Assignable<AAndB, A>>;
IsTrue<Assignable<AAndB, B>>;
IsTrue<NotAssignable<AOrB, A>>;
IsTrue<NotAssignable<AOrB, B>>;

// === Edge Cases ===

// Optional properties
type Optional = { x?: string };
type Required = { x: string };

IsTrue<Assignable<Required, Optional>>;
IsTrue<NotAssignable<Optional, Required>>;

// Index signatures
type StringRecord = Record<string, string>;
type NumberRecord = Record<string, number>;

IsTrue<Assignable<{ a: "hello"; b: "world" }, StringRecord>>;
IsTrue<NotAssignable<{ a: "hello"; b: 42 }, StringRecord>>;
IsTrue<NotAssignable<StringRecord, NumberRecord>>;

// === Conditional and Mapped Types ===

type IsString<T> = T extends string ? true : false;
type StringKeys<T> = {
    [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

IsTrue<Assignable<IsString<string>, true>>;
IsTrue<Assignable<IsString<number>, false>>;

type Example = { name: string; age: number; active: boolean };
IsTrue<Assignable<StringKeys<Example>, "name">>;
