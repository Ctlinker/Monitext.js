import { HandleOneOf, HandleSchema } from "../../src/main";

import {
	AllFails,
	AllPass,
	Assignable,
	Equal,
	Equals,
	NotAssignable,
	SomeFail,
	SomePass,
	TypeAssert,
} from "@monitext/typsert";

// =============================================================================
// BASIC ONEOF HANDLING
// =============================================================================

type T0 = {
	oneOf: [
		{ type: "string" },
		{ type: "number" },
		{ type: "boolean" },
		{ type: "null" },
	];
};

TypeAssert<[
	[
		"Basic oneOf schema should work correctly",
		AllPass<[
			// Core functionality - handlers should match
			Equals<[
				string | number | boolean | null,
				HandleSchema<T0>,
				HandleOneOf<T0>,
			]>,

			// Should accept all union member types
			Assignable<string, HandleOneOf<T0>>,
			Assignable<number, HandleOneOf<T0>>,
			Assignable<boolean, HandleOneOf<T0>>,
			Assignable<null, HandleOneOf<T0>>,

			// Schema and handler should be equivalent
			Equal<HandleOneOf<T0>, HandleSchema<T0>>,
		]>,
	],
	[
		"Basic oneOf should reject non-union types",
		AllFails<[
			// Types not in the union
			Assignable<undefined, HandleOneOf<T0>>,
			Assignable<{}, HandleOneOf<T0>>,
			Assignable<[], HandleOneOf<T0>>,
			Assignable<symbol, HandleOneOf<T0>>,
			Assignable<bigint, HandleOneOf<T0>>,
		]>,
	],
]>(true);

// =============================================================================
// ONEOF WITH OBJECT SCHEMAS
// =============================================================================

type T1 = {
	oneOf: [
		{
			type: "object";
			properties: {
				type: { enum: ["user"] };
				name: { type: "string" };
				email: { type: "string" };
			};
			required: ["type", "name"];
		},
		{
			type: "object";
			properties: {
				type: { enum: ["admin"] };
				name: { type: "string" };
				permissions: {
					type: "array";
					items: { type: "string" };
				};
			};
			required: ["type", "name", "permissions"];
		},
		{
			type: "object";
			properties: {
				type: { enum: ["guest"] };
				sessionId: { type: "string" };
			};
			required: ["type", "sessionId"];
		},
	];
};

TypeAssert<[
	[
		"OneOf with object schemas should handle discriminated unions",
		AllPass<[
			// User type
			Assignable<{
				type: "user";
				name: "John";
			}, HandleOneOf<T1>>,

			Assignable<{
				type: "user";
				name: "Jane";
				email: "jane@test.com";
			}, HandleOneOf<T1>>,

			// Admin type
			Assignable<{
				type: "admin";
				name: "Admin";
				permissions: ["read", "write"];
			}, HandleOneOf<T1>>,

			// Guest type
			Assignable<{
				type: "guest";
				sessionId: "abc123";
			}, HandleOneOf<T1>>,
		]>,
	],
	[
		"OneOf object schemas should enforce discriminator and requirements",
		AllFails<[
			// Missing required properties
			Assignable<{
				type: "user";
				// missing name
			}, HandleOneOf<T1>>,

			Assignable<{
				type: "admin";
				name: "Admin";
				// missing permissions
			}, HandleOneOf<T1>>,

			Assignable<{
				type: "guest";
				// missing sessionId
			}, HandleOneOf<T1>>,

			// Wrong discriminator values
			Assignable<{
				type: "invalid";
				name: "Test";
			}, HandleOneOf<T1>>,

			// Missing discriminator
			Assignable<{
				name: "No Type";
				email: "test@test.com";
			}, HandleOneOf<T1>>,
		]>,
	],
]>(true);

// =============================================================================
// ONEOF WITH MIXED TYPES
// =============================================================================

type T2 = {
	oneOf: [
		{ type: "string" },
		{ type: "number" },
		{
			type: "object";
			properties: {
				id: { type: "string" };
				value: { type: "number" };
			};
			required: ["id"];
		},
		{
			type: "array";
			items: { type: "string" };
		},
	];
};

TypeAssert<[
	[
		"OneOf with mixed types should handle diverse schemas",
		AllPass<[
			// Primitive types
			Assignable<"hello", HandleOneOf<T2>>,
			Assignable<42, HandleOneOf<T2>>,

			// Object type
			Assignable<{ id: "test" }, HandleOneOf<T2>>,
			Assignable<{ id: "example"; value: 100 }, HandleOneOf<T2>>,

			// Array type
			Assignable<[], HandleOneOf<T2>>,
			Assignable<["item1", "item2"], HandleOneOf<T2>>,
		]>,
	],
	[
		"Mixed oneOf should reject malformed variants",
		SomeFail<[
			// Wrong object structure
			Assignable<{ value: 100 }, HandleOneOf<T2>>, // missing required id
			Assignable<{ id: 123 }, HandleOneOf<T2>>, // id should be string

			// Wrong array element types
			Assignable<[1, 2, 3], HandleOneOf<T2>>, // should be string[]
			Assignable<["valid", 123], HandleOneOf<T2>>, // mixed types not allowed

			// Types not in the union
			Assignable<true, HandleOneOf<T2>>, // boolean not in union
			Assignable<null, HandleOneOf<T2>>, // null not in union
		]>,
	],
]>(true);

// =============================================================================
// NESTED ONEOF SCENARIOS
// =============================================================================

type T3 = {
	oneOf: [
		{
			type: "object";
			properties: {
				kind: { enum: ["simple"] };
				data: { type: "string" };
			};
			required: ["kind", "data"];
		},
		{
			type: "object";
			properties: {
				kind: { enum: ["complex"] };
				data: {
					oneOf: [
						{ type: "number" },
						{
							type: "object";
							properties: {
								nested: { type: "boolean" };
							};
						},
					];
				};
			};
			required: ["kind", "data"];
		},
	];
};

type V3 = HandleOneOf<T3>;

TypeAssert<[
	[
		"Nested oneOf should handle complex recursive structures",
		AllPass<[
			// Simple variant
			Assignable<{
				kind: "simple";
				data: "hello";
			}, HandleOneOf<T3>>,

			// Complex variant with number data
			Assignable<{
				kind: "complex";
				data: 42;
			}, HandleOneOf<T3>>,

			// Complex variant with object data
			Assignable<{
				kind: "complex";
				data: { nested: true };
			}, HandleOneOf<T3>>,
		]>,
	],
	[
		"Nested oneOf should enforce nested constraints",
		AllFails<[
			// Wrong simple data type
			Assignable<{
				kind: "simple";
				data: 123; // should be string
			}, HandleOneOf<T3>>,

			// Wrong complex data type
			Assignable<{
				kind: "complex";
				data: "invalid"; // should be number or object
			}, HandleOneOf<T3>>,

			// Wrong nested object structure
			Assignable<{
				kind: "complex";
				data: { wrong: true }; // should have 'nested' property
			}, HandleOneOf<T3>>,
		]>,
	],
]>(true);

// =============================================================================
// ONEOF WITH ENUMS AND LITERALS
// =============================================================================

type T4 = {
	oneOf: [
		{ enum: ["red", "green", "blue"] },
		{ enum: [1, 2, 3] },
		{ enum: [true] },
		{ type: "null" },
	];
};

type V4 = HandleOneOf<T4>;

TypeAssert<[
	[
		"OneOf with enums should handle literal unions correctly",
		AllPass<[
			// String enum values
			Assignable<"red", HandleOneOf<T4>>,
			Assignable<"green", HandleOneOf<T4>>,
			Assignable<"blue", HandleOneOf<T4>>,

			// Number enum values
			Assignable<1, HandleOneOf<T4>>,
			Assignable<2, HandleOneOf<T4>>,
			Assignable<3, HandleOneOf<T4>>,

			// Boolean literal
			Assignable<true, HandleOneOf<T4>>,

			// Null type
			Assignable<null, HandleOneOf<T4>>,
		]>,
	],
	[
		"Enum oneOf should reject non-enum values",
		AllFails<[
			// Values not in string enum
			Assignable<"yellow", HandleOneOf<T4>>,
			Assignable<"RED", HandleOneOf<T4>>, // case sensitive

			// Values not in number enum
			Assignable<0, HandleOneOf<T4>>,
			Assignable<4, HandleOneOf<T4>>,

			// Wrong boolean value
			Assignable<false, HandleOneOf<T4>>, // only true is allowed

			// Other types
			Assignable<undefined, HandleOneOf<T4>>,
			Assignable<{}, HandleOneOf<T4>>,
		]>,
	],
]>(true);

// =============================================================================
// EDGE CASES AND ERROR CONDITIONS
// =============================================================================

type T5 = {
	oneOf: [
		{ type: "string" },
	];
};

type T6 = {
	oneOf: [];
};

TypeAssert<[
	[
		"Edge case oneOf schemas should work correctly",
		AllPass<[
			// Single option oneOf should work like the single type
			Equal<HandleOneOf<T5>, string>,
			Assignable<"test", HandleOneOf<T5>>,
			Assignable<string, HandleOneOf<T5>>,
		]>,
	],
	[
		"Single option oneOf should reject other types",
		AllFails<[
			Assignable<123, HandleOneOf<T5>>,
			Assignable<true, HandleOneOf<T5>>,
			Assignable<null, HandleOneOf<T5>>,
		]>,
	],
	[
		"Empty oneOf should result in never type",
		AllPass<[
			// Empty oneOf should be never
			Equal<HandleOneOf<T6>, never>,

			// Never should not be assignable from anything
			NotAssignable<any, HandleOneOf<T6>>,
			NotAssignable<unknown, HandleOneOf<T6>>,
			NotAssignable<string, HandleOneOf<T6>>,
		]>,
	],
]>(true);

// =============================================================================
// ONEOF TYPE VARIANCE TESTING
// =============================================================================

type SimpleOneOf = {
	oneOf: [
		{ type: "string" },
		{ type: "number" },
	];
};

type ExtendedOneOf = {
	oneOf: [
		{ type: "string" },
		{ type: "number" },
		{ type: "boolean" },
	];
};

type OverlapOneOf = {
	oneOf: [
		{ type: "number" },
		{ type: "boolean" },
		{ type: "null" },
	];
};

TypeAssert<[
	[
		"OneOf type variance should work correctly",
		AllPass<[
			// All should be assignable to unknown
			Assignable<HandleOneOf<SimpleOneOf>, unknown>,
			Assignable<HandleOneOf<ExtendedOneOf>, unknown>,
			Assignable<HandleOneOf<OverlapOneOf>, unknown>,

			// Specific values should work correctly
			Assignable<"test", HandleOneOf<SimpleOneOf>>,
			Assignable<42, HandleOneOf<SimpleOneOf>>,
			Assignable<true, HandleOneOf<ExtendedOneOf>>,
		]>,
	],
	[
		"Different oneOf schemas should maintain distinctions",
		SomePass<[
			// Some relationships should not hold due to different union members
			NotAssignable<boolean, HandleOneOf<SimpleOneOf>>, // SimpleOneOf doesn't include boolean
			Assignable<boolean, HandleOneOf<ExtendedOneOf>>, // ExtendedOneOf includes boolean
			NotAssignable<string, HandleOneOf<OverlapOneOf>>, // OverlapOneOf doesn't include string
		]>,
	],
]>(true);

// =============================================================================
// COMPREHENSIVE ONEOF HANDLER VALIDATION
// =============================================================================

TypeAssert<[
	[
		"All oneOf handlers maintain consistency",
		AllPass<[
			// HandleOneOf and HandleSchema should always match
			Equal<HandleOneOf<T0>, HandleSchema<T0>>,
			Equal<HandleOneOf<T1>, HandleSchema<T1>>,
			Equal<HandleOneOf<T2>, HandleSchema<T2>>,
			Equal<HandleOneOf<T3>, HandleSchema<T3>>,
			Equal<HandleOneOf<T4>, HandleSchema<T4>>,
			Equal<HandleOneOf<T5>, HandleSchema<T5>>,
		]>,
	],
	[
		"OneOf handlers provide meaningful type unions",
		SomePass<[
			// Different oneOf types should not all be assignable to each other
			NotAssignable<HandleOneOf<T0>, HandleOneOf<T1>>, // different union members
			NotAssignable<HandleOneOf<T1>, HandleOneOf<T2>>, // different structures
			NotAssignable<HandleOneOf<SimpleOneOf>, HandleOneOf<OverlapOneOf>>, // different unions
		]>,
	],
	[
		"All oneOf handlers produce valid union types",
		AllPass<[
			// All should be assignable to unknown (except never)
			Assignable<HandleOneOf<T0>, unknown>,
			Assignable<HandleOneOf<T1>, unknown>,
			Assignable<HandleOneOf<T2>, unknown>,
			Assignable<HandleOneOf<T3>, unknown>,
			Assignable<HandleOneOf<T4>, unknown>,
			Assignable<HandleOneOf<T5>, unknown>,
			// T6 is never, so it's not assignable to anything
		]>,
	],
]>(true);
