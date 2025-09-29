import {
	HandleBoolean,
	HandleEnum,
	HandleNull,
	HandleNumber,
	HandleSchema,
	HandleString,
} from "../../src/main";

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
// NULL TYPE HANDLING
// =============================================================================

TypeAssert<[
	[
		"Null type should be handled correctly",
		AllPass<[
			// Core functionality - handlers should match
			Equals<
				[
					null,
					HandleSchema<{ type: "null" }>,
					HandleNull<{ type: "null" }>,
				]
			>,

			// Should be assignable from null
			Assignable<null, HandleNull<{ type: "null" }>>,

			// Schema and handler should be equivalent
			Equal<HandleNull<{ type: "null" }>, HandleSchema<{ type: "null" }>>,
		]>,
	],
	[
		"Null type should reject non-null values",
		AllFails<[
			// Should not accept other falsy values
			Assignable<undefined, HandleNull<{ type: "null" }>>,
			Assignable<false, HandleNull<{ type: "null" }>>,
			Assignable<0, HandleNull<{ type: "null" }>>,
			Assignable<"", HandleNull<{ type: "null" }>>,

			// Should not accept truthy values
			Assignable<true, HandleNull<{ type: "null" }>>,
			Assignable<1, HandleNull<{ type: "null" }>>,
			Assignable<"null", HandleNull<{ type: "null" }>>,
			Assignable<{}, HandleNull<{ type: "null" }>>,
		]>,
	],
]>(true);

// =============================================================================
// ENUM TYPE HANDLING
// =============================================================================

TypeAssert<[
	[
		"Mixed enum type should be handled correctly",
		AllPass<[
			// Core functionality with mixed enum
			Equals<[
				"test" | 2 | true | null,
				HandleSchema<{ enum: ["test", true, 2, null] }>,
				HandleEnum<{ enum: ["test", true, 2, null] }>,
			]>,

			// Should accept all enum values
			Assignable<"test", HandleEnum<{ enum: ["test", true, 2, null] }>>,
			Assignable<2, HandleEnum<{ enum: ["test", true, 2, null] }>>,
			Assignable<true, HandleEnum<{ enum: ["test", true, 2, null] }>>,
			Assignable<null, HandleEnum<{ enum: ["test", true, 2, null] }>>,
		]>,
	],
	[
		"Enum should reject values not in the enum list",
		AllFails<[
			// Similar but not exact values
			Assignable<"Test", HandleEnum<{ enum: ["test", true, 2, null] }>>, // wrong case
			Assignable<"test ", HandleEnum<{ enum: ["test", true, 2, null] }>>, // extra space
			Assignable<1, HandleEnum<{ enum: ["test", true, 2, null] }>>, // wrong number
			Assignable<3, HandleEnum<{ enum: ["test", true, 2, null] }>>, // not in enum
			Assignable<false, HandleEnum<{ enum: ["test", true, 2, null] }>>, // wrong boolean
			Assignable<
				undefined,
				HandleEnum<{ enum: ["test", true, 2, null] }>
			>, // not null
		]>,
	],
]>(true);

// Test string-only enum
TypeAssert<[
	[
		"String-only enum should work correctly",
		AllPass<[
			// String enum should create proper union
			Equal<
				HandleEnum<{ enum: ["alpha", "beta", "gamma"] }>,
				"alpha" | "beta" | "gamma"
			>,

			// Should accept all string enum values
			Assignable<
				"alpha",
				HandleEnum<{ enum: ["alpha", "beta", "gamma"] }>
			>,
			Assignable<
				"beta",
				HandleEnum<{ enum: ["alpha", "beta", "gamma"] }>
			>,
			Assignable<
				"gamma",
				HandleEnum<{ enum: ["alpha", "beta", "gamma"] }>
			>,
		]>,
	],
]>(true);

// Test number-only enum
TypeAssert<[
	[
		"Number-only enum should work correctly",
		AllPass<[
			// Number enum should create proper union
			Equal<HandleEnum<{ enum: [1, 2, 3, 5, 8] }>, 1 | 2 | 3 | 5 | 8>,

			// Should accept all number enum values
			Assignable<1, HandleEnum<{ enum: [1, 2, 3, 5, 8] }>>,
			Assignable<3, HandleEnum<{ enum: [1, 2, 3, 5, 8] }>>,
			Assignable<8, HandleEnum<{ enum: [1, 2, 3, 5, 8] }>>,
		]>,
	],
	[
		"Number enum should reject non-enum numbers",
		AllFails<[
			Assignable<0, HandleEnum<{ enum: [1, 2, 3, 5, 8] }>>,
			Assignable<4, HandleEnum<{ enum: [1, 2, 3, 5, 8] }>>,
			Assignable<9, HandleEnum<{ enum: [1, 2, 3, 5, 8] }>>,
			Assignable<-1, HandleEnum<{ enum: [1, 2, 3, 5, 8] }>>,
		]>,
	],
]>(true);

// =============================================================================
// STRING TYPE HANDLING
// =============================================================================

TypeAssert<[
	[
		"Basic string type should be handled correctly",
		AllPass<[
			// Core functionality
			Equals<[
				string,
				HandleSchema<{ type: "string" }>,
				HandleString<{ type: "string" }>,
			]>,

			// Should accept all string values
			Assignable<"hello", HandleString<{ type: "string" }>>,
			Assignable<"", HandleString<{ type: "string" }>>,
			Assignable<"123", HandleString<{ type: "string" }>>,
			Assignable<string, HandleString<{ type: "string" }>>,
		]>,
	],
	[
		"String type should reject non-string values",
		AllFails<[
			// Numbers
			Assignable<123, HandleString<{ type: "string" }>>,
			Assignable<0, HandleString<{ type: "string" }>>,

			// Booleans
			Assignable<true, HandleString<{ type: "string" }>>,
			Assignable<false, HandleString<{ type: "string" }>>,

			// Other types
			Assignable<null, HandleString<{ type: "string" }>>,
			Assignable<undefined, HandleString<{ type: "string" }>>,
			Assignable<{}, HandleString<{ type: "string" }>>,
			Assignable<[], HandleString<{ type: "string" }>>,
		]>,
	],
]>(true);

// Test string with enum
TypeAssert<[
	[
		"String with enum should be handled correctly",
		AllPass<[
			// Should equal the specific union type
			Equals<[
				"some-string" | "another-str",
				HandleSchema<{
					type: "string";
					enum: ["some-string", "another-str"];
				}>,
				HandleString<{
					type: "string";
					enum: ["some-string", "another-str"];
				}>,
			]>,

			// Should accept enum values
			Assignable<
				"some-string",
				HandleString<{
					type: "string";
					enum: ["some-string", "another-str"];
				}>
			>,
			Assignable<
				"another-str",
				HandleString<{
					type: "string";
					enum: ["some-string", "another-str"];
				}>
			>,
		]>,
	],
	[
		"String enum should reject non-enum strings",
		AllFails<[
			// Other strings not in enum
			Assignable<
				"some-other-string",
				HandleString<{
					type: "string";
					enum: ["some-string", "another-str"];
				}>
			>,
			Assignable<
				"",
				HandleString<{
					type: "string";
					enum: ["some-string", "another-str"];
				}>
			>,

			// Non-strings
			Assignable<
				123,
				HandleString<{
					type: "string";
					enum: ["some-string", "another-str"];
				}>
			>,
		]>,
	],
]>(true);

// =============================================================================
// NUMBER TYPE HANDLING
// =============================================================================

TypeAssert<[
	[
		"Basic number type should be handled correctly",
		AllPass<[
			// Core functionality
			Equals<[
				number,
				HandleSchema<{ type: "number" }>,
				HandleNumber<{ type: "number" }>,
			]>,

			// Should accept all number values
			Assignable<42, HandleNumber<{ type: "number" }>>,
			Assignable<0, HandleNumber<{ type: "number" }>>,
			Assignable<-1, HandleNumber<{ type: "number" }>>,
			Assignable<3.14, HandleNumber<{ type: "number" }>>,
		]>,
	],
	[
		"Number type should reject non-number values",
		AllFails<[
			// Strings (including numeric strings)
			Assignable<"123", HandleNumber<{ type: "number" }>>,
			Assignable<"0", HandleNumber<{ type: "number" }>>,
			Assignable<"3.14", HandleNumber<{ type: "number" }>>,

			// Other types
			Assignable<true, HandleNumber<{ type: "number" }>>,
			Assignable<false, HandleNumber<{ type: "number" }>>,
			Assignable<null, HandleNumber<{ type: "number" }>>,
			Assignable<undefined, HandleNumber<{ type: "number" }>>,
			Assignable<{}, HandleNumber<{ type: "number" }>>,
		]>,
	],
]>(true);

// Test number with enum
TypeAssert<[
	[
		"Number with enum should be handled correctly",
		AllPass<[
			// Should equal the specific union type
			Equals<[
				1 | 2 | 3,
				HandleSchema<{ type: "number"; enum: [1, 2, 3] }>,
				HandleNumber<{ type: "number"; enum: [1, 2, 3] }>,
			]>,

			// Should accept enum values
			Assignable<1, HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,
			Assignable<2, HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,
			Assignable<3, HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,
		]>,
	],
	[
		"Number enum should reject non-enum numbers",
		AllFails<[
			// Numbers not in enum
			Assignable<0, HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,
			Assignable<4, HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,
			Assignable<-1, HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,

			// Non-numbers
			Assignable<"1", HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,
			Assignable<true, HandleNumber<{ type: "number"; enum: [1, 2, 3] }>>,
		]>,
	],
]>(true);

// =============================================================================
// BOOLEAN TYPE HANDLING
// =============================================================================

TypeAssert<[
	[
		"Basic boolean type should be handled correctly",
		AllPass<[
			// Core functionality
			Equals<[
				boolean,
				HandleSchema<{ type: "boolean" }>,
				HandleBoolean<{ type: "boolean" }>,
			]>,

			// Should accept boolean values
			Assignable<true, HandleBoolean<{ type: "boolean" }>>,
			Assignable<false, HandleBoolean<{ type: "boolean" }>>,
			Assignable<boolean, HandleBoolean<{ type: "boolean" }>>,
		]>,
	],
	[
		"Boolean type should reject non-boolean values",
		AllFails<[
			// Truthy values that aren't boolean
			Assignable<1, HandleBoolean<{ type: "boolean" }>>,
			Assignable<"true", HandleBoolean<{ type: "boolean" }>>,
			Assignable<[], HandleBoolean<{ type: "boolean" }>>,
			Assignable<{}, HandleBoolean<{ type: "boolean" }>>,

			// Falsy values that aren't boolean
			Assignable<0, HandleBoolean<{ type: "boolean" }>>,
			Assignable<"", HandleBoolean<{ type: "boolean" }>>,
			Assignable<null, HandleBoolean<{ type: "boolean" }>>,
			Assignable<undefined, HandleBoolean<{ type: "boolean" }>>,
		]>,
	],
]>(true);

// Test boolean with single enum value
TypeAssert<[
	[
		"Boolean with single enum value should work correctly",
		AllPass<[
			// Should equal the specific literal type
			Equals<[
				true,
				HandleSchema<{ type: "boolean"; enum: [true] }>,
				HandleBoolean<{ type: "boolean"; enum: [true] }>,
			]>,

			// Should accept only the enum value
			Assignable<true, HandleBoolean<{ type: "boolean"; enum: [true] }>>,
		]>,
	],
	[
		"Single boolean enum should reject other values",
		AllFails<[
			// Even the other boolean value
			Assignable<false, HandleBoolean<{ type: "boolean"; enum: [true] }>>,

			// Other types
			Assignable<1, HandleBoolean<{ type: "boolean"; enum: [true] }>>,
			Assignable<
				"true",
				HandleBoolean<{ type: "boolean"; enum: [true] }>
			>,
		]>,
	],
]>(true);

// Test boolean with both enum values
TypeAssert<[
	[
		"Boolean with both enum values should equal regular boolean",
		AllPass<[
			// Should equal boolean when both values are present
			Equals<[
				boolean,
				HandleSchema<{ type: "boolean"; enum: [true, false] }>,
				HandleBoolean<{ type: "boolean"; enum: [true, false] }>,
			]>,

			// Should accept both values
			Assignable<
				true,
				HandleBoolean<{ type: "boolean"; enum: [true, false] }>
			>,
			Assignable<
				false,
				HandleBoolean<{ type: "boolean"; enum: [true, false] }>
			>,
			Assignable<
				boolean,
				HandleBoolean<{ type: "boolean"; enum: [true, false] }>
			>,
		]>,
	],
]>(true);

// =============================================================================
// EDGE CASES AND ERROR CONDITIONS
// =============================================================================

TypeAssert<[
	[
		"Empty enum should be handled gracefully",
		AllPass<[
			// Empty enum should result in never type
			Equal<HandleEnum<{ enum: [] }>, never>,

			// Never should not be assignable from anything
			NotAssignable<any, HandleEnum<{ enum: [] }>>,
			NotAssignable<unknown, HandleEnum<{ enum: [] }>>,
		]>,
	],
]>(true);

// =============================================================================
// COMPREHENSIVE LITERAL HANDLER VALIDATION
// =============================================================================

TypeAssert<[
	[
		"All literal handlers maintain consistency with schema handlers",
		AllPass<[
			// All handlers should match their schema equivalents
			Equal<HandleNull<{ type: "null" }>, HandleSchema<{ type: "null" }>>,
			Equal<
				HandleString<{ type: "string" }>,
				HandleSchema<{ type: "string" }>
			>,
			Equal<
				HandleNumber<{ type: "number" }>,
				HandleSchema<{ type: "number" }>
			>,
			Equal<
				HandleBoolean<{ type: "boolean" }>,
				HandleSchema<{ type: "boolean" }>
			>,
			Equal<
				HandleEnum<{ enum: ["a", 1, true] }>,
				HandleSchema<{ enum: ["a", 1, true] }>
			>,
		]>,
	],
	[
		"Literal types provide meaningful distinctions",
		SomePass<[
			// Different literal types should not be assignable to each other
			NotAssignable<
				HandleString<{ type: "string" }>,
				HandleNumber<{ type: "number" }>
			>,
			NotAssignable<
				HandleNumber<{ type: "number" }>,
				HandleBoolean<{ type: "boolean" }>
			>,
			NotAssignable<
				HandleBoolean<{ type: "boolean" }>,
				HandleNull<{ type: "null" }>
			>,
			NotAssignable<
				HandleNull<{ type: "null" }>,
				HandleString<{ type: "string" }>
			>,
		]>,
	],
	[
		"All literal handlers produce valid types",
		AllPass<[
			// All should be assignable to unknown
			Assignable<HandleNull<{ type: "null" }>, unknown>,
			Assignable<HandleString<{ type: "string" }>, unknown>,
			Assignable<HandleNumber<{ type: "number" }>, unknown>,
			Assignable<HandleBoolean<{ type: "boolean" }>, unknown>,
			Assignable<HandleEnum<{ enum: ["test"] }>, unknown>,
		]>,
	],
]>(true);
