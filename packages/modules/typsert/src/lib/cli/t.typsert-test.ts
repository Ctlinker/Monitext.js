// tests/example.typsert-test.ts
import { TypeAssert } from "../main";

type Assignable<A, B> = [A] extends [B] ? true : false;
type NotAssignable<A, B> = [A] extends [B] ? false : true;

// This should succeed
TypeAssert<"U assignable to T", [
  Assignable<string, string | number>
]>();

// This should fail
TypeAssert<"string not assignable to number", [
  Assignable<string, number>
]>();

// Multiple cases
TypeAssert<"mixed cases", [
  Assignable<string, string | number>,    // ✅
  NotAssignable<number, string>           // ✅
]>();

// Mixed with a failing case
TypeAssert<"mixed with failure", [
  Assignable<string, string | number>,    // ✅
  NotAssignable<string, string | number>  // ❌
]>();
