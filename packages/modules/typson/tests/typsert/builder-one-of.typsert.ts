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
// SIMPLE LITERAL ONEOF HANDLING
// =============================================================================

let T0 = T.oneOf([
	T.literal("active"),
	T.literal("inactive"),
	T.literal("pending"),
]);

let T1 = T.oneOf([
	T.literal(1),
	T.literal(42),
	T.literal(100),
]);

let T2 = T.oneOf([
	T.literal(true),
	T.literal(false),
	T.literal(null),
]);

type V0 = HandleSchema<typeof T0>;
type V1 = HandleSchema<typeof T1>;
type V2 = HandleSchema<typeof T2>;

TypeAssert<
	[
		[
			"Built OneOf with Simple Literals should be strictly typed",
			AllPass<
				[
					Assignables<
						[
							"active",
							"inactive",
							"pending",
						],
						V0
					>,
					Assignables<
						[
							1,
							42,
							100,
						],
						V1
					>,
					Assignables<
						[
							true,
							false,
							null,
						],
						V2
					>,
					NotAssignables<
						[
							"disabled",
							"running",
							2,
							43,
							99,
							undefined,
						],
						V0
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// MIXED LITERAL ONEOF HANDLING
// =============================================================================

let T3 = T.oneOf([
	T.literal("success"),
	T.literal(200),
	T.literal(true),
	T.literal(null),
]);

let T4 = T.oneOf([
	T.literals({ enum: ["small", "medium", "large"] }),
	T.literals({ enum: [1, 2, 3, 4, 5] }),
	T.literal(null),
]);

type V3 = HandleSchema<typeof T3>;
type V4 = HandleSchema<typeof T4>;

TypeAssert<
	[
		[
			"Built OneOf with Mixed Literal Types should accept all valid options",
			AllPass<
				[
					Assignables<
						[
							"success",
							200,
							true,
							null,
						],
						V3
					>,
					Assignables<
						[
							"small",
							"medium",
							"large",
							1,
							2,
							3,
							4,
							5,
							null,
						],
						V4
					>,
					NotAssignables<
						[
							"failure",
							404,
							false,
							undefined,
							"extra-large",
							0,
							6,
						],
						V3
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// OBJECT ONEOF HANDLING
// =============================================================================

let T5 = T.oneOf([
	T.object({
		properties: {
			type: T.literal("user"),
			id: T.string(),
		},
		required: ["type"],
	}),
	T.object({
		properties: {
			type: T.literal("admin"),
			permissions: T.array({
				items: T.literal("all"),
			}),
		},
		required: ["type"],
	}),
]);

let T6 = T.oneOf([
	T.object({
		properties: {
			status: T.literal("success"),
			data: T.array({
				items: T.string(),
			}),
		},
		required: ["status"],
	}),
	T.object({
		properties: {
			status: T.literal("error"),
			message: T.literal("Something went wrong"),
		},
		required: ["status", "message"],
	}),
	T.literal(null),
]);

type V5 = HandleSchema<typeof T5>;
type V6 = HandleSchema<typeof T6>;

TypeAssert<
	[
		[
			"Built OneOf with Object Types should handle discriminated unions",
			AllPass<
				[
					Assignables<
						[
							{ type: "user" },
							{ type: "user"; id: "user-123" },
							{ type: "admin" },
							{ type: "admin"; permissions: [] },
							{ type: "admin"; permissions: ["all"] },
							{ type: "admin"; permissions: ["all", "all"] },
						],
						V5
					>,
					Assignables<
						[
							{ status: "success" },
							{ status: "success"; data: [] },
							{ status: "success"; data: ["item1", "item2"] },
							{
								status: "error";
								message: "Something went wrong";
							},
							null,
						],
						V6
					>,
					NotAssignables<
						[
							{ type: "guest" },
							// unfixable, this is tied to how `extends` treat `union-type`, even thought these do not `satisfies` the constrain
							// { type: "user"; permissions: ["all"] },
							// { type: "admin"; id: "admin-123" },
							{ status: "warning" },
							{ status: "error" },
							{ status: "error"; message: "Different message" },
						],
						V5
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// ARRAY ONEOF HANDLING
// =============================================================================

let T7 = T.oneOf([
	T.array({
		items: T.literal("tag"),
	}),
	T.array({
		items: T.literal(1),
	}),
	T.array({
		prefixItems: [
			T.literal("fixed"),
			T.string(),
		],
	}),
]);

let T8 = T.oneOf([
	T.array({
		items: T.object({
			properties: {
				id: T.literal("item"),
				value: T.string(),
			},
			required: ["id"],
		}),
	}),
	T.array({
		items: T.literals({ enum: ["red", "green", "blue"] }),
	}),
	T.literal(null),
]);

type V7 = HandleSchema<typeof T7>;
type V8 = HandleSchema<typeof T8>;

TypeAssert<
	[
		[
			"Built OneOf with Array Types should handle different array structures",
			AllPass<
				[
					Assignables<
						[
							[],
							["tag"],
							["tag", "tag"],
							[1],
							[1, 1, 1],
							["fixed", "hello"],
							["fixed", "world"],
						],
						V7
					>,
					Assignables<
						[
							[],
							[{ id: "item" }],
							[{ id: "item"; value: "test" }],
							[{ id: "item" }, { id: "item"; value: "demo" }],
							["red"],
							["green", "blue"],
							["red", "green", "blue"],
							null,
						],
						V8
					>,
					NotAssignables<
						[
							["wrong"],
							[2],
							["fixed", 123],
							["variable", "hello"],
							["yellow"],
							[{ id: "wrong" }],
							undefined,
						],
						V7
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// MIXED OBJECT-ARRAY ONEOF HANDLING
// =============================================================================

let T9 = T.oneOf([
	T.object({
		properties: {
			type: T.literal("config"),
			settings: T.array({
				items: T.literals({ enum: ["option1", "option2"] }),
			}),
		},
		required: ["type"],
	}),
	T.array({
		items: T.object({
			properties: {
				name: T.literal("item"),
				active: T.literal(true),
			},
		}),
	}),
	T.literal("simple"),
]);

let T10 = T.oneOf([
	T.object({
		properties: {
			mode: T.literal("list"),
			items: T.array({
				prefixItems: [
					T.literal("header"),
					T.string(),
				],
				items: T.literal("data"),
			}),
		},
		required: ["mode"],
	}),
	T.object({
		properties: {
			mode: T.literal("single"),
			value: T.oneOf([
				T.literal("empty"),
				T.object({
					properties: {
						content: T.literal("filled"),
					},
				}),
			]),
		},
		required: ["mode"],
	}),
]);

type V9 = HandleSchema<typeof T9>;
type V10 = HandleSchema<typeof T10>;

TypeAssert<
	[
		[
			"Built OneOf with Mixed Object-Array Types should handle complex unions",
			AllPass<
				[
					Assignables<
						[
							{ type: "config" },
							{ type: "config"; settings: [] },
							{ type: "config"; settings: ["option1"] },
							{
								type: "config";
								settings: ["option1", "option2"];
							},
							[],
							[{}],
							[{ name: "item" }],
							[{ active: true }],
							[{ name: "item"; active: true }],
							[{}, { name: "item"; active: true }],
							"simple",
						],
						V9
					>,
					Assignables<
						[
							{ mode: "list" },
							{ mode: "list"; items: ["header", "title"] },
							{
								mode: "list";
								items: ["header", "title", "data"];
							},
							{ mode: "single" },
							{ mode: "single"; value: "empty" },
							{ mode: "single"; value: {} },
							{ mode: "single"; value: { content: "filled" } },
						],
						V10
					>,
					NotAssignables<
						[
							{ type: "wrong" },
							{ type: "config"; settings: ["option3"] },
							[{ name: "wrong" }],
							[{ active: false }],
							"complex",
							{ mode: "multiple" },
							{ mode: "single"; value: { content: "empty" } },
						],
						V9
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// NESTED ONEOF HANDLING
// =============================================================================

let T11 = T.oneOf([
	T.object({
		properties: {
			nested: T.oneOf([
				T.literal("deep"),
				T.array({
					items: T.literal("item"),
				}),
			]),
		},
	}),
]);

let T12 = T.object({
	properties: {
		data: T.oneOf([
			T.array({
				items: T.oneOf([
					T.literal("type1"),
					T.object({
						properties: {
							id: T.literal("nested-obj"),
						},
					}),
				]),
			}),
			T.object({
				properties: {
					alternative: T.oneOf([
						T.literal("alt1"),
						T.literal("alt2"),
					]),
				},
			}),
		]),
	},
});

type V11 = HandleSchema<typeof T11>;
type V12 = HandleSchema<typeof T12>;

TypeAssert<
	[
		[
			"Built Nested OneOf should handle deep union structures",
			AllPass<
				[
					Assignables<
						[
							{},
							{ nested: "deep" },
							{ nested: [] },
							{ nested: ["item"] },
							{ nested: ["item", "item"] },
						],
						V11
					>,
					Assignables<
						[
							{ data: [] },
							{ data: ["type1"] },
							{ data: [{}] },
							{ data: [{ id: "nested-obj" }] },
							{ data: ["type1", { id: "nested-obj" }] },
							{ data: {} },
							{ data: { alternative: "alt1" } },
							{ data: { alternative: "alt2" } },
						],
						V12
					>,
					NotAssignables<
						[
							"option3",
							3,
							{ nested: "shallow" },
							{ nested: ["wrong"] },
							{ data: ["type2"] },
							{ data: [{ id: "wrong-obj" }] },
							{ data: { alternative: "alt3" } },
						],
						V11
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// COMPLEX REAL-WORLD ONEOF SCENARIOS
// =============================================================================

let T13 = T.oneOf([
	T.object({
		properties: {
			type: T.literal("api-response"),
			status: T.literals({ enum: ["success", "error"] }),
			data: T.oneOf([
				T.array({
					items: T.object({
						properties: {
							id: T.string(),
							name: T.literal("user"),
							active: T.literal(true),
						},
						required: ["id", "name"],
					}),
				}),
				T.object({
					properties: {
						error_code: T.literals({ enum: [400, 401, 500] }),
						message: T.string(),
					},
					required: ["error_code"],
				}),
			]),
		},
		required: ["type", "status"],
	}),
	T.object({
		properties: {
			type: T.literal("websocket-message"),
			event: T.literals({ enum: ["connect", "disconnect", "data"] }),
			payload: T.oneOf([
				T.literal(null),
				T.array({
					items: T.literals({ enum: ["ping", "pong", "heartbeat"] }),
				}),
				T.object({
					properties: {
						session: T.literal("active"),
						metadata: T.array({
							items: T.object({
								properties: {
									key: T.string(),
									value: T.oneOf([
										T.literal("enabled"),
										T.literal(1),
										T.literal(null),
									]),
								},
								required: ["key"],
							}),
						}),
					},
				}),
			]),
		},
		required: ["type", "event"],
	}),
	T.array({
		items: T.oneOf([
			T.literal("batch-item"),
			T.object({
				properties: {
					batch_id: T.string(),
					items: T.array({
						items: T.object({
							properties: {
								processed: T.literal(true),
								result: T.oneOf([
									T.literal("success"),
									T.object({
										properties: {
											error: T.literal("failed"),
											retry: T.literal(false),
										},
									}),
								]),
							},
							required: ["processed"],
						}),
					}),
				},
				required: ["batch_id"],
			}),
		]),
	}),
]);

type V13 = HandleSchema<typeof T13>;

TypeAssert<
	[
		[
			"Built Complex Real-World OneOf should handle sophisticated scenarios",
			AllPass<
				[
					Assignables<
						[
							// API Response - Success with user array
							{
								type: "api-response";
								status: "success";
								data: [
									{ id: "user1"; name: "user"; active: true },
									{ id: "user2"; name: "user"; active: true },
								];
							},
							// API Response - Error with error object
							{
								type: "api-response";
								status: "error";
								data: {
									error_code: 400;
									message: "Bad request";
								};
							},
							// WebSocket Message - Connect with null payload
							{
								type: "websocket-message";
								event: "connect";
								payload: null;
							},
							// WebSocket Message - Data with ping array
							{
								type: "websocket-message";
								event: "data";
								payload: ["ping", "pong"];
							},
							// WebSocket Message - Complex payload with metadata
							{
								type: "websocket-message";
								event: "data";
								payload: {
									session: "active";
									metadata: [
										{ key: "feature"; value: "enabled" },
										{ key: "count"; value: 1 },
										{ key: "optional"; value: null },
									];
								};
							},
							// Batch Array - Simple items
							["batch-item", "batch-item"],
							// Batch Array - Complex batch object
							[
								{
									batch_id: "batch-123";
									items: [
										{ processed: true; result: "success" },
										{
											processed: true;
											result: {
												error: "failed";
												retry: false;
											};
										},
									];
								},
							],
							// Mixed batch array
							[
								"batch-item",
								{ batch_id: "batch-456"; items: [] },
							],
						],
						V13
					>,
					NotAssignables<
						[
							// Wrong type
							{ type: "wrong-response" },
							// Wrong status
							{ type: "api-response"; status: "pending" },
							// Wrong user name
							{
								type: "api-response";
								status: "success";
								data: [
									{
										id: "user1";
										name: "admin";
										active: true;
									},
								];
							},
							// Wrong error code
							{
								type: "api-response";
								status: "error";
								data: { error_code: 404; message: "Not found" };
							},
							// Wrong event
							{ type: "websocket-message"; event: "message" },
							// Wrong payload value
							{
								type: "websocket-message";
								event: "data";
								payload: { session: "inactive" };
							},
							// Wrong batch result
							[
								{
									batch_id: "batch-789";
									items: [
										{ processed: true; result: "failure" },
									];
								},
							],
						],
						V13
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
			"T.Infer<S> Should properly translate OneOf Schemas to corresponding types",
			AllPass<
				[
					Equals<[V0, T.Infer<typeof T0>]>,
					Equals<[V1, T.Infer<typeof T1>]>,
					Equals<[V2, T.Infer<typeof T2>]>,
					Equals<[V3, T.Infer<typeof T3>]>,
					Equals<[V4, T.Infer<typeof T4>]>,
					Equals<[V5, T.Infer<typeof T5>]>,
					Equals<[V6, T.Infer<typeof T6>]>,
					Equals<[V7, T.Infer<typeof T7>]>,
					Equals<[V8, T.Infer<typeof T8>]>,
					Equals<[V9, T.Infer<typeof T9>]>,
					Equals<[V10, T.Infer<typeof T10>]>,
					Equals<[V11, T.Infer<typeof T11>]>,
					Equals<[V12, T.Infer<typeof T12>]>,
					Equals<[V13, T.Infer<typeof T13>]>,
				]
			>,
		],
	]
>(true);
