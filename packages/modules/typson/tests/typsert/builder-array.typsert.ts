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
// SIMPLE PRIMITIVE ARRAY BUILDER HANDLING
// =============================================================================

let T0 = T.array({
	items: T.string(),
});

let T1 = T.array({
	items: T.number(),
});

type V0 = HandleSchema<typeof T0>;
type V1 = HandleSchema<typeof T1>;

TypeAssert<
	[
		[
			"Built Array Schema with primitive items should be strictly typed",
			AllPass<
				[
					Assignables<
						[
							[],
							["hello"],
							["hello", "world"],
							["a", "b", "c", "d"],
						],
						V0
					>,
					Assignables<
						[
							[],
							[1],
							[1, 2, 3],
							[42, 0, -5],
						],
						V1
					>,
					NotAssignables<
						[
							[1, 2, 3],
							["hello", 123],
							[true, false],
							["string", null],
						],
						V0
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// LITERAL ARRAY BUILDER HANDLING
// =============================================================================

let T2 = T.array({
	items: T.literal("active"),
});

let T3 = T.array({
	items: T.literal(42),
});

let T4 = T.array({
	items: T.literal(true),
});

let T5 = T.array({
	items: T.literal(null),
});

type V2 = HandleSchema<typeof T2>;
type V3 = HandleSchema<typeof T3>;
type V4 = HandleSchema<typeof T4>;
type V5 = HandleSchema<typeof T5>;

TypeAssert<
	[
		[
			"Built Array with Literal Items should be strictly typed",
			AllPass<
				[
					Assignables<
						[
							[],
							["active"],
							["active", "active"],
							["active", "active", "active"],
						],
						V2
					>,
					Assignables<
						[
							[],
							[42],
							[42, 42],
							[42, 42, 42, 42],
						],
						V3
					>,
					Assignables<
						[
							[],
							[true],
							[true, true],
							[true, true, true],
						],
						V4
					>,
					Assignables<
						[
							[],
							[null],
							[null, null],
							[null, null, null],
						],
						V5
					>,
					NotAssignables<
						[
							["inactive"],
							["active", "inactive"],
							[43],
							[42, 43],
							[false],
							[true, false],
							[undefined],
							[null, undefined],
						],
						V2
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// ENUM ARRAY BUILDER HANDLING
// =============================================================================

let T6 = T.array({
	items: T.literals({ enum: ["small", "medium", "large"] }),
});

let T7 = T.array({
	items: T.literals({ enum: [1, 2, 3, 5, 8] }),
});

let T8 = T.array({
	items: T.literals({ enum: [true, false, null] }),
});

let T9 = T.array({
	items: T.literals({ enum: ["red", "green", "blue", 42, true] }),
});

type V6 = HandleSchema<typeof T6>;
type V7 = HandleSchema<typeof T7>;
type V8 = HandleSchema<typeof T8>;
type V9 = HandleSchema<typeof T9>;

TypeAssert<
	[
		[
			"Built Array with Enum Items should accept valid enum values",
			AllPass<
				[
					Assignables<
						[
							[],
							["small"],
							["medium", "large"],
							["small", "medium", "large"],
							["large", "small", "medium", "small"],
						],
						V6
					>,
					Assignables<
						[
							[],
							[1],
							[2, 3],
							[1, 2, 3, 5, 8],
							[8, 5, 3, 2, 1],
							[1, 1, 2, 2, 3, 3],
						],
						V7
					>,
					Assignables<
						[
							[],
							[true],
							[false, null],
							[true, false, null],
							[null, true, false, true],
						],
						V8
					>,
					Assignables<
						[
							[],
							["red"],
							["green", "blue"],
							[42, true],
							["red", "green", "blue", 42, true],
							[true, "red", 42, "blue"],
						],
						V9
					>,
					NotAssignables<
						[
							["extra-small"],
							["small", "extra-large"],
							[0],
							[1, 4],
							[1, 2, 3, 4, 5],
							["yellow"],
							[43],
							[false],
						],
						V6
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// TUPLE LITERAL ARRAY BUILDER HANDLING
// =============================================================================

let T10 = T.array({
	prefixItems: [
		T.literal("start"),
		T.literal(123),
		T.literal(true),
		T.literal(null),
	],
});

let T11 = T.array({
	prefixItems: [
		T.string(),
		T.literal("separator"),
		T.number(),
		T.literal("end"),
	],
});

let T12 = T.array({
	prefixItems: [
		T.literal("header"),
		T.literals({ enum: ["type1", "type2", "type3"] }),
	],
	items: T.literal("data"),
});

type V10 = HandleSchema<typeof T10>;
type V11 = HandleSchema<typeof T11>;
type V12 = HandleSchema<typeof T12>;

TypeAssert<
	[
		[
			"Built Tuple Array with Literals should handle fixed structures",
			AllPass<
				[
					Assignables<
						[
							["start", 123, true, null],
						],
						V10
					>,
					Assignables<
						[
							["hello", "separator", 42, "end"],
							["world", "separator", 0, "end"],
							["test", "separator", 999, "end"],
						],
						V11
					>,
					Assignables<
						[
							["header", "type1"],
							["header", "type2"],
							["header", "type3"],
							["header", "type1", "data"],
							["header", "type2", "data", "data"],
							["header", "type3", "data", "data", "data"],
						],
						V12
					>,
					NotAssignables<
						[
							["begin", 123, true, null],
							["start", 456, true, null],
							["start", 123, false, null],
							["start", 123, true, undefined],
							["start", 123],
							["hello", "divider", 42, "end"],
							["hello", "separator", "42", "end"],
							["hello", "separator", 42, "stop"],
							["header", "type4"],
							["header", "type1", "wrong"],
						],
						V10
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// NESTED LITERAL ARRAY BUILDER HANDLING
// =============================================================================

let T13 = T.array({
	items: T.array({
		items: T.literal("nested"),
	}),
});

let T14 = T.array({
	items: T.array({
		items: T.literals({ enum: ["a", "b", "c"] }),
	}),
});

let T15 = T.array({
	prefixItems: [
		T.array({
			items: T.literal("first"),
		}),
		T.array({
			items: T.literal(42),
		}),
	],
});

type V13 = HandleSchema<typeof T13>;
type V14 = HandleSchema<typeof T14>;
type V15 = HandleSchema<typeof T15>;

TypeAssert<
	[
		[
			"Built Nested Array with Literals should handle deep structures",
			AllPass<
				[
					Assignables<
						[
							[],
							[[]],
							[["nested"]],
							[["nested", "nested"]],
							[[], ["nested"], ["nested", "nested"]],
							[["nested"], ["nested", "nested", "nested"]],
						],
						V13
					>,
					Assignables<
						[
							[],
							[[]],
							[["a"]],
							[["a", "b", "c"]],
							[["a", "b"], ["c"], ["a", "c"]],
							[["b", "c", "a", "b"]],
						],
						V14
					>,
					Assignables<
						[
							[[], []],
							[["first"], [42]],
							[["first", "first"], [42, 42]],
							[[], [42, 42, 42]],
						],
						V15
					>,
					NotAssignables<
						[
							[["wrong"]],
							[["nested", "wrong"]],
							[["d"]],
							[["a", "d"]],
							[["first"], [43]],
							[["second"], [42]],
						],
						V13
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// MIXED LITERAL AND PRIMITIVE ARRAY HANDLING
// =============================================================================

let T16 = T.array({
	prefixItems: [
		T.string(),
		T.literal("divider"),
		T.number(),
		T.literal("marker"),
	],
	items: T.literals({ enum: ["extra1", "extra2"] }),
});

let T17 = T.array({
	items: T.array({
		prefixItems: [
			T.literal("item"),
			T.string(),
		],
		items: T.literals({ enum: [1, 2, 3] }),
	}),
});

type V16 = HandleSchema<typeof T16>;
type V17 = HandleSchema<typeof T17>;

TypeAssert<
	[
		[
			"Built Array with Mixed Literal and Primitive types should work correctly",
			AllPass<
				[
					Assignables<
						[
							["hello", "divider", 42, "marker"],
							["world", "divider", 0, "marker", "extra1"],
							[
								"test",
								"divider",
								999,
								"marker",
								"extra1",
								"extra2",
							],
							[
								"demo",
								"divider",
								-5,
								"marker",
								"extra2",
								"extra1",
								"extra2",
							],
						],
						V16
					>,
					Assignables<
						[
							[],
							[["item", "name"]],
							[["item", "test", 1]],
							[["item", "demo", 2, 3]],
							[
								["item", "first"],
								["item", "second", 1, 2],
								["item", "third", 3],
							],
						],
						V17
					>,
					NotAssignables<
						[
							["hello", "separator", 42, "marker"],
							["hello", "divider", "42", "marker"],
							["hello", "divider", 42, "end"],
							["test", "divider", 999, "marker", "extra3"],
							[["wrong", "name"]],
							[["item", "test", 4]],
							[["item", "test", "1"]],
						],
						V16
					>,
				]
			>,
		],
	]
>(true);

// =============================================================================
// DEEPLY NESTED LITERAL ARRAY HANDLING
// =============================================================================

let T18 = T.array({
	items: T.array({
		items: T.array({
			items: T.literal("deep"),
		}),
	}),
});

let T19 = T.array({
	prefixItems: [
		T.literal("config"),
		T.array({
			items: T.array({
				prefixItems: [
					T.literal("section"),
					T.literals({ enum: ["type1", "type2"] }),
				],
				items: T.literal("value"),
			}),
		}),
	],
});

let T20 = T.array({
	items: T.array({
		prefixItems: [
			T.literal("group"),
			T.array({
				items: T.literals({ enum: ["red", "green", "blue"] }),
			}),
			T.array({
				items: T.literals({ enum: [1, 2, 3, 4, 5] }),
			}),
		],
	}),
});

type V18 = HandleSchema<typeof T18>;
type V19 = HandleSchema<typeof T19>;
type V20 = HandleSchema<typeof T20>;

TypeAssert<
	[
		[
			"Built Deeply Nested Arrays should handle complex literal structures",
			AllPass<
				[
					Assignables<
						[
							[],
							[[]],
							[[[]]],
							[[["deep"]]],
							[[["deep", "deep"]]],
							[[[]], [["deep"]], [["deep", "deep"]]],
						],
						V18
					>,
					Assignables<
						[
							["config", [["section", "type1"]]],
							["config", [["section", "type2", "value"]]],
							[
								"config",
								[
									["section", "type1", "value", "value"],
									["section", "type2"],
								],
							],
						],
						V19
					>,
					Assignables<
						[
							[],
							[["group", [], []]],
							[["group", ["red"], [1]]],
							[["group", ["red", "green"], [1, 2, 3]]],
							[
								["group", ["red"], [1, 2]],
								["group", ["blue", "green"], [4, 5]],
							],
						],
						V20
					>,
					NotAssignables<
						[
							[[["wrong"]]],
							[["wrong", []]],
							["config", [["wrong", "type1"]]],
							["config", [["section", "type3"]]],
							[["group", ["yellow"], [1]]],
							[["group", ["red"], [6]]],
						],
						V18
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
			"T.Infer<S> Should properly translate Array Schemas to corresponding types",
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
					Equals<[V14, T.Infer<typeof T14>]>,
					Equals<[V15, T.Infer<typeof T15>]>,
					Equals<[V16, T.Infer<typeof T16>]>,
					Equals<[V17, T.Infer<typeof T17>]>,
					Equals<[V18, T.Infer<typeof T18>]>,
					Equals<[V19, T.Infer<typeof T19>]>,
					Equals<[V20, T.Infer<typeof T20>]>,
				]
			>,
		],
	]
>(true);
