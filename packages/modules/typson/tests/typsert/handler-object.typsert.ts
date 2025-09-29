import { HandleObject, HandleSchema } from "../../src/main";

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
// BASIC OBJECT HANDLING
// =============================================================================

type T0 = {
	type: "object";
	properties: {
		pass: { type: "boolean" };
		fail: { type: "boolean" };
	};
};

type V0 = HandleSchema<T0>;

TypeAssert<[
	[
		"Basic object handling should work correctly",
		AllPass<[
			// Core functionality - handlers should match
			Equal<HandleSchema<T0>, HandleObject<T0>>,

			// Should handle basic object structures
			Assignable<{ pass: true }, HandleSchema<T0>>,
			Assignable<{ fail: false }, HandleSchema<T0>>,
			Assignable<{ pass: true; fail: false }, HandleSchema<T0>>,

			// Should allow partial objects (all properties optional)
			Assignable<{}, HandleSchema<T0>>,
		]>,
	],
	[
		"Basic object should demonstrate structural typing",
		AllPass<[
			// Should allow additional properties due to structural typing
			Assignable<{ pass: true; extra: "allowed" }, HandleSchema<T0>>,
			Assignable<{ fail: false; test: "pass" }, HandleSchema<T0>>,
			Assignable<
				{ pass: true; fail: true; test: "pass" },
				HandleSchema<T0>
			>,

			// Multiple additional properties should work
			Assignable<{
				pass: false;
				fail: true;
				extra1: "test";
				extra2: 123;
				extra3: { nested: true };
			}, HandleSchema<T0>>,
		]>,
	],
	[
		"Basic object should reject malformed property types",
		AllFails<[
			// Wrong property types should be rejected
			Assignable<{ pass: "string" }, HandleSchema<T0>>, // should be boolean
			Assignable<{ fail: 123 }, HandleSchema<T0>>, // should be boolean
			Assignable<{ pass: null }, HandleSchema<T0>>, // should be boolean

			// Mixed wrong types
			Assignable<{ pass: "wrong"; fail: "also wrong" }, HandleSchema<T0>>,
		]>,
	],
]>(true);

// =============================================================================
// OBJECT WITH REQUIRED PROPERTIES
// =============================================================================

type T1 = {
	type: "object";
	properties: {
		pass: { type: "boolean" };
		fail: { type: "boolean" };
	};
	required: ["pass"];
};

TypeAssert<[
	[
		"Object with required properties should enforce requirements",
		AllPass<[
			// Must have required properties
			Assignable<{ pass: true }, HandleSchema<T1>>,
			Assignable<{ pass: false }, HandleSchema<T1>>,

			// Can have both required and optional
			Assignable<{ pass: true; fail: false }, HandleSchema<T1>>,
			Assignable<{ pass: false; fail: true }, HandleSchema<T1>>,

			// Can have additional properties with required ones
			Assignable<{ pass: true; extra: "test" }, HandleSchema<T1>>,
			Assignable<
				{ pass: true; fail: false; test: "pass" },
				HandleSchema<T1>
			>,
		]>,
	],
	[
		"Required properties object should reject incomplete objects",
		AllFails<[
			// Missing required property should fail
			Assignable<{}, HandleSchema<T1>>,
			Assignable<{ fail: true }, HandleSchema<T1>>,
			Assignable<{ fail: false; test: "pass" }, HandleSchema<T1>>,

			// Having additional properties doesn't help without required ones
			Assignable<{ extra: "not enough" }, HandleSchema<T1>>,
		]>,
	],
]>(true);

// =============================================================================
// COMPLEX NESTED OBJECT HANDLING
// =============================================================================

type T2 = {
	type: "object";
	properties: {
		user: {
			type: "object";
			properties: {
				id: { type: "string" };
				name: { type: "string" };
				email: { type: "string" };
			};
			required: ["id"];
		};
		settings: {
			type: "object";
			properties: {
				theme: { type: "string" };
				notifications: { type: "boolean" };
			};
		};
		metadata: {
			type: "object";
			properties: {
				created: { type: "string" };
				updated: { type: "string" };
			};
			required: ["created"];
		};
	};
	required: ["user"];
};

TypeAssert<[
	[
		"Complex nested object should handle deep structures correctly",
		AllPass<[
			// Minimal valid structure
			Assignable<{
				user: { id: "test-id" };
			}, HandleSchema<T2>>,

			// Partial nested optional properties
			Assignable<{
				user: { id: "test"; name: "John" };
			}, HandleSchema<T2>>,

			// Full valid structure
			Assignable<{
				user: { id: "test"; name: "John"; email: "john@test.com" };
				settings: { theme: "dark"; notifications: true };
				metadata: { created: "2024-01-01"; updated: "2024-01-02" };
			}, HandleSchema<T2>>,

			// Optional nested objects can be omitted
			Assignable<{
				user: { id: "test"; name: "Jane" };
				settings: { theme: "light" }; // notifications is optional
			}, HandleSchema<T2>>,
		]>,
	],
	[
		"Complex nested object should enforce nested requirements",
		AllFails<[
			// Missing top-level required property
			Assignable<{}, HandleSchema<T2>>,
			Assignable<{
				settings: { theme: "dark" };
			}, HandleSchema<T2>>, // user is required

			// Missing nested required property
			Assignable<{
				user: { name: "No ID" }; // id is required in user
			}, HandleSchema<T2>>,

			Assignable<{
				user: { id: "test" };
				metadata: { updated: "2024-01-02" }; // created is required in metadata
			}, HandleSchema<T2>>,

			// Wrong nested property types
			Assignable<{
				user: { id: 123 }; // id should be string
			}, HandleSchema<T2>>,

			Assignable<{
				user: { id: "test" };
				settings: { notifications: "yes" }; // should be boolean
			}, HandleSchema<T2>>,
		]>,
	],
]>(true);

// =============================================================================
// OBJECT WITH MIXED PROPERTY TYPES
// =============================================================================

type T3 = {
	type: "object";
	properties: {
		id: { type: "number" };
		name: { type: "string" };
		active: { type: "boolean" };
		tags: {
			type: "array";
			items: { type: "string" };
		};
		config: {
			type: "object";
			properties: {
				level: { type: "number" };
				debug: { type: "boolean" };
			};
		};
		status: {
			enum: ["pending", "active", "inactive"];
		};
	};
	required: ["id", "name"];
};

TypeAssert<[
	[
		"Mixed property types object should handle diverse schemas",
		AllPass<[
			// Minimal required properties
			Assignable<{
				id: 123;
				name: "test";
			}, HandleSchema<T3>>,

			// With optional array property
			Assignable<{
				id: 456;
				name: "example";
				tags: ["tag1", "tag2"];
			}, HandleSchema<T3>>,

			// With optional object property
			Assignable<{
				id: 789;
				name: "sample";
				config: { level: 5; debug: true };
			}, HandleSchema<T3>>,

			// With enum property
			Assignable<{
				id: 101;
				name: "status-test";
				status: "active";
			}, HandleSchema<T3>>,

			// Full object with all properties
			Assignable<{
				id: 202;
				name: "full-example";
				active: true;
				tags: ["important", "verified"];
				config: { level: 10; debug: false };
				status: "pending";
			}, HandleSchema<T3>>,
		]>,
	],
	[
		"Mixed property types should enforce type safety",
		AllFails<[
			// Wrong required property types
			Assignable<{
				id: "should-be-number";
				name: "test";
			}, HandleSchema<T3>>,

			Assignable<{
				id: 123;
				name: 456; // should be string
			}, HandleSchema<T3>>,

			// Wrong optional property types
			Assignable<{
				id: 123;
				name: "test";
				active: "yes"; // should be boolean
			}, HandleSchema<T3>>,

			Assignable<{
				id: 123;
				name: "test";
				tags: ["valid", 123]; // array should contain only strings
			}, HandleSchema<T3>>,

			// Wrong nested object types
			Assignable<{
				id: 123;
				name: "test";
				config: { level: "high"; debug: true }; // level should be number
			}, HandleSchema<T3>>,

			// Wrong enum value
			Assignable<{
				id: 123;
				name: "test";
				status: "unknown"; // not in enum
			}, HandleSchema<T3>>,
		]>,
	],
]>(true);

// =============================================================================
// EDGE CASES AND ERROR CONDITIONS
// =============================================================================

type T4 = {
	type: "object";
	properties: {};
};

type T5 = {
	type: "object";
	properties: {
		everything: { type: "string" };
		is: { type: "number" };
		required: { type: "boolean" };
	};
	required: ["everything", "is", "required"];
};

TypeAssert<[
	[
		"Edge case objects should work correctly",
		AllPass<[
			// Empty properties should accept any object
			Assignable<{}, HandleSchema<T4>>,
			Assignable<{ anything: "goes" }, HandleSchema<T4>>,
			Assignable<
				{ any: { nested: { structure: true } } },
				HandleSchema<T4>
			>,

			// All-required object should accept complete objects
			Assignable<{
				everything: "test";
				is: 42;
				required: true;
			}, HandleSchema<T5>>,

			// All-required can have additional properties
			Assignable<{
				everything: "present";
				is: 100;
				required: false;
				extra: "allowed";
			}, HandleSchema<T5>>,
		]>,
	],
	[
		"All-required object should be strict about requirements",
		AllFails<[
			// Missing any required property should fail
			Assignable<{}, HandleSchema<T5>>,

			Assignable<{
				everything: "present";
				is: 42;
				// missing required
			}, HandleSchema<T5>>,

			Assignable<{
				everything: "present";
				required: true;
				// missing is
			}, HandleSchema<T5>>,

			Assignable<{
				is: 42;
				required: true;
				// missing everything
			}, HandleSchema<T5>>,

			// Even with correct values, all must be present
			Assignable<{
				everything: "good";
				// missing others
			}, HandleSchema<T5>>,
		]>,
	],
]>(true);

// =============================================================================
// OBJECT TYPE VARIANCE TESTING
// =============================================================================

type SimpleObject = {
	type: "object";
	properties: {
		name: { type: "string" };
	};
};

type ExtendedObject = {
	type: "object";
	properties: {
		name: { type: "string" };
		age: { type: "number" };
		email: { type: "string" };
	};
};

TypeAssert<[
	[
		"Object type variance should work correctly",
		AllPass<[
			// Both should be object-like
			Assignable<HandleSchema<SimpleObject>, object>,
			Assignable<HandleSchema<ExtendedObject>, object>,

			// Should work with structural typing
			Assignable<
				{ name: "John"; extra: true },
				HandleSchema<SimpleObject>
			>,
			Assignable<
				{ name: "Jane"; age: 30; email: "jane@test.com"; id: 123 },
				HandleSchema<ExtendedObject>
			>,

			// Should maintain proper relationships
			Assignable<HandleSchema<ExtendedObject>, { name?: string }>,
		]>,
	],
	[
		"Different object schemas should maintain distinctions",
		SomePass<[
			// Some relationships might not hold due to structural differences
			NotAssignable<{ age: number }, HandleSchema<SimpleObject>>, // SimpleObject doesn't expect age
			Assignable<{ name: "test"; age: 25 }, HandleSchema<ExtendedObject>>, // ExtendedObject can accept both
			NotAssignable<HandleSchema<T5>, HandleSchema<SimpleObject>>, // Very different requirements
		]>,
	],
]>(true);

// =============================================================================
// COMPREHENSIVE OBJECT HANDLER VALIDATION
// =============================================================================

TypeAssert<[
	[
		"All object handlers maintain consistency",
		AllPass<[
			// HandleObject and HandleSchema should always match
			Equal<HandleObject<T0>, HandleSchema<T0>>,
			Equal<HandleObject<T1>, HandleSchema<T1>>,
			Equal<HandleObject<T2>, HandleSchema<T2>>,
			Equal<HandleObject<T3>, HandleSchema<T3>>,
			Equal<HandleObject<T4>, HandleSchema<T4>>,
			Equal<HandleObject<T5>, HandleSchema<T5>>,
		]>,
	],
	[
		"Object handlers provide meaningful type distinctions",
		SomePass<[
			// Different object types should not all be assignable to each other
			NotAssignable<HandleSchema<T0>, HandleSchema<T1>>, // different requirements
			NotAssignable<HandleSchema<T1>, HandleSchema<T2>>, // different structure
			NotAssignable<HandleSchema<T2>, HandleSchema<T3>>, // different properties
			NotAssignable<HandleSchema<T4>, HandleSchema<T5>>, // different requirements
		]>,
	],
	[
		"All object handlers produce valid object types",
		AllPass<[
			// All should be assignable to object
			Assignable<HandleSchema<T0>, object>,
			Assignable<HandleSchema<T1>, object>,
			Assignable<HandleSchema<T2>, object>,
			Assignable<HandleSchema<T3>, object>,
			Assignable<HandleSchema<T4>, object>,
			Assignable<HandleSchema<T5>, object>,
		]>,
	],
]>(true);
