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
// OBJECT WITH LITERAL ARRAY PROPERTIES
// =============================================================================

let T0 = T.object({
	properties: {
		tags: T.array({
			items: T.literal("tag"),
		}),
		counts: T.array({
			items: T.literal(1),
		}),
	},
});

let T1 = T.object({
	properties: {
		status: T.literal("active"),
		items: T.array({
			items: T.literals({ enum: ["red", "green", "blue"] }),
		}),
		numbers: T.array({
			items: T.literals({ enum: [1, 2, 3] }),
		}),
	},
});

type V0 = HandleSchema<typeof T0>;
type V1 = HandleSchema<typeof T1>;

TypeAssert<
	[
		[
			"Built Object with Literal Array Properties should be strictly typed",
			AllPass<
				[
					Assignables<
						[
							{},
							{ tags: [] },
							{ tags: ["tag"] },
							{ tags: ["tag", "tag"] },
							{ counts: [] },
							{ counts: [1] },
							{ counts: [1, 1, 1] },
							{ tags: ["tag"]; counts: [1] },
						],
						V0
					>,
					Assignables<
						[
							{},
							{ status: "active" },
							{ items: [] },
							{ items: ["red"] },
							{ items: ["red", "green", "blue"] },
							{ numbers: [1, 2, 3] },
							{ status: "active"; items: ["red"]; numbers: [1] },
						],
						V1
					>,
					NotAssignables<
						[
							{ tags: ["wrong"] },
							{ counts: [2] },
							{ items: ["yellow"] },
							{ numbers: [4] },
							{ status: "inactive" },
							{ items: ["red", "yellow"] },
						],
						V0
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// ARRAY WITH LITERAL OBJECT ELEMENTS
// =============================================================================

let T2 = T.array({
	items: T.object({
		properties: {
			id: T.literal("item-123"),
			type: T.literal("user"),
		},
	}),
});

let T3 = T.array({
	items: T.object({
		properties: {
			name: T.string(),
			category: T.literal("product"),
			priority: T.literals({ enum: ["high", "medium", "low"] }),
		},
		required: ["name", "category"],
	}),
});

type V2 = HandleSchema<typeof T2>;
type V3 = HandleSchema<typeof T3>;

TypeAssert<
	[
		[
			"Built Array with Literal Object Elements should handle object constraints",
			AllPass<
				[
					Assignables<
						[
							[],
							[{}],
							[{ id: "item-123" }],
							[{ type: "user" }],
							[{ id: "item-123"; type: "user" }],
							[
								{ id: "item-123" },
								{ type: "user" },
								{ id: "item-123"; type: "user" },
							],
						],
						V2
					>,
					Assignables<
						[
							[],
							[{ name: "test"; category: "product" }],
							[{
								name: "demo";
								category: "product";
								priority: "high";
							}],
							[
								{
									name: "first";
									category: "product";
									priority: "low";
								},
								{ name: "second"; category: "product" },
							],
						],
						V3
					>,
					NotAssignables<
						[
							[{ id: "item-456" }],
							[{ type: "admin" }],
							[{ name: "test" }],
							[{ category: "product" }],
							[{ name: "test"; category: "service" }],
							[{
								name: "test";
								category: "product";
								priority: "urgent";
							}],
						],
						V2
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// NESTED OBJECT-ARRAY STRUCTURES
// =============================================================================

let T4 = T.object({
	properties: {
		config: T.object({
			properties: {
				items: T.array({
					items: T.literal("config-item"),
				}),
				flags: T.array({
					items: T.literal(true),
				}),
			},
		}),
		metadata: T.array({
			items: T.object({
				properties: {
					key: T.literal("meta-key"),
					value: T.literals({ enum: ["a", "b", "c"] }),
				},
			}),
		}),
	},
});

type V4 = HandleSchema<typeof T4>;

TypeAssert<
	[
		[
			"Built Nested Object-Array Structure should handle deep mixed types",
			AllPass<
				[
					Assignables<
						[
							{},
							{ config: {} },
							{ config: { items: [] } },
							{ config: { items: ["config-item"] } },
							{ config: { flags: [true] } },
							{
								config: {
									items: ["config-item"];
									flags: [true, true];
								};
							},
							{ metadata: [] },
							{ metadata: [{}] },
							{ metadata: [{ key: "meta-key" }] },
							{ metadata: [{ value: "a" }] },
							{ metadata: [{ key: "meta-key"; value: "b" }] },
							{
								config: {
									items: ["config-item"];
									flags: [true];
								};
								metadata: [{ key: "meta-key"; value: "c" }];
							},
						],
						V4
					>,
					NotAssignables<
						[
							{ config: { items: ["wrong-item"] } },
							{ config: { flags: [false] } },
							{ metadata: [{ key: "wrong-key" }] },
							{ metadata: [{ value: "d" }] },
						],
						V4
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// ARRAY WITH NESTED OBJECT-ARRAY ELEMENTS
// =============================================================================

let T5 = T.array({
	items: T.object({
		properties: {
			name: T.literal("service"),
			endpoints: T.array({
				items: T.object({
					properties: {
						method: T.literals({ enum: ["GET", "POST", "PUT"] }),
						secure: T.literal(true),
					},
					required: ["method"],
				}),
			}),
			tags: T.array({
				items: T.literal("api-tag"),
			}),
		},
		required: ["name"],
	}),
});

type V5 = HandleSchema<typeof T5>;

TypeAssert<
	[
		[
			"Built Array with Nested Object-Array Elements should handle complex structures",
			AllPass<
				[
					Assignables<
						[
							[],
							[{ name: "service" }],
							[{ name: "service"; endpoints: [] }],
							[{
								name: "service";
								endpoints: [{ method: "GET" }];
							}],
							[{
								name: "service";
								endpoints: [{ method: "POST"; secure: true }];
							}],
							[{ name: "service"; tags: [] }],
							[{ name: "service"; tags: ["api-tag"] }],
							[
								{
									name: "service";
									endpoints: [
										{ method: "GET"; secure: true },
										{ method: "PUT" },
									];
									tags: ["api-tag", "api-tag"];
								},
							],
							[
								{
									name: "service";
									endpoints: [{ method: "GET" }];
								},
								{ name: "service"; tags: ["api-tag"] },
							],
						],
						V5
					>,
					NotAssignables<
						[
							[{ name: "wrong-service" }],
							[{
								name: "service";
								endpoints: [{ method: "DELETE" }];
							}],
							[{
								name: "service";
								endpoints: [{ secure: true }];
							}],
							[{
								name: "service";
								endpoints: [{ method: "GET"; secure: false }];
							}],
							[{ name: "service"; tags: ["wrong-tag"] }],
							[{}],
						],
						V5
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// TUPLE WITH MIXED OBJECT-ARRAY ELEMENTS
// =============================================================================

let T6 = T.array({
	prefixItems: [
		T.object({
			properties: {
				type: T.literal("header"),
				version: T.literal("1.0"),
			},
			required: ["type"],
		}),
		T.array({
			items: T.literals({ enum: ["item1", "item2", "item3"] }),
		}),
		T.object({
			properties: {
				status: T.literal("complete"),
				count: T.literal(42),
			},
		}),
	],
	items: T.array({
		items: T.literal("extra"),
	}),
});

type V6 = HandleSchema<typeof T6>;

TypeAssert<
	[
		[
			"Built Tuple with Mixed Object-Array Elements should handle fixed structures",
			AllPass<
				[
					Assignables<
						[
							[{ type: "header" }, [], {}],
							[{ type: "header"; version: "1.0" }, ["item1"], {}],
							[
								{ type: "header" },
								["item1", "item2"],
								{ status: "complete" },
							],
							[
								{ type: "header"; version: "1.0" },
								["item3"],
								{ status: "complete"; count: 42 },
							],
							[
								{ type: "header" },
								["item1", "item2", "item3"],
								{ status: "complete"; count: 42 },
								[],
							],
							[
								{ type: "header" },
								["item2"],
								{},
								["extra"],
								["extra", "extra"],
							],
						],
						V6
					>,
					NotAssignables<
						[
							[{}, [], {}],
							[{ type: "wrong" }, [], {}],
							[{ type: "header" }, ["item4"], {}],
							[{ type: "header" }, [], { status: "incomplete" }],
							[{ type: "header" }, [], {}, ["wrong"]],
						],
						V6
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// DEEPLY NESTED MIXED STRUCTURES
// =============================================================================

let T7 = T.object({
	properties: {
		services: T.array({
			items: T.object({
				properties: {
					name: T.literal("micro-service"),
					config: T.object({
						properties: {
							ports: T.array({
								items: T.literal(3000),
							}),
							environments: T.array({
								items: T.literals({
									enum: ["dev", "staging", "prod"],
								}),
							}),
						},
					}),
					instances: T.array({
						items: T.object({
							properties: {
								id: T.string(),
								status: T.literal("running"),
								metrics: T.array({
									items: T.literals({
										enum: ["cpu", "memory", "disk"],
									}),
								}),
							},
							required: ["id", "status"],
						}),
					}),
				},
				required: ["name"],
			}),
		}),
		global: T.object({
			properties: {
				version: T.literal("2.1.0"),
				features: T.array({
					items: T.literal("enabled"),
				}),
			},
		}),
	},
	required: ["services"],
});

type V7 = HandleSchema<typeof T7>;

TypeAssert<
	[
		[
			"Built Deeply Nested Mixed Structure should handle complex real-world scenarios",
			AllPass<
				[
					Assignables<
						[
							{ services: [] },
							{ services: [{ name: "micro-service" }] },
							{
								services: [
									{
										name: "micro-service";
										config: { ports: [3000] };
									},
								];
							},
							{
								services: [
									{
										name: "micro-service";
										config: {
											ports: [3000, 3000];
											environments: ["dev", "prod"];
										};
										instances: [
											{
												id: "inst-1";
												status: "running";
												metrics: ["cpu", "memory"];
											},
										];
									},
								];
								global: {
									version: "2.1.0";
									features: ["enabled"];
								};
							},
							{
								services: [
									{ name: "micro-service" },
									{
										name: "micro-service";
										instances: [
											{ id: "inst-2"; status: "running" },
											{
												id: "inst-3";
												status: "running";
												metrics: ["disk"];
											},
										];
									},
								];
							},
						],
						V7
					>,
					NotAssignables<
						[
							{},
							{ services: [{ name: "wrong-service" }] },
							{
								services: [
									{
										name: "micro-service";
										config: { ports: [8080] };
									},
								];
							},
							{
								services: [
									{
										name: "micro-service";
										config: { environments: ["test"] };
									},
								];
							},
							{
								services: [
									{
										name: "micro-service";
										instances: [
											{ id: "inst-1"; status: "stopped" },
										];
									},
								];
							},
							{
								services: [{ name: "micro-service" }];
								global: { version: "3.0.0" };
							},
						],
						V7
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// COMPLEX ARRAY-OBJECT-ARRAY NESTING
// =============================================================================

let T8 = T.array({
	items: T.array({
		items: T.object({
			properties: {
				group: T.literal("data-group"),
				items: T.array({
					items: T.array({
						items: T.literals({ enum: ["leaf1", "leaf2"] }),
					}),
				}),
				metadata: T.object({
					properties: {
						created: T.literal("2024-01-01"),
						tags: T.array({
							items: T.literal("meta-tag"),
						}),
					},
				}),
			},
		}),
	}),
});

type V8 = HandleSchema<typeof T8>;

TypeAssert<
	[
		[
			"Built Complex Array-Object-Array Nesting should handle deep structures",
			AllPass<
				[
					Assignables<
						[
							[],
							[[]],
							[[{}]],
							[[{ group: "data-group" }]],
							[[{ group: "data-group"; items: [] }]],
							[[{ group: "data-group"; items: [[]] }]],
							[[{ group: "data-group"; items: [["leaf1"]] }]],
							[[{
								group: "data-group";
								items: [["leaf1", "leaf2"]];
							}]],
							[[{ metadata: {} }]],
							[[{ metadata: { created: "2024-01-01" } }]],
							[[{ metadata: { tags: ["meta-tag"] } }]],
							[
								[
									{
										group: "data-group";
										items: [["leaf1"], ["leaf2"]];
										metadata: {
											created: "2024-01-01";
											tags: ["meta-tag", "meta-tag"];
										};
									},
								],
							],
							[
								[{ group: "data-group" }],
								[
									{ items: [["leaf1"]] },
									{
										metadata: {
											created: "2024-01-01";
											tags: [];
										};
									},
								],
							],
						],
						V8
					>,
					NotAssignables<
						[
							[[{ group: "wrong-group" }]],
							[[{ items: [["leaf3"]] }]],
							[[{ metadata: { created: "2024-01-02" } }]],
							[[{ metadata: { tags: ["wrong-tag"] } }]],
						],
						V8
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
			"T.Infer<S> Should properly translate Mixed Object-Array Schemas to corresponding types",
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
				]
			>,
		],
	]
>(true);
