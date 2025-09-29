import { HandleArray, HandleSchema } from "../../src/main";

import {
	AllFails,
	AllPass,
	Assignable,
	Assignables,
	Equal,
	Equals,
	NotAssignable,
	NotAssignables,
	SomeFail,
	SomePass,
	TypeAssert,
} from "@monitext/typsert";

// =============================================================================
// BASIC TUPLE ARRAY HANDLING
// =============================================================================

type T0 = {
	type: "array";
	prefixItems: [
		{ type: "string" },
		{ type: "number" },
	];
};

TypeAssert<[
	[
		"Basic tuple array handling should work correctly",
		AllPass<[
			// Core functionality - handlers should match
			Equals<[[string, number], HandleArray<T0>, HandleSchema<T0>]>,

			// Should be assignable from valid tuples
			Assignable<[string, number], HandleArray<T0>>,
			Assignable<["hello", 42], HandleArray<T0>>,

			// Array and schema handlers should be equivalent
			Equal<HandleArray<T0>, HandleSchema<T0>>,
		]>,
	],
	[
		"Basic tuple should reject invalid structures",
		AllFails<[
			// Wrong types
			Assignable<[number, string], HandleArray<T0>>,
			Assignable<[boolean, number], HandleArray<T0>>,

			// Wrong length
			Assignable<[string], HandleArray<T0>>,
			Assignable<[string, number, boolean], HandleArray<T0>>,

			// Not array-like
			Assignable<string, HandleArray<T0>>,
			Assignable<{ 0: string; 1: number }, HandleArray<T0>>,
		]>,
	],
]>(true);

// =============================================================================
// ARRAYS WITH ADDITIONAL ITEMS (items: true)
// =============================================================================

type T1 = {
	type: "array";
	prefixItems: [
		{ type: "string" },
		{ type: "number" },
	];
	items: true;
};

TypeAssert<[
	[
		"Array with additional items should handle unlimited extensions",
		AllPass<[
			// Should equal the expected type with rest elements
			Equals<
				[[string, number, ...any[]], HandleArray<T1>, HandleSchema<T1>]
			>,

			// Base tuple should work
			Assignable<[string, number], HandleArray<T1>>,

			// Additional items of any type should work
			Assignable<[string, number, boolean], HandleArray<T1>>,
			Assignable<[string, number, "extra", 123, true], HandleArray<T1>>,
			Assignable<[string, number, {}, []], HandleArray<T1>>,
		]>,
	],
	[
		"Additional items array should still enforce prefix requirements",
		AllFails<[
			// Prefix items must still be correct
			Assignable<[number, string], HandleArray<T1>>,
			Assignable<[string, string], HandleArray<T1>>,
			Assignable<[boolean, number], HandleArray<T1>>,

			// Must have minimum length
			Assignable<[], HandleArray<T1>>,
			Assignable<[string], HandleArray<T1>>,
		]>,
	],
]>(true);

// =============================================================================
// ARRAYS WITH SPECIFIC ADDITIONAL ITEMS (items: schema)
// =============================================================================

type T2 = {
	type: "array";
	prefixItems: [
		{ type: "string" },
		{ type: "number" },
	];
	items: { enum: ["1", 2, 3, "4"] };
};

TypeAssert<[
	[
		"Array with specific additional items should work correctly",
		AllPass<[
			// Should equal expected type with constrained rest elements
			Equals<[
				[string, number, ...(2 | "1" | 3 | "4")[]],
				HandleArray<T2>,
				HandleSchema<T2>,
			]>,

			// Base tuple should work
			Assignable<[string, number], HandleArray<T2>>,

			// Valid additional items should work
			Assignable<[string, number, 2], HandleArray<T2>>,
			Assignable<[string, number, "1", 3], HandleArray<T2>>,
			Assignable<[string, number, 2, "1", 3, "4"], HandleArray<T2>>,
		]>,
	],
	[
		"Specific additional items should reject invalid extensions",
		AllFails<[
			// Invalid additional item values
			Assignable<[string, number, 5], HandleArray<T2>>, // 5 not in enum
			Assignable<[string, number, "11"], HandleArray<T2>>, // "11" not in enum
			Assignable<[string, number, true], HandleArray<T2>>, // boolean not in enum
			Assignable<[string, number, 2, "invalid"], HandleArray<T2>>, // mixed valid/invalid
		]>,
	],
	[
		"Additional items compatibility should work as expected",
		AllPass<[
			// Valid combinations using Assignables helper
			Assignables<[
				[string, number],
				[string, number, 2, "1", 3],
			], HandleArray<T2>>,
		]>,
	],
	[
		"Additional items should reject incompatible combinations",
		AllPass<[
			// Invalid combinations using NotAssignables helper
			NotAssignables<[
				[string], // too short
				[string, boolean], // wrong second type
				[string, number, 5], // invalid additional item
				[string, number, 2, "11", 3], // invalid middle item
			], HandleArray<T2>>,
		]>,
	],
]>(true);

// =============================================================================
// ARRAYS WITH NO ADDITIONAL ITEMS (items: false)
// =============================================================================

type T3 = {
	type: "array";
	prefixItems: [
		{ type: "string" },
		{ type: "number" },
	];
	items: false;
};

TypeAssert<[
	[
		"Array with no additional items should be strictly constrained",
		AllPass<[
			// Should equal exact tuple type
			Equals<[[string, number], HandleArray<T3>, HandleSchema<T3>]>,

			// Should accept exact match
			Assignable<[string, number], HandleArray<T3>>,
			Assignable<["test", 123], HandleArray<T3>>,
		]>,
	],
	[
		"No additional items array should reject any extensions",
		AllFails<[
			// Any additional items should fail
			Assignable<[string, number, any], HandleArray<T3>>,
			Assignable<[string, number, string], HandleArray<T3>>,
			Assignable<[string, number, number], HandleArray<T3>>,
			Assignable<[string, number, boolean], HandleArray<T3>>,
			Assignable<[string, number, 1, 2, 3], HandleArray<T3>>,
		]>,
	],
]>(true);

// =============================================================================
// COMPLEX NESTED ARRAY SCENARIOS
// =============================================================================

type T4 = {
	type: "array";
	prefixItems: [
		{
			type: "object";
			properties: {
				id: { type: "string" };
				name: { type: "string" };
			};
			required: ["id"];
		},
		{
			type: "array";
			items: { type: "number" };
		},
	];
	items: { type: "boolean" };
};

type V4 = HandleArray<T4>;

TypeAssert<[
	[
		"Complex nested array handling should work correctly",
		AllPass<[
			// Basic structure should work
			Assignable<[
				{ id: string; name?: string },
				number[],
			], HandleArray<T4>>,

			// With additional boolean items
			Assignable<[
				{ id: "test"; name: "example" },
				[1, 2, 3],
				true,
				false,
			], HandleArray<T4>>,

			// Minimal valid structure
			Assignable<[
				{ id: "minimal" },
				[],
			], HandleArray<T4>>,
		]>,
	],
	[
		"Complex nested array should enforce nested constraints",
		AllFails<[
			// Invalid object structure
			Assignable<[
				{ name: "no-id" }, // missing required id
				number[],
			], HandleArray<T4>>,

			// Invalid nested array
			Assignable<[
				{ id: "test" },
				["not", "numbers"], // should be number[]
			], HandleArray<T4>>,

			// Invalid additional items
			Assignable<[
				{ id: "test" },
				[1, 2, 3],
				"not-boolean", // should be boolean
			], HandleArray<T4>>,
		]>,
	],
]>(true);

// =============================================================================
// ARRAY TYPE VARIANCE AND EDGE CASES
// =============================================================================

type T5 = {
	type: "array";
	prefixItems: [];
	items: { type: "string" };
};

type T6 = {
	type: "array";
	items: false;
};

TypeAssert<[
	[
		"Edge case array types should work correctly",
		AllPass<[
			// String array with no prefix should work
			Assignable<string[], HandleArray<T5>>,
			Assignable<["a", "b", "c"], HandleArray<T5>>,
			Assignable<[], HandleArray<T5>>,

			// Empty array only for items: false
			Assignable<[], HandleArray<T6>>,
		]>,
	],
	[
		"Edge case arrays should reject invalid structures",
		AllFails<[
			// String array should reject numbers
			Assignable<[1, 2, 3], HandleArray<T5>>,
			Assignable<["a", 1, "c"], HandleArray<T5>>,

			// Empty-only array should reject any items
			Assignable<[any], HandleArray<T6>>,
			Assignable<["anything"], HandleArray<T6>>,
		]>,
	],
]>(true);

// =============================================================================
// COMPREHENSIVE ARRAY HANDLER VALIDATION
// =============================================================================

TypeAssert<[
	[
		"All array handlers maintain consistency",
		AllPass<[
			// HandleArray and HandleSchema should always match
			Equal<HandleArray<T0>, HandleSchema<T0>>,
			Equal<HandleArray<T1>, HandleSchema<T1>>,
			Equal<HandleArray<T2>, HandleSchema<T2>>,
			Equal<HandleArray<T3>, HandleSchema<T3>>,
			Equal<HandleArray<T4>, HandleSchema<T4>>,
			Equal<HandleArray<T5>, HandleSchema<T5>>,
			Equal<HandleArray<T6>, HandleSchema<T6>>,
		]>,
	],
	[
		"Array handlers provide distinct types",
		SomePass<[
			// Different array types should not all be assignable to each other
			NotAssignable<HandleArray<T0>, HandleArray<T1>>, // fixed vs extensible
			NotAssignable<HandleArray<T1>, HandleArray<T3>>, // extensible vs fixed
			NotAssignable<HandleArray<T2>, HandleArray<T5>>, // different item constraints
			NotAssignable<HandleArray<T3>, HandleArray<T6>>, // different lengths
		]>,
	],
	[
		"Array handlers maintain type safety",
		AllPass<[
			// All should be array-like
			Assignable<HandleArray<T0>, readonly unknown[]>,
			Assignable<HandleArray<T1>, readonly unknown[]>,
			Assignable<HandleArray<T2>, readonly unknown[]>,
			Assignable<HandleArray<T3>, readonly unknown[]>,
			Assignable<HandleArray<T4>, readonly unknown[]>,
			Assignable<HandleArray<T5>, readonly unknown[]>,
			Assignable<HandleArray<T6>, readonly unknown[]>,
		]>,
	],
]>(true);
