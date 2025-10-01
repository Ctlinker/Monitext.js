import {
	AllFails,
	AllPass,
	Assert,
	Assignable,
	Assignables,
	CheckAssertions,
	Equal,
	Equals,
	Not,
	NotAssignable,
	NotAssignables,
	NotEqual,
	NotEquals,
	SomeFail,
	SomePass,
	TypeAssert,
	Typsert,
} from "../../src/main";
import { IsFalse, IsTrue } from "../TEST-UTILS";

// === Complex Type Definitions for Testing ===

type User = {
	id: number;
	name: string;
	email: string;
	isActive: boolean;
};

type PartialUser = {
	name: string;
	email: string;
};

type AdminUser = User & {
	permissions: string[];
	lastLogin: Date;
};

type UserUpdate = {
	name?: string;
	email?: string;
	isActive?: boolean;
};

// === Integration Test 1: Combining Assignability and Equality ===

// Test that assignability and equality have different semantics
type AssignabilityVsEqualityTests = Assert<
	[
		["AdminUser assignable to User", Assignable<AdminUser, User>],
		["AdminUser not equal to User", NotEqual<AdminUser, User>],
		["User not assignable to AdminUser", NotAssignable<User, AdminUser>],
		["Literal assignable to base", Assignable<"hello", string>],
		["Literal not equal to base", NotEqual<"hello", string>],
		[
			"Same types are both assignable and equal",
			Equal<Assignable<User, User>, Equal<User, User>>,
		],
	]
>;

IsTrue<AssignabilityVsEqualityTests>;

// === Integration Test 2: Using Not with Other Utilities ===

type NegationIntegrationTests = Assert<
	[
		["Not of failed equality is true", Not<Equal<string, number>>],
		[
			"Not of successful assignability is false",
			Not<Assignable<User, User>>,
		],
		["Double negation works correctly", Equal<Not<Not<true>>, true>],
		[
			"Not inverts assignability correctly",
			Equal<
				Not<Assignable<string, number>>,
				NotAssignable<string, number>
			>,
		],
		["Complex negation chain", Not<Not<Not<Equal<never, never>>>>],
	]
>;

IsFalse<NegationIntegrationTests extends true ? true : false>; // Should fail on the last assertion

// === Integration Test 3: Array Operations with Multiple Utilities ===

type ArrayIntegrationTests = Assert<
	[
		[
			"All primitives assignable to any",
			Assignables<[string, number, boolean], any>,
		],
		["All numbers equal to themselves", Equals<[42, 42, 42]>],
		[
			"Mixed types not all assignable to string",
			Not<Assignables<[string, number, boolean], string>>,
		],
		["All different types not equal", NotEquals<[string, number, boolean]>],
		[
			"Some types pass assignability to union",
			SomePass<
				[
					Assignable<string, string | number>,
					Assignable<boolean, string | number>,
					Assignable<symbol, string | number>,
				]
			>,
		],
	]
>;

IsTrue<ArrayIntegrationTests>;

// === Integration Test 4: Complex Generic Type Checking ===

type GenericContainer<T> = {
	value: T;
	metadata: {
		type: string;
		created: Date;
	};
};

type StringContainer = GenericContainer<string>;
type NumberContainer = GenericContainer<number>;

type GenericIntegrationTests = Assert<
	[
		[
			"String container structure matches",
			Equal<StringContainer["value"], string>,
		],
		[
			"Different generic containers not equal",
			NotEqual<StringContainer, NumberContainer>,
		],
		[
			"Specific container assignable to any container",
			Assignable<StringContainer, GenericContainer<any>>,
		],
		[
			"Generic container with any is assignable to specific",
			Assignable<GenericContainer<any>, StringContainer>,
		],
		[
			"Metadata structures are equal",
			Equal<StringContainer["metadata"], NumberContainer["metadata"]>,
		],
	]
>;

IsTrue<GenericIntegrationTests>;

// === Integration Test 5: Function Type Compatibility Matrix ===

type StringToString = (x: string) => string;
type StringToNumber = (x: string) => number;
type NumberToString = (x: number) => string;
type AnyToAny = (x: any) => any;

type FunctionCompatibilityMatrix = Assert<
	[
		[
			"Same signatures are equal",
			Equal<StringToString, (x: string) => string>,
		],
		[
			"Different return types not assignable",
			NotAssignable<StringToString, StringToNumber>,
		],
		[
			"Different param types not assignable",
			NotAssignable<StringToString, NumberToString>,
		],
		["Specific assignable to any", Assignable<StringToString, AnyToAny>],
		["Any not equal to specific", NotEqual<AnyToAny, StringToString>],
		[
			"Function array equality check",
			Equals<[StringToString, StringToString, StringToString]>,
		],
	]
>;

IsTrue<FunctionCompatibilityMatrix>;

// === Integration Test 6: Union and Intersection Complexity ===

type A = { a: string };
type B = { b: number };
type C = { c: boolean };

type UnionIntersectionTests = Assert<
	[
		[
			"Union members assignable to union",
			AllPass<
				[
					Assignable<A, A | B | C>,
					Assignable<B, A | B | C>,
					Assignable<C, A | B | C>,
				]
			>,
		],
		[
			"Union not assignable to members",
			AllPass<
				[
					NotAssignable<A | B | C, A>,
					NotAssignable<A | B | C, B>,
					NotAssignable<A | B | C, C>,
				]
			>,
		],
		[
			"Intersection assignable to all parts",
			AllPass<
				[
					Assignable<A & B & C, A>,
					Assignable<A & B & C, B>,
					Assignable<A & B & C, C>,
				]
			>,
		],
		[
			"Parts not assignable to intersection",
			AllPass<
				[
					NotAssignable<A, A & B & C>,
					NotAssignable<B, A & B & C>,
					NotAssignable<C, A & B & C>,
				]
			>,
		],
		["Union and intersection are different", NotEqual<A | B, A & B>],
	]
>;

IsTrue<UnionIntersectionTests>;

// === Integration Test 7: Conditional Type Interaction ===

type IsStringLike<T> = T extends string | String ? true : false;
type IsNumberLike<T> = T extends number | Number ? true : false;
type IsNullish<T> = T extends null | undefined ? true : false;

type ConditionalTypeTests = Assert<
	[
		["String passes string-like test", IsStringLike<string>],
		["Number fails string-like test", Not<IsStringLike<number>>],
		["Literal string passes string-like", IsStringLike<"hello">],
		["String object passes string-like", IsStringLike<String>],
		[
			"Multiple conditions work",
			AllPass<
				[
					IsStringLike<string>,
					IsNumberLike<number>,
					Not<IsNullish<string>>,
				]
			>,
		],
		[
			"Conditional results are proper booleans",
			AllPass<
				[
					Equal<IsStringLike<string>, true>,
					Equal<IsStringLike<number>, false>,
					Equal<IsNumberLike<42>, true>,
				]
			>,
		],
	]
>;

IsTrue<ConditionalTypeTests>;

// === Integration Test 8: Mapped Type Transformations ===

type MakeOptional<T> = { [K in keyof T]?: T[K] };
type MakeReadonly<T> = { readonly [K in keyof T]: T[K] };
type MakeRequired<T> = { [K in keyof T]-?: T[K] };

type MappedTypeTests = Assert<
	[
		[
			"Optional transformation changes structure",
			NotEqual<User, MakeOptional<User>>,
		],
		[
			"Readonly transformation changes structure",
			NotEqual<User, MakeReadonly<User>>,
		],
		[
			"Required on already required is same",
			Equal<User, MakeRequired<User>>,
		],
		[
			"Optional properties work correctly",
			NotEqual<MakeOptional<User>, User>,
		],
		[
			"Readonly properties maintain value types",
			Equal<MakeReadonly<User>["name"], string>,
		],
		[
			"Chained transformations work",
			NotEqual<User, MakeOptional<MakeReadonly<User>>>,
		],
	]
>;

IsTrue<MappedTypeTests>;

// === Integration Test 9: Recursive and Self-Referencing Types ===

type TreeNode<T> = {
	value: T;
	children: TreeNode<T>[];
	parent?: TreeNode<T>;
};

type LinkedListNode<T> = {
	data: T;
	next: LinkedListNode<T> | null;
};

type RecursiveTypeTests = Assert<
	[
		[
			"Tree nodes with same type are equal",
			Equal<TreeNode<string>, TreeNode<string>>,
		],
		[
			"Tree nodes with different types not equal",
			NotEqual<TreeNode<string>, TreeNode<number>>,
		],
		[
			"Linked list nodes structure consistent",
			Equal<
				LinkedListNode<number>["next"],
				LinkedListNode<number> | null
			>,
		],
		[
			"Self-referencing maintains type safety",
			Assignable<TreeNode<string>["children"][0], TreeNode<string>>,
		],
		[
			"Optional parent is assignable",
			Assignable<
				TreeNode<string>["parent"],
				TreeNode<string> | undefined
			>,
		],
	]
>;

IsTrue<RecursiveTypeTests>;

// === Integration Test 10: Real-World API Response Validation ===

type ApiResponse<T> = {
	data: T;
	status: "success" | "error";
	message?: string;
	timestamp: number;
};

type UserApiResponse = ApiResponse<User>;
type UsersApiResponse = ApiResponse<User[]>;

type ApiIntegrationTests = Assert<
	[
		[
			"User response has correct data type",
			Equal<UserApiResponse["data"], User>,
		],
		[
			"Users response has array data type",
			Equal<UsersApiResponse["data"], User[]>,
		],
		[
			"Status is union type",
			Assignable<UserApiResponse["status"], "success" | "error">,
		],
		[
			"Different API responses not equal",
			NotEqual<UserApiResponse, UsersApiResponse>,
		],
		[
			"Both responses have same base structure",
			AllPass<
				[
					Assignable<
						UserApiResponse["status"],
						UsersApiResponse["status"]
					>,
					Equal<
						UserApiResponse["timestamp"],
						UsersApiResponse["timestamp"]
					>,
					Equal<
						UserApiResponse["message"],
						UsersApiResponse["message"]
					>,
				]
			>,
		],
		[
			"Message is optional in both",
			AllPass<
				[
					Equal<UserApiResponse["message"], string | undefined>,
					Equal<UsersApiResponse["message"], string | undefined>,
				]
			>,
		],
	]
>;

IsTrue<ApiIntegrationTests>;

// === Integration Test 11: Database Entity Relationships ===

type BaseEntity = {
	id: string;
	createdAt: Date;
	updatedAt: Date;
};

type Post = BaseEntity & {
	title: string;
	content: string;
	authorId: User["id"];
	published: boolean;
};

type Comment = BaseEntity & {
	postId: Post["id"];
	authorId: User["id"];
	content: string;
};

type DatabaseEntityTests = Assert<
	[
		["Post extends base entity", Assignable<Post, BaseEntity>],
		["Comment extends base entity", Assignable<Comment, BaseEntity>],
		[
			"Post and Comment share base properties",
			AllPass<
				[
					Equal<Post["id"], Comment["id"]>,
					Equal<Post["createdAt"], Comment["createdAt"]>,
					Equal<Post["updatedAt"], Comment["updatedAt"]>,
				]
			>,
		],
		[
			"Foreign keys have correct types",
			AllPass<
				[
					Equal<Post["authorId"], User["id"]>,
					Equal<Comment["authorId"], User["id"]>,
					Equal<Comment["postId"], Post["id"]>,
				]
			>,
		],
		["Post has title property", Equal<Post["title"], string>],
	]
>;

IsTrue<DatabaseEntityTests>;

// === Integration Test 12: Event System Type Safety ===

type BaseEvent = {
	type: string;
	timestamp: number;
};

type UserCreatedEvent = BaseEvent & {
	type: "USER_CREATED";
	payload: { user: User };
};

type UserUpdatedEvent = BaseEvent & {
	type: "USER_UPDATED";
	payload: { user: User; changes: UserUpdate };
};

type UserDeletedEvent = BaseEvent & {
	type: "USER_DELETED";
	payload: { userId: string };
};

type UserEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent;

type EventSystemTests = Assert<
	[
		[
			"All user events extend base event",
			AllPass<
				[
					Assignable<UserCreatedEvent, BaseEvent>,
					Assignable<UserUpdatedEvent, BaseEvent>,
					Assignable<UserDeletedEvent, BaseEvent>,
				]
			>,
		],
		[
			"Event types are literal strings",
			AllPass<
				[
					Equal<UserCreatedEvent["type"], "USER_CREATED">,
					Equal<UserUpdatedEvent["type"], "USER_UPDATED">,
					Equal<UserDeletedEvent["type"], "USER_DELETED">,
				]
			>,
		],
		[
			"Each specific event assignable to union",
			AllPass<
				[
					Assignable<UserCreatedEvent, UserEvent>,
					Assignable<UserUpdatedEvent, UserEvent>,
					Assignable<UserDeletedEvent, UserEvent>,
				]
			>,
		],
		[
			"Union not assignable to specific events",
			AllPass<
				[
					NotAssignable<UserEvent, UserCreatedEvent>,
					NotAssignable<UserEvent, UserUpdatedEvent>,
					NotAssignable<UserEvent, UserDeletedEvent>,
				]
			>,
		],
		[
			"Payloads have different structures",
			AllFails<
				[
					Equal<
						UserCreatedEvent["payload"],
						UserUpdatedEvent["payload"]
					>,
					Equal<
						UserUpdatedEvent["payload"],
						UserDeletedEvent["payload"]
					>,
					Equal<
						UserCreatedEvent["payload"],
						UserDeletedEvent["payload"]
					>,
				]
			>,
		],
	]
>;

IsTrue<EventSystemTests>;

// === Integration Test 13: Advanced Utility Type Composition ===

// Utility to extract all possible property value types
type ValueOf<T> = T[keyof T];

// Utility to make properties with specific value type optional
type MakeOptionalByValue<T, V> = {
	[K in keyof T]: T[K] extends V ? T[K] | undefined : T[K];
};

// Utility to pick properties that extend a specific type
type PickByValue<T, V> = Pick<
	T,
	{
		[K in keyof T]: T[K] extends V ? K : never;
	}[keyof T]
>;

type AdvancedUtilityTests = Assert<
	[
		[
			"ValueOf extracts all property types",
			Equal<ValueOf<User>, number | string | boolean>,
		],
		[
			"PickByValue selects string properties",
			Equal<PickByValue<User, string>, { name: string; email: string }>,
		],
		[
			"PickByValue selects number properties",
			Equal<PickByValue<User, number>, { id: number }>,
		],
		[
			"MakeOptionalByValue works with value types",
			Equal<
				MakeOptionalByValue<User, string>["name"],
				string | undefined
			>,
		],
		[
			"PickByValue works correctly",
			Equal<keyof PickByValue<User, string>, "name" | "email">,
		],
		[
			"Complex type manipulation preserves intent",
			Assignable<PickByValue<User, string>["name"], string>,
		],
	]
>;

IsTrue<AdvancedUtilityTests>;

// === Integration Test 14: Performance and Scalability ===

type LargeUnion =
	| string
	| number
	| boolean
	| null
	| undefined
	| symbol
	| bigint
	| object
	| Function
	| Date
	| RegExp
	| Error;

type ScalabilityTests = Assert<
	[
		[
			"Large union operations work",
			AllPass<
				[
					Assignable<string, LargeUnion>,
					Assignable<number, LargeUnion>,
					Assignable<Date, LargeUnion>,
				]
			>,
		],
		[
			"Complex nested operations",
			AllPass<
				[
					Not<Equal<LargeUnion, string>>,
					SomePass<
						[
							Assignable<string, LargeUnion>,
							Assignable<LargeUnion, string>,
							Equal<LargeUnion, string>,
						]
					>,
					Not<
						AllPass<
							[
								Equal<string, LargeUnion>,
								Equal<number, LargeUnion>,
								Equal<boolean, LargeUnion>,
							]
						>
					>,
				]
			>,
		],
		[
			"Many assertions can be processed",
			AllPass<
				[
					Equal<string, string>,
					Equal<number, number>,
					Equal<boolean, boolean>,
					Equal<null, null>,
					Equal<undefined, undefined>,
					Assignable<string, any>,
					Assignable<number, any>,
					Not<Equal<string, number>>,
					Not<Equal<boolean, string>>,
					SomePass<[true, false, true]>,
				]
			>,
		],
	]
>;

IsTrue<ScalabilityTests>;

// === Integration Test 15: Comprehensive Final Test ===

// This test combines everything to ensure all utilities work together harmoniously
type ComprehensiveIntegrationTest = Assert<
	[
		["Basic equality works", Equal<string, string>],
		["Basic assignability works", Assignable<"hello", string>],
		["Negation works", Not<Equal<string, number>>],
		["Array operations work", Assignables<[string, string], string>],
		["Complex object relationships", Assignable<AdminUser, User>],
		[
			"Union type handling",
			SomePass<
				[
					Assignable<string, string | number>,
					Equal<string, string | number>,
					NotEqual<string, number>,
				]
			>,
		],
		[
			"Function type compatibility",
			NotEqual<(x: string) => string, (x: number) => number>,
		],
		[
			"Generic type operations",
			Equal<GenericContainer<string>["value"], string>,
		],
		[
			"Conditional type evaluation",
			Equal<string extends string ? true : false, true>,
		],
		["Mapped type transformations", NotEqual<User, MakeOptional<User>>],
		[
			"All utilities integrate properly",
			AllPass<
				[true, Not<false>, Equal<true, true>, Assignable<true, boolean>]
			>,
		],
	]
>;

// This should compile and show comprehensive results in IDE tooltips
IsTrue<ComprehensiveIntegrationTest>;

// === Type-Level Documentation Tests ===

// Verify that the type system itself behaves as documented
type DocumentationTests = Assert<
	[
		[
			"Assignability is not equality",
			NotEqual<Assignable<"hello", string>, Equal<"hello", string>>,
		],
		[
			"Not inverts boolean results",
			AllPass<
				[
					Equal<Not<true>, false>,
					Equal<Not<false>, true>,
					Not<Equal<Not<true>, true>>,
				]
			>,
		],
		[
			"Assert returns true for all passing",
			Equal<Assert<[["test", true], ["another", true]]>, true>,
		],
		[
			"TypeAssert requires correct parameter",
			Equal<Parameters<typeof TypeAssert<[["test", true]]>>[0], true>,
		],
	]
>;

IsTrue<DocumentationTests>;
