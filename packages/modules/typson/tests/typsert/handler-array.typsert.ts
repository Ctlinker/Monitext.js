import { HandleArray, HandleSchema } from "../../src/main";

import {
	Assignables,
	Equals,
	NotAssignables,
	TypeAssert,
} from "@monitext/typsert";

type T0 = {
	type: "array";
	prefixItems: [
		{ type: "string" },
		{ type: "number" },
	];
};

TypeAssert<[
	[
		"Tuple should be handled properly",
		Equals<[[string, number], HandleArray<T0>, HandleSchema<T0>]>,
	],
]>(true);

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
		"additional props should be handled properly",
		Equals<[[string, number, ...any[]], HandleArray<T1>, HandleSchema<T1>]>,
	],
]>(true);

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
		"additional known props should be handled properly",
		Equals<
			[
				[string, number, ...(2 | "1" | 3 | "4")[]],
				HandleArray<T2>,
				HandleSchema<T2>,
			]
		>,
	],
	[
		"additional known props should be assignable",
		Assignables<[
			[string, number],
			[string, number, 2, "1", 3],
		], HandleArray<T2>>,
	],
	[
		"additional known props should be respected",
		NotAssignables<[
			[string],
			[string, boolean],
			[string, number, 5],
			[string, number, 2, "11", 3],
		], HandleArray<T2>>,
	],
]>(true);

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
		"restrained props should be handled properly",
		Equals<[[string, number], HandleArray<T3>, HandleSchema<T3>]>,
	],
]>(true);
