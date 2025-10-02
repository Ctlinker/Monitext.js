import { HandleSchema, T } from "../../src/main";
import {
	AllPass,
	Assignable,
	Assignables,
	Equals,
	NotAssignables,
	TypeAssert,
} from "@monitext/typsert";

// =============================================================================
// SIMPLE-PRIMITIVE OBJECT BUILDER HANDLING
// =============================================================================

let T0 = T.object({
	properties: {
		simple: T.string(),
		param: T.number(),
	},
});

type V0 = HandleSchema<typeof T0>;

TypeAssert<
	[
		[
			"Built Object Schema should be strictly typed",
			AllPass<
				[
					Assignables<
						[
							{},
							{ simple: string },
							{ param: number },
							{ simple: string; param: number },
						],
						V0
					>,
					NotAssignables<
						[
							{ extra: "test" },
							{ simple: number },
							{ param: string },
							{ simple: boolean; param: number },
						],
						V0
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// LITERAL OBJECT BUILDER HANDLING
// =============================================================================

let T1 = T.object({
	properties: {
		status: T.literal("active"),
		version: T.literal(1),
		enabled: T.literal(true),
		type: T.literal(null),
	},
});

type V1 = HandleSchema<typeof T1>;

TypeAssert<
	[
		[
			"Built Object with Literal Properties should be strictly typed",
			AllPass<
				[
					Assignables<
						[
							{},
							{ status: "active" },
							{ version: 1 },
							{ enabled: true },
							{ type: null },
							{
								status: "active";
								version: 1;
								enabled: true;
								type: null;
							},
						],
						V1
					>,
					NotAssignables<
						[
							{ extra: "any" },
							{ status: "inactive" },
							{ version: 2 },
							{ enabled: false },
							{ type: "string" },
							{ status: "active"; version: "1" },
						],
						V1
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// ENUM OBJECT BUILDER HANDLING
// =============================================================================

let T2 = T.object({
	properties: {
		priority: T.literals({ enum: ["low", "medium", "high"] }),
		count: T.literals({ enum: [1, 2, 3, 5, 8] }),
		flags: T.literals({ enum: [true, false, null] }),
	},
});

type V2 = HandleSchema<typeof T2>;

TypeAssert<
	[
		[
			"Built Object with Enum Properties should accept valid enum values",
			AllPass<
				[
					Assignables<
						[
							{},
							{ priority: "low" },
							{ priority: "medium" },
							{ priority: "high" },
							{ count: 1 },
							{ count: 2 },
							{ count: 3 },
							{ count: 5 },
							{ count: 8 },
							{ flags: true },
							{ flags: false },
							{ flags: null },
							{ priority: "high"; count: 8; flags: true },
						],
						V2
					>,
					NotAssignables<
						[
							{ priority: "urgent" },
							{ count: 4 },
							{ count: "1" },
							{ flags: "true" },
							{ priority: "low"; count: 10 },
						],
						V2
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// NESTED LITERAL OBJECT BUILDER HANDLING
// =============================================================================

let T3 = T.object({
	properties: {
		config: T.object({
			properties: {
				mode: T.literal("production"),
				debug: T.literal(false),
			},
		}),
		metadata: T.object({
			properties: {
				version: T.literal("1.0.0"),
				build: T.literal(12345),
			},
		}),
	},
});

type V3 = HandleSchema<typeof T3>;

TypeAssert<
	[
		[
			"Built Nested Object with Literals should handle deep structures",
			AllPass<
				[
					Assignables<
						[
							{},
							{ config: {} },
							{ config: { mode: "production" } },
							{ config: { debug: false } },
							{ config: { mode: "production"; debug: false } },
							{ metadata: { version: "1.0.0" } },
							{ metadata: { build: 12345 } },
							{ metadata: { version: "1.0.0"; build: 12345 } },
							{
								config: { mode: "production"; debug: false };
								metadata: { version: "1.0.0"; build: 12345 };
							},
						],
						V3
					>,
					NotAssignables<
						[
							{ config: { mode: "development" } },
							{ config: { debug: true } },
							{ metadata: { version: "2.0.0" } },
							{ metadata: { build: "12345" } },
							{
								config: { mode: "production"; debug: true };
								metadata: { version: "1.0.0"; build: 12345 };
							},
						],
						V3
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// REQUIRED LITERAL PROPERTIES HANDLING
// =============================================================================

let T4 = T.object({
	properties: {
		id: T.literal("user-123"),
		type: T.literal("user"),
		active: T.literal(true),
		optional: T.string(),
	},
	required: ["id", "type"],
});

type V4 = HandleSchema<typeof T4>;

TypeAssert<
	[
		[
			"Built Object with Required Literals should enforce requirements",
			AllPass<
				[
					Assignables<
						[
							{ id: "user-123"; type: "user" },
							{ id: "user-123"; type: "user"; active: true },
							{ id: "user-123"; type: "user"; optional: "test" },
							{
								id: "user-123";
								type: "user";
								active: true;
								optional: "test";
							},
							{ id: "user-123"; type: "user"; extra: "allowed" },
						],
						V4
					>,
					NotAssignables<
						[
							{},
							{ id: "user-123" },
							{ type: "user" },
							{ active: true; optional: "test" },
							{ id: "user-456"; type: "user" },
							{ id: "user-123"; type: "admin" },
						],
						V4
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// MIXED LITERAL AND PRIMITIVE OBJECT HANDLING
// =============================================================================

let T5 = T.object({
	properties: {
		name: T.string(),
		age: T.number(),
		role: T.literal("admin"),
		permissions: T.literals({ enum: ["read", "write", "delete"] }),
		active: T.boolean(),
		score: T.literals({ enum: [1, 2, 3, 4, 5] }),
	},
	required: ["name", "role"],
});

type V5 = HandleSchema<typeof T5>;

TypeAssert<
	[
		[
			"Built Object with Mixed Literal and Primitive types should work correctly",
			AllPass<
				[
					Assignables<
						[
							{ name: "John"; role: "admin" },
							{ name: "Jane"; role: "admin"; age: 30 },
							{ name: "Bob"; role: "admin"; permissions: "read" },
							{ name: "Alice"; role: "admin"; active: true },
							{ name: "Charlie"; role: "admin"; score: 5 },
							{
								name: "Dave";
								role: "admin";
								age: 25;
								permissions: "write";
								active: false;
								score: 3;
							},
						],
						V5
					>,
					NotAssignables<
						[
							{ name: "John" },
							{ role: "admin" },
							{ name: "John"; role: "user" },
							{
								name: "John";
								role: "admin";
								permissions: "execute";
							},
							{ name: "John"; role: "admin"; score: 6 },
							{ name: 123; role: "admin" },
						],
						V5
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// DEEPLY NESTED LITERAL OBJECT HANDLING
// =============================================================================

let T6 = T.object({
	properties: {
		service: T.object({
			properties: {
				name: T.literal("auth-service"),
				config: T.object({
					properties: {
						environment: T.literal("production"),
						port: T.literal(3000),
						settings: T.object({
							properties: {
								ssl: T.literal(true),
								timeout: T.literal(5000),
								retries: T.literals({ enum: [1, 2, 3] }),
							},
						}),
					},
				}),
			},
			required: ["name"],
		}),
		version: T.literal("1.2.3"),
	},
	required: ["service"],
});

type V6 = HandleSchema<typeof T6>;

TypeAssert<
	[
		[
			"Built Deeply Nested Object with Literals should handle complex structures",
			AllPass<
				[
					Assignables<
						[
							{ service: { name: "auth-service" } },
							{
								service: { name: "auth-service" };
								version: "1.2.3";
							},
							{
								service: {
									name: "auth-service";
									config: { environment: "production" };
								};
							},
							{
								service: {
									name: "auth-service";
									config: {
										environment: "production";
										port: 3000;
										settings: { ssl: true };
									};
								};
								version: "1.2.3";
							},
							{
								service: {
									name: "auth-service";
									config: {
										environment: "production";
										port: 3000;
										settings: {
											ssl: true;
											timeout: 5000;
											retries: 2;
										};
									};
								};
								version: "1.2.3";
							},
						],
						V6
					>,
					NotAssignables<
						[
							{},
							{ version: "1.2.3" },
							{ service: { name: "user-service" } },
							{
								service: {
									name: "auth-service";
									config: { environment: "development" };
								};
							},
							{
								service: {
									name: "auth-service";
									config: {
										environment: "production";
										port: 8080;
									};
								};
							},
							{
								service: {
									name: "auth-service";
									config: {
										environment: "production";
										settings: { ssl: false };
									};
								};
							},
						],
						V6
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// BUILDER INFERENCE CONSISTENCY
// =============================================================================

TypeAssert<
	[
		[
			"T.Infer<S> Should properly translate Object Schemas to corresponding types",
			AllPass<
				[
					Equals<[V0, T.Infer<typeof T0>]>,
					Equals<[V1, T.Infer<typeof T1>]>,
					Equals<[V2, T.Infer<typeof T2>]>,
					Equals<[V3, T.Infer<typeof T3>]>,
					Equals<[V4, T.Infer<typeof T4>]>,
					Equals<[V5, T.Infer<typeof T5>]>,
					Equals<[V6, T.Infer<typeof T6>]>,
				]
			>,
		],
	]
>(true);
