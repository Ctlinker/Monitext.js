/**
 * @file rules-example.ts
 *
 * Practical example showing the challenges of implementing Rules
 * and different approaches to solve them.
 */

import { T } from "@monitext/typson";
import { assemblePlugin, describePlugin } from "../plugin-build";
import { Monitor } from "../bus-impl";
import { EventData } from "../bus-types";

// ============================================================================
// THE PROBLEM: We want to control which plugins receive which events
// ============================================================================

/**
 * Without Rules (current state):
 * - All plugins receive ALL events
 * - Plugins must filter internally
 * - Inefficient and verbose
 */

// ============================================================================
// CHALLENGE 1: Plugin Identification
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("CHALLENGE 1: How do we identify plugins in rules?");
console.log("=".repeat(80));

// Approach A: By plugin name (string)
const rulesApproachA = {
    logger: {
        receive: ["error", "warning"],
    },
    metrics: {
        receive: ["*"], // All events
    },
};
console.log("Approach A (by name):", rulesApproachA);
console.log("  Problem: String matching is fragile, typos cause bugs");

// Approach B: By plugin instance (object key)
// This is tricky in JavaScript/TypeScript
const loggerPlugin = {} as any;
const metricsPlugin = {} as any;

// Can't use objects as keys in plain object
const rulesApproachB = new Map([
    [loggerPlugin, { receive: ["error", "warning"] }],
    [metricsPlugin, { receive: ["*"] }],
]);
console.log("Approach B (by instance):", "Uses WeakMap/Map");
console.log("  Problem: Awkward API, hard to write declaratively");

// Approach C: By plugin signature (symbol)
const loggerSignature = Symbol.for("logger");
const rulesApproachC = {
    [loggerSignature.description!]: {
        receive: ["error", "warning"],
    },
};
console.log("Approach C (by signature):", rulesApproachC);
console.log(
    "  Problem: Still string-based, symbols not directly usable as keys",
);

// ============================================================================
// CHALLENGE 2: Matching Strategies
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("CHALLENGE 2: How do we match events to rules?");
console.log("=".repeat(80));

type ReceiveRule = string | RegExp | ((event: EventData) => boolean);

function matchesRule(event: EventData, rule: ReceiveRule): boolean {
    if (typeof rule === "string") {
        // Exact match
        return event.type === rule;
    } else if (rule instanceof RegExp) {
        // Pattern match
        return rule.test(event.type);
    } else if (typeof rule === "function") {
        // Custom predicate
        try {
            return rule(event);
        } catch (err) {
            console.error("Predicate failed:", err);
            return false;
        }
    }
    return false;
}

const testEvent: EventData = {
    type: "user.login",
    payload: { userId: "123" },
    timestamp: Date.now(),
};

console.log("\nTesting matching strategies:");
console.log(
    "  String match 'user.login':",
    matchesRule(testEvent, "user.login"),
);
console.log("  Regex match /^user/:", matchesRule(testEvent, /^user\./));
console.log(
    "  Predicate match:",
    matchesRule(testEvent, (e) => e.type.includes("login")),
);

console.log("\nPerformance concern:");
console.log("  With 10 plugins × 5 rules each × 1000 events/sec");
console.log("  = 50,000 rule checks per second!");

// ============================================================================
// CHALLENGE 3: Two-Stage Filtering (receive + filter)
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("CHALLENGE 3: Receive vs Filter - what's the difference?");
console.log("=".repeat(80));

interface RuleConfig {
    receive?: ReceiveRule[]; // Filter by EVENT TYPE
    filter?: (event: EventData) => boolean; // Filter by EVENT CONTENT
}

function shouldReceiveEvent(event: EventData, config: RuleConfig): boolean {
    // Stage 1: Check if event TYPE matches
    if (config.receive && config.receive.length > 0) {
        let typeMatched = false;
        for (const rule of config.receive) {
            if (matchesRule(event, rule)) {
                typeMatched = true;
                break;
            }
        }
        if (!typeMatched) {
            return false; // Event type not in receive list
        }
    }

    // Stage 2: Check if event CONTENT passes filter
    if (config.filter) {
        try {
            return config.filter(event);
        } catch (err) {
            console.error("Filter error:", err);
            return false;
        }
    }

    return true;
}

const errorRule: RuleConfig = {
    receive: ["error", "warning"],
    filter: (event) => event.payload?.severity > 5, // Only high severity
};

console.log("\nTwo-stage filtering example:");
console.log(
    "Rule:",
    JSON.stringify({
        receive: ["error", "warning"],
        filter: "severity > 5",
    }),
);

const testEvents = [
    { type: "error", payload: { severity: 8 }, timestamp: Date.now() },
    { type: "error", payload: { severity: 3 }, timestamp: Date.now() },
    { type: "info", payload: { severity: 8 }, timestamp: Date.now() },
];

testEvents.forEach((event) => {
    const passes = shouldReceiveEvent(event, errorRule);
    console.log(
        `  Event ${event.type} (severity: ${event.payload.severity}) → ${
            passes ? "✅ PASS" : "❌ BLOCK"
        }`,
    );
});

// ============================================================================
// CHALLENGE 4: The Mysterious "data" Parameter
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("CHALLENGE 4: What is 'data' in filter(event, data)?");
console.log("=".repeat(80));

console.log("\nMVP Spec shows:");
console.log("  filter: (event, data) => data.read().content !== null");
console.log("\nPossible interpretations:");

// Interpretation 1: data is same as event with helper methods
class EventDataWrapper {
    constructor(private event: EventData) {}

    read() {
        return this.event.payload;
    }

    merge(options: { on: string; values: any }) {
        // Merge values into payload at specified path
        if (options.on === "content") {
            this.event.payload = options.values;
        }
    }
}

console.log("  1. data = wrapper around event with methods");
console.log("     Example: data.read() returns event.payload");

// Interpretation 2: data is accumulated state from previous plugins
interface PipelineData {
    original: EventData;
    transformed: any;
    metadata: Record<string, any>;
}

console.log("  2. data = pipeline state (accumulated from plugins)");
console.log("     Example: data has original event + transformations");

// Interpretation 3: Just use event.payload
console.log("  3. SIMPLIFIED: Just use event.payload directly");
console.log("     Example: filter: (event) => event.payload.content !== null");

// ============================================================================
// SOLUTION 1: Simple String-Based Rules
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("SOLUTION 1: Simple Rules (easiest to implement)");
console.log("=".repeat(80));

interface SimpleRules {
    [pluginName: string]: {
        receive: string[]; // Only exact matches
    };
}

class SimpleRuleEngine {
    private rules = new Map<string, string[]>();

    configure(config: SimpleRules) {
        for (const [pluginName, rule] of Object.entries(config)) {
            this.rules.set(pluginName, rule.receive);
        }
    }

    shouldReceive(pluginName: string, eventType: string): boolean {
        const allowedTypes = this.rules.get(pluginName);
        if (!allowedTypes) return true; // No rules = allow all
        return allowedTypes.includes(eventType);
    }
}

const simpleEngine = new SimpleRuleEngine();
simpleEngine.configure({
    logger: { receive: ["error", "warning", "info"] },
    metrics: { receive: ["error", "success"] },
});

console.log("\nSimple rule engine:");
console.log(
    "  logger can receive 'error'?",
    simpleEngine.shouldReceive("logger", "error"),
);
console.log(
    "  logger can receive 'debug'?",
    simpleEngine.shouldReceive("logger", "debug"),
);
console.log(
    "  metrics can receive 'error'?",
    simpleEngine.shouldReceive("metrics", "error"),
);

console.log("\n✅ Pros: Simple, fast, easy to understand");
console.log("❌ Cons: No patterns, no predicates, limited flexibility");

// ============================================================================
// SOLUTION 2: Pattern-Based Rules
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("SOLUTION 2: Pattern-Based Rules (more flexible)");
console.log("=".repeat(80));

interface PatternRules {
    [pluginName: string]: {
        receive: Array<string | RegExp | ((e: EventData) => boolean)>;
        filter?: (event: EventData) => boolean;
    };
}

class PatternRuleEngine {
    private rules = new Map<string, PatternRules[string]>();

    configure(config: PatternRules) {
        for (const [pluginName, rule] of Object.entries(config)) {
            this.rules.set(pluginName, rule);
        }
    }

    shouldReceive(pluginName: string, event: EventData): boolean {
        const config = this.rules.get(pluginName);
        if (!config) return true;

        // Check receive rules
        if (config.receive && config.receive.length > 0) {
            let matched = false;
            for (const rule of config.receive) {
                if (matchesRule(event, rule)) {
                    matched = true;
                    break;
                }
            }
            if (!matched) return false;
        }

        // Check filter
        if (config.filter) {
            try {
                return config.filter(event);
            } catch (err) {
                return false;
            }
        }

        return true;
    }
}

const patternEngine = new PatternRuleEngine();
patternEngine.configure({
    logger: {
        receive: [/^(error|warning)/, "info"],
        filter: (event) => event.payload?.message !== undefined,
    },
    analytics: {
        receive: [(e) => e.type.startsWith("user.")],
    },
});

console.log("\nPattern rule engine:");
const testCase = {
    type: "error.network",
    payload: { message: "Failed" },
    timestamp: Date.now(),
};
console.log("  Event:", testCase.type);
console.log(
    "  logger can receive?",
    patternEngine.shouldReceive("logger", testCase),
);
console.log(
    "  analytics can receive?",
    patternEngine.shouldReceive("analytics", testCase),
);

console.log("\n✅ Pros: Flexible, powerful, supports all patterns");
console.log("❌ Cons: More complex, performance overhead, error-prone");

// ============================================================================
// SOLUTION 3: Plugin-Level Filtering (Alternative)
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("SOLUTION 3: Skip Rules, Use Plugin-Level Filtering");
console.log("=".repeat(80));

const SelectiveLogger = assemblePlugin(
    describePlugin({ name: "selectiveLogger", type: "consumer", opts: null }),
    {
        init(ctx, cfg) {
            ctx.subscribe((event: EventData) => {
                // Plugin decides what to handle
                if (event.type === "error" || event.type === "warning") {
                    console.log(`[LOGGER] ${event.type}:`, event.payload);
                }
                // Ignore all other events
            });
        },
    },
);

console.log("\nPlugin-level filtering:");
console.log("  Plugin contains its own filtering logic");
console.log("  No centralized rules needed");
console.log("  Simple and explicit");

console.log("\n✅ Pros: Simple, explicit, no new API needed");
console.log("❌ Cons: Can't see routing at glance, filtering logic scattered");

// ============================================================================
// RECOMMENDATION
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("RECOMMENDATION: Pragmatic Approach");
console.log("=".repeat(80));

console.log(`
Phase 1: Start with Simple Rules (2-3 hours)
  - String-based matching only
  - Store in Map<pluginName, allowedTypes[]>
  - Easy to implement and debug

Phase 2: Add Patterns If Needed (2-3 hours)
  - Add regex support
  - Add predicate functions
  - Optimize with caching

Phase 3: Add Filters If Needed (1-2 hours)
  - Second-stage content filtering
  - Keep it simple (just check event.payload)

Alternative: Document Plugin-Level Filtering (30 min)
  - Show pattern in examples
  - Create utility helpers
  - Update MVP spec to reflect this choice
`);

console.log("\n" + "=".repeat(80));
console.log("KEY INSIGHT:");
console.log("Rules are about CONTROL FLOW, not BUSINESS LOGIC");
console.log("They're routing config, not the application logic itself");
console.log("=".repeat(80) + "\n");
