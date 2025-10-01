import { HandleSchema, T } from "../../src/main";
import { AllPass, Equals, TypeAssert } from "@monitext/typsert";

// =============================================================================
// STRING BUILDER HANDLING
// =============================================================================

let T0 = T.string({ format: "date-time", "description": "some-date" });

type V0 = HandleSchema<typeof T0>;

TypeAssert<[
    [
        "Built String Object should be strictly typed",
        Equals<[{
            type: "string";
            enum: undefined;
            default: undefined;
            description: "some-date";
            format: "date-time";
        }, typeof T0]>,
    ],
    [
        "Built String Schema, should be properly converted to type",
        Equals<[
            string,
            V0,
        ]>,
    ],
]>(true);

// =============================================================================
// STRING ENUM BUILDER HANDLING
// =============================================================================

let T1 = T.string({ "enum": ["restrain", "to", "these"], default: "restrain" });

type V1 = HandleSchema<typeof T1>;

TypeAssert<[
    [
        "Built String Schema, should be enumerable",
        Equals<[
            "restrain" | "to" | "these",
            V1,
        ]>,
    ],
    [
        "Built String Schema, should conserve string typing",
        Equals<[{
            type: "string";
            enum: ["restrain", "to", "these"];
            default: "restrain";
            format: undefined;
            description: undefined;
        }, typeof T1]>,
    ],
]>(true);

// =============================================================================
// NUMBER BUILDER HANDLING
// =============================================================================

let T2 = T.number();

type V2 = HandleSchema<typeof T2>;

TypeAssert<[
    [
        "Built Number Schema should be strictly typed",
        Equals<[{
            type: "number";
            enum: undefined;
            default: undefined;
            description: undefined;
        }, typeof T2]>,
    ],
    [
        "Built Number Schema, should be properly converted to type",
        Equals<[
            number,
            V2,
        ]>,
    ],
]>(true);

// =============================================================================
// NUMBER ENUM BUILDER HANDLING
// =============================================================================

let T3 = T.number({ "enum": [1, 2, 3], default: 2 });

type V3 = HandleSchema<typeof T3>;

TypeAssert<[
    [
        "Built Number Schema, should be enumerable",
        Equals<[
            1 | 2 | 3,
            V3,
        ]>,
    ],
    [
        "Built Number Schema, should conserve string typing",
        Equals<[{
            type: "number";
            enum: [1, 2, 3];
            default: 2;
            description: undefined;
        }, typeof T3]>,
    ],
]>(true);

// =============================================================================
// BOOLEAN BUILDER HANDLING
// =============================================================================

let T4 = T.boolean({ default: true, description: "just a boolean" });

type V4 = HandleSchema<typeof T4>;

TypeAssert<[
    [
        "Built Boolean Schema should be strictly typed",
        Equals<[{
            type: "boolean";
            enum: undefined;
            description: "just a boolean";
            default: boolean;
        }, typeof T4]>,
    ],
    [
        "Built Boolean Schema, should be properly converted to type",
        Equals<[
            boolean,
            V4,
        ]>,
    ],
]>(true);

// =============================================================================
// BOOLEAN ENUM BUILDER HANDLING
// =============================================================================

let T5 = T.boolean({
    enum: [true],
    default: true,
    description: "A boolean, that can only be true",
});

type V5 = HandleSchema<typeof T5>;

TypeAssert<[
    [
        "Built Boolean Schema should be strictly typed",
        Equals<[{
            type: "boolean";
            enum: [true];
            description: "A boolean, that can only be true";
            default: true | undefined;
        }, typeof T5]>,
    ],
    [
        "Built Boolean Schema, should be properly converted to type",
        Equals<[
            true,
            V5,
        ]>,
    ],
]>(true);

// =============================================================================
// NULL BUILDER HANDLING
// =============================================================================

let T6 = T.null({ description: "just a null value" });

type V6 = HandleSchema<typeof T6>;

TypeAssert<[
    [
        "Built Null Schema should be strictly typed",
        Equals<[{
            type: "null";
            description: "just a null value";
        }, typeof T6]>,
    ],
    [
        "Built Null Schema, should be properly converted to type",
        Equals<[
            null,
            V6,
        ]>,
    ],
]>(true);

// =============================================================================
// ENUM BUILDER HANDLING
// =============================================================================

let T7 = T.enum({
    enum: ["expect", "these", "value", "eg:", 1, 2, 3, false],
    default: "expect",
});

type V7 = HandleSchema<typeof T7>;

TypeAssert<[
    [
        "Built Enum Schema should be strictly typed",
        Equals<[{
            enum: ["expect", "these", "value", "eg:", 1, 2, 3, false];
            default: "expect";
            description: undefined;
        }, typeof T7]>,
    ],
    [
        "Built Null Schema, should be properly converted to type",
        Equals<[
            false | "expect" | "these" | "value" | "eg:" | 1 | 2 | 3,
            V7,
        ]>,
    ],
]>(true);

// =============================================================================
// LITERAL BUILDER HANDLING
// =============================================================================

let T8 = T.literal("test");
let T9 = T.literal(1);
let T10 = T.literal(true);

type V8 = HandleSchema<typeof T8>;
type V9 = HandleSchema<typeof T9>;
type V10 = HandleSchema<typeof T10>;

TypeAssert<[
    [
        "Built Literal Schema should be strictly typed",
        AllPass<[
            Equals<[{
                enum: ["test"];
            }, typeof T8]>,
            Equals<[{
                enum: [1];
            }, typeof T9]>,
            Equals<[{
                enum: [true];
            }, typeof T10]>,
        ]>,
    ],
    [
        "Built Literal Schema, should be properly converted to type",
        AllPass<[
            Equals<["test", V8]>,
            Equals<[1, V9]>,
            Equals<[true, V10]>,
        ]>,
    ],
]>(true);
