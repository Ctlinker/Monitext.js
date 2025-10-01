import {
	AllFails,
	AllPass,
	Assert,
	CheckAssertions,
	SomeFail,
	SomePass,
	TypeAssert,
	Typsert,
} from "../../src/main";
import { IsFalse, IsTrue } from "../TEST-UTILS";

// === Basic Assert Tests ===

// All assertions pass should return true
IsTrue<
	Assert<
		[
			["test passes", true],
			["another test passes", true],
			["third test passes", true],
		]
	>
>;

// Single passing assertion should return true
IsTrue<Assert<[["single test", true]]>>;

// Empty assertions tuple should return true (vacuously)
IsTrue<Assert<[]>>;

// Mixed assertions with failures should return union of failure messages
type MixedAssertResult = Assert<
	[
		["this passes", true],
		["this fails", false],
		["this also passes", true],
		["this also fails", false],
	]
>;

// Should be a union containing the failure messages
type ExpectedFailures =
	| "Assertion failed: this fails"
	| "Assertion failed: this also fails";

// We can't directly test union equality with Equal, but we can test assignability
IsTrue<MixedAssertResult extends ExpectedFailures ? true : false>;
IsTrue<ExpectedFailures extends MixedAssertResult ? true : false>;

// Single failing assertion should return failure message
type SingleFailResult = Assert<[["single failure", false]]>;
IsTrue<
	SingleFailResult extends "Assertion failed: single failure" ? true : false
>;

// All assertions fail should return union of all failure messages
type AllFailResult = Assert<[["first fail", false], ["second fail", false]]>;
IsTrue<
	AllFailResult extends
		| "Assertion failed: first fail"
		| "Assertion failed: second fail" ? true
		: false
>;

// === AllPass Tests ===

// All true should pass
IsTrue<AllPass<[true, true, true]>>;
IsTrue<AllPass<[true]>>;
IsTrue<AllPass<[]>>; // empty tuple should pass

// Any false should return the original tuple (not pass)
type MixedPass1 = AllPass<[true, false, true]>;
IsTrue<MixedPass1 extends [true, false, true] ? true : false>;

type SingleFalse = AllPass<[false]>;
IsTrue<SingleFalse extends [false] ? true : false>;

type AllFalsePass = AllPass<[false, false, false]>;
IsTrue<AllFalsePass extends [false, false, false] ? true : false>;

// Mixed with false should return the original tuple (showing failures)
type MixedAllPass = AllPass<[true, false, true, false]>;
IsTrue<MixedAllPass extends [true, false, true, false] ? true : false>;

// === AllFails Tests ===

// All false should pass
IsTrue<AllFails<[false, false, false]>>;
IsTrue<AllFails<[false]>>;
IsTrue<AllFails<[]>>; // empty tuple should pass

// Any true should return a mapped type (not pass AllFails)
type MixedAllFails = AllFails<[false, true, false]>;
// Should return a mapped type showing which ones are actually false
type ExpectedMixedResult = {
	[K in keyof [false, true, false]]: [false, true, false][K] extends false
		? true
		: false;
};
// We can't easily test exact equality of this mapped type, so let's test a property
type MixedResult0 = MixedAllFails[0]; // should be true (false extends false ? true : false)
type MixedResult1 = MixedAllFails[1]; // should be false (true extends false ? true : false)
IsTrue<MixedResult0 extends true ? true : false>;
IsTrue<MixedResult1 extends false ? true : false>;

// All true should return a mapped type (not pass AllFails)
type AllTrueFails = AllFails<[true, true, true]>;
type AllTrueResult0 = AllTrueFails[0]; // should be false (true extends false ? true : false)
IsTrue<AllTrueResult0 extends false ? true : false>;

// === SomePass Tests ===

// At least one true should pass
IsTrue<SomePass<[true, false, false]>>;
IsTrue<SomePass<[false, true, false]>>;
IsTrue<SomePass<[false, false, true]>>;
IsTrue<SomePass<[true, true, true]>>;
IsTrue<SomePass<[true]>>;

// All false should not pass
IsFalse<SomePass<[false, false, false]>>;
IsFalse<SomePass<[false]>>;

// Empty tuple should not pass (no elements to pass)
IsFalse<SomePass<[]>>;

// === SomeFail Tests ===

// At least one false should pass
IsTrue<SomeFail<[false, true, true]>>;
IsTrue<SomeFail<[true, false, true]>>;
IsTrue<SomeFail<[true, true, false]>>;
IsTrue<SomeFail<[false, false, false]>>;
IsTrue<SomeFail<[false]>>;

// All true should not pass
IsFalse<SomeFail<[true, true, true]>>;
IsFalse<SomeFail<[true]>>;

// Empty tuple should not pass (no elements to fail)
IsFalse<SomeFail<[]>>;

// === CheckAssertions Tests ===

// All passing assertions should have "pass" status
type AllPassResult = CheckAssertions<[["test one", true], ["test two", true]]>;

type ExpectedAllPass = [
	{ status: "pass"; label: "test one"; output: true },
	{ status: "pass"; label: "test two"; output: true },
];

// We test the structure by checking individual properties
IsTrue<
	AllPassResult[0] extends { status: "pass"; label: "test one"; output: true }
		? true
		: false
>;
IsTrue<
	AllPassResult[1] extends { status: "pass"; label: "test two"; output: true }
		? true
		: false
>;

// Mixed results should have appropriate status
type MixedResult = CheckAssertions<
	[["passing test", true], ["failing test", false]]
>;

IsTrue<
	MixedResult[0] extends
		{ status: "pass"; label: "passing test"; output: true } ? true
		: false
>;
IsTrue<
	MixedResult[1] extends {
		status: "fail";
		label: "failing test";
		output: false;
	} ? true
		: false
>;

// Single assertion results
type SinglePass = CheckAssertions<[["single", true]]>;
IsTrue<
	SinglePass[0] extends { status: "pass"; label: "single"; output: true }
		? true
		: false
>;

type SingleFail = CheckAssertions<[["single", false]]>;
IsTrue<
	SingleFail[0] extends { status: "fail"; label: "single"; output: false }
		? true
		: false
>;

// === Complex Assertion Patterns ===

// Combining different assertion types
type ComplexAssertions = [
	["string equality", true],
	["number inequality", false],
	["array assignability", true],
	["function compatibility", false],
];

// Test that Assert correctly handles this
type ComplexResult = Assert<ComplexAssertions>;
IsTrue<
	ComplexResult extends
		| "Assertion failed: number inequality"
		| "Assertion failed: function compatibility" ? true
		: false
>;

// Test CheckAssertions with the same
type ComplexChecked = CheckAssertions<ComplexAssertions>;
IsTrue<
	ComplexChecked[0] extends {
		status: "pass";
		label: "string equality";
		output: true;
	} ? true
		: false
>;
IsTrue<
	ComplexChecked[1] extends {
		status: "fail";
		label: "number inequality";
		output: false;
	} ? true
		: false
>;
IsTrue<
	ComplexChecked[2] extends {
		status: "pass";
		label: "array assignability";
		output: true;
	} ? true
		: false
>;
IsTrue<
	ComplexChecked[3] extends {
		status: "fail";
		label: "function compatibility";
		output: false;
	} ? true
		: false
>;

// === Integration with Other Type Utilities ===

import { Assignable, Equal } from "../../src/main";

// Using Assert with other type utilities
type IntegrationTest = Assert<
	[
		["strings are equal", Equal<string, string>],
		["number assignable to any", Assignable<number, any>],
		["literal assignable to base", Assignable<"hello", string>],
		["base not equal to literal", Equal<string, "hello">], // This should fail
	]
>;

// Should contain the failure message for the last assertion
IsTrue<
	IntegrationTest extends "Assertion failed: base not equal to literal" ? true
		: false
>;

// === Edge Cases and Error Conditions ===

// Very long label names
type LongLabelTest = Assert<
	[
		[
			"this is a very long assertion label that tests how the system handles lengthy descriptions",
			true,
		],
		["short", false],
	]
>;
IsTrue<LongLabelTest extends "Assertion failed: short" ? true : false>;

// Special characters in labels
type SpecialCharTest = Assert<
	[
		["test with symbols: !@#$%^&*()", true],
		["test with 'quotes' and \"double quotes\"", true],
		["test with numbers 123 and spaces", false],
	]
>;
IsTrue<
	SpecialCharTest extends "Assertion failed: test with numbers 123 and spaces"
		? true
		: false
>;

// === Testing TypeAssert and Typsert Function Signatures ===

// These are runtime no-op functions, but we can test their type signatures
// TypeAssert should only accept tuples where all assertions pass
declare const allPassingAssertions: [["test1", true], ["test2", true]];
declare const someFailingAssertions: [["test1", true], ["test2", false]];

// This should compile (all assertions pass)
TypeAssert<typeof allPassingAssertions>(true);

// This should show the rich assertion results in IDE tooltips
declare const complexAssertions: [
	["type equality", true],
	["assignability", false],
	["complex check", true],
];

// The parameter should be false since not all assertions pass
TypeAssert<typeof complexAssertions>(false);

// Typsert should be an alias for TypeAssert
Typsert<typeof allPassingAssertions>(true);
Typsert<typeof complexAssertions>(false);

// === Performance and Scalability Tests ===

// Test with many assertions
type ManyAssertions = Assert<
	[
		["test1", true],
		["test2", true],
		["test3", true],
		["test4", true],
		["test5", true],
		["test6", true],
		["test7", true],
		["test8", true],
		["test9", true],
		["test10", true],
		["test11", false], // One failure
		["test12", true],
		["test13", true],
		["test14", true],
		["test15", true],
	]
>;

IsTrue<ManyAssertions extends "Assertion failed: test11" ? true : false>;

// Test AllPass with many items
IsTrue<AllPass<[true, true, true, true, true, true, true, true, true, true]>>;
// Mixed should return the original array
type ManyMixedPass = AllPass<
	[true, true, true, true, true, false, true, true, true, true]
>;
IsTrue<
	ManyMixedPass extends [
		true,
		true,
		true,
		true,
		true,
		false,
		true,
		true,
		true,
		true,
	] ? true
		: false
>;

// Test SomePass with many items
IsTrue<
	SomePass<
		[false, false, false, false, false, true, false, false, false, false]
	>
>;
IsFalse<
	SomePass<
		[false, false, false, false, false, false, false, false, false, false]
	>
>;
