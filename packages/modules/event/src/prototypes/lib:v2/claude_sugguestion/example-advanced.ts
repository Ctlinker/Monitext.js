/**
 * @file example-advanced.ts
 *
 * Advanced patterns and techniques for the lib_alt event system.
 * This demonstrates sophisticated use cases and architectural patterns.
 */

import { T } from "@monitext/typson";
import { assemblePlugin, describePlugin } from "../plugin-build";
import { Monitor } from "../bus-impl";
import { EventData } from "../bus-types";

// ============================================================================
// Pattern 1: Event Aggregator (Batching)
// ============================================================================

const aggregatorDescriptor = describePlugin({
    name: "eventAggregator",
    type: "both",
    opts: {
        schema: T.object({
            properties: {
                batchSize: T.number(),
                flushInterval: T.number(),
            },
        }),
        required: true,
    },
});

const EventAggregator = assemblePlugin(aggregatorDescriptor, {
    init(ctx, cfg) {
        const buffer: EventData[] = [];
        let timer: NodeJS.Timeout | null = null;

        const flush = () => {
            if (buffer.length === 0) return;

            ctx.emit({
                type: "events.batch",
                payload: {
                    count: buffer.length,
                    events: [...buffer],
                },
                timestamp: Date.now(),
                metadata: {
                    source: "aggregator",
                    batchId: Math.random().toString(36).substring(7),
                },
            });

            buffer.length = 0; // Clear buffer
        };

        const scheduleFlush = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(flush, cfg.flushInterval);
        };

        // Collect events
        ctx.subscribe((event: EventData) => {
            // Don't aggregate batch events (prevent recursion)
            if (event.type === "events.batch") return;

            buffer.push(event);

            // Flush if batch size reached
            if (buffer.length >= cfg.batchSize) {
                flush();
            } else {
                scheduleFlush();
            }
        });

        // Store for namespace access
        (this as any).flush = flush;
    },
    namespace: {
        alias: "aggregator",
        getHandlers(ctx, cfg) {
            return {
                forceFlush() {
                    (this as any).flush();
                },
            };
        },
    },
});

// ============================================================================
// Pattern 2: Event Router (Conditional Routing)
// ============================================================================

const routerDescriptor = describePlugin({
    name: "eventRouter",
    type: "both",
    opts: {
        schema: T.object({
            routes: T.array(
                T.object({
                    pattern: T.string(),
                    target: T.string(),
                }),
            ),
        }),
        required: true,
    },
});

const EventRouter = assemblePlugin(routerDescriptor, {
    init(ctx, cfg) {
        ctx.subscribe((event: EventData) => {
            for (const route of cfg.routes) {
                const regex = new RegExp(route.pattern);
                if (regex.test(event.type)) {
                    // Route to new event type
                    ctx.emit({
                        type: route.target,
                        payload: event.payload,
                        timestamp: Date.now(),
                        metadata: {
                            ...event.metadata,
                            routedFrom: event.type,
                            router: "eventRouter",
                        },
                    });
                }
            }
        });
    },
    namespace: {
        alias: "router",
        getHandlers(ctx, cfg) {
            return {
                route(eventType: string, payload: any) {
                    const event: EventData = {
                        type: eventType,
                        payload,
                        timestamp: Date.now(),
                    };

                    for (const route of cfg.routes) {
                        const regex = new RegExp(route.pattern);
                        if (regex.test(eventType)) {
                            ctx.emit({
                                type: route.target,
                                payload,
                                timestamp: Date.now(),
                                metadata: {
                                    routedFrom: eventType,
                                    manual: true,
                                },
                            });
                        }
                    }
                },
            };
        },
    },
});

// ============================================================================
// Pattern 3: Event Enricher (Data Augmentation)
// ============================================================================

const enricherDescriptor = describePlugin({
    name: "eventEnricher",
    type: "both",
    opts: {
        schema: T.object({
            enrichers: T.record(T.string(), T.any()),
        }),
        required: true,
    },
});

const EventEnricher = assemblePlugin(enricherDescriptor, {
    init(ctx, cfg) {
        ctx.subscribe((event: EventData) => {
            // Check if this event type has enrichment rules
            const enrichmentKey = Object.keys(cfg.enrichers).find((pattern) =>
                new RegExp(pattern).test(event.type)
            );

            if (enrichmentKey) {
                const enrichmentData = cfg.enrichers[enrichmentKey];

                // Re-emit with enriched data
                ctx.emit({
                    type: `enriched.${event.type}`,
                    payload: {
                        ...event.payload,
                        enrichment: enrichmentData,
                    },
                    timestamp: Date.now(),
                    metadata: {
                        ...event.metadata,
                        enriched: true,
                        enrichmentKey,
                    },
                });
            }
        });
    },
    namespace: {
        alias: "enricher",
        getHandlers(ctx, cfg) {
            return {
                enrich(eventType: string, payload: any) {
                    const enrichmentKey = Object.keys(cfg.enrichers).find((
                        pattern,
                    ) => new RegExp(pattern).test(eventType));

                    if (enrichmentKey) {
                        return {
                            ...payload,
                            enrichment: cfg.enrichers[enrichmentKey],
                        };
                    }
                    return payload;
                },
            };
        },
    },
});

// ============================================================================
// Pattern 4: Circuit Breaker (Fault Tolerance)
// ============================================================================

const circuitBreakerDescriptor = describePlugin({
    name: "circuitBreaker",
    type: "both",
    opts: {
        schema: T.object({
            threshold: T.number(),
            timeout: T.number(),
            monitoredTypes: T.array(T.string()),
        }),
        required: true,
    },
});

const CircuitBreaker = assemblePlugin(circuitBreakerDescriptor, {
    init(ctx, cfg) {
        let state: "closed" | "open" | "half-open" = "closed";
        let failureCount = 0;
        let lastFailureTime = 0;

        const shouldMonitor = (eventType: string): boolean => {
            return cfg.monitoredTypes.some((pattern) =>
                new RegExp(pattern).test(eventType)
            );
        };

        // Monitor for failures
        ctx.subscribe((event: EventData) => {
            if (!shouldMonitor(event.type)) return;

            if (
                event.type.includes("error") || event.type.includes("failure")
            ) {
                failureCount++;
                lastFailureTime = Date.now();

                if (failureCount >= cfg.threshold && state === "closed") {
                    state = "open";
                    ctx.emit({
                        type: "circuit.opened",
                        payload: {
                            failureCount,
                            threshold: cfg.threshold,
                        },
                        timestamp: Date.now(),
                    });

                    // Auto-recovery after timeout
                    setTimeout(() => {
                        state = "half-open";
                        failureCount = 0;
                        ctx.emit({
                            type: "circuit.half-open",
                            payload: {},
                            timestamp: Date.now(),
                        });
                    }, cfg.timeout);
                }
            } else if (state === "half-open") {
                // Success in half-open state closes the circuit
                state = "closed";
                failureCount = 0;
                ctx.emit({
                    type: "circuit.closed",
                    payload: {},
                    timestamp: Date.now(),
                });
            }
        });

        // Store state for namespace access
        (this as any).getState = () => ({
            state,
            failureCount,
            lastFailureTime,
        });
    },
    namespace: {
        alias: "breaker",
        getHandlers(ctx, cfg) {
            return {
                getState() {
                    return (this as any).getState();
                },
                reset() {
                    const stateGetter = (this as any).getState;
                    const currentState = stateGetter();
                    currentState.state = "closed";
                    currentState.failureCount = 0;
                    currentState.lastFailureTime = 0;

                    ctx.emit({
                        type: "circuit.reset",
                        payload: {},
                        timestamp: Date.now(),
                    });
                },
            };
        },
    },
});

// ============================================================================
// Pattern 5: Event Replay System
// ============================================================================

const replayDescriptor = describePlugin({
    name: "eventReplay",
    type: "both",
    opts: {
        schema: T.object({
            maxHistory: T.number(),
            persist: T.boolean(),
        }),
        required: true,
    },
});

const EventReplay = assemblePlugin(replayDescriptor, {
    init(ctx, cfg) {
        const history: EventData[] = [];

        // Record all events
        ctx.subscribe((event: EventData) => {
            history.push({ ...event });

            // Maintain max history size
            if (history.length > cfg.maxHistory) {
                history.shift();
            }
        });

        // Store for namespace access
        (this as any).history = history;
        (this as any).ctx = ctx;
    },
    namespace: {
        alias: "replay",
        getHandlers(ctx, cfg) {
            return {
                getHistory(filter?: { type?: string; since?: number }) {
                    const history = (this as any).history as EventData[];
                    let filtered = [...history];

                    if (filter?.type) {
                        const regex = new RegExp(filter.type);
                        filtered = filtered.filter((e) => regex.test(e.type));
                    }

                    if (filter?.since) {
                        filtered = filtered.filter((e) =>
                            e.timestamp >= filter.since
                        );
                    }

                    return filtered;
                },
                replay(filter?: { type?: string; since?: number }) {
                    const events = this.getHistory(filter);

                    events.forEach((event) => {
                        ctx.emit({
                            ...event,
                            timestamp: Date.now(),
                            metadata: {
                                ...event.metadata,
                                replayed: true,
                                originalTimestamp: event.timestamp,
                            },
                        });
                    });

                    return events.length;
                },
                clear() {
                    const history = (this as any).history as EventData[];
                    history.length = 0;
                },
            };
        },
    },
});

// ============================================================================
// Pattern 6: Event Debouncer
// ============================================================================

const debouncerDescriptor = describePlugin({
    name: "eventDebouncer",
    type: "both",
    opts: {
        schema: T.object({
            delay: T.number(),
            patterns: T.array(T.string()),
        }),
        required: true,
    },
});

const EventDebouncer = assemblePlugin(debouncerDescriptor, {
    init(ctx, cfg) {
        const timers = new Map<string, NodeJS.Timeout>();
        const pendingEvents = new Map<string, EventData>();

        const shouldDebounce = (eventType: string): boolean => {
            return cfg.patterns.some((pattern) =>
                new RegExp(pattern).test(eventType)
            );
        };

        ctx.subscribe((event: EventData) => {
            if (!shouldDebounce(event.type)) return;

            const key = event.type;

            // Clear existing timer
            if (timers.has(key)) {
                clearTimeout(timers.get(key)!);
            }

            // Store the latest event
            pendingEvents.set(key, event);

            // Set new timer
            const timer = setTimeout(() => {
                const pendingEvent = pendingEvents.get(key);
                if (pendingEvent) {
                    ctx.emit({
                        ...pendingEvent,
                        timestamp: Date.now(),
                        metadata: {
                            ...pendingEvent.metadata,
                            debounced: true,
                            originalTimestamp: pendingEvent.timestamp,
                        },
                    });
                    pendingEvents.delete(key);
                }
                timers.delete(key);
            }, cfg.delay);

            timers.set(key, timer);
        });
    },
    namespace: {
        alias: "debouncer",
        getHandlers(ctx, cfg) {
            return {
                flush() {
                    // Not easily accessible from namespace without storing reference
                    console.log("Debouncer flush not yet implemented");
                },
            };
        },
    },
});

// ============================================================================
// Example Usage: Advanced Event Processing Pipeline
// ============================================================================

function runAdvancedExample() {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 Advanced lib_alt Patterns Example");
    console.log("=".repeat(80) + "\n");

    // Create advanced plugin instances
    const aggregator = new EventAggregator({
        batchSize: 5,
        flushInterval: 2000,
    });

    const router = new EventRouter({
        routes: [
            { pattern: "^user\\.", target: "analytics.user" },
            { pattern: "^system\\.", target: "monitoring.system" },
            { pattern: "error", target: "alerting.error" },
        ],
    });

    const enricher = new EventEnricher({
        enrichers: {
            "^user\\.": { system: "user-management", version: "1.0" },
            "^analytics\\.": { system: "analytics", tracked: true },
        },
    });

    const breaker = new CircuitBreaker({
        threshold: 3,
        timeout: 5000,
        monitoredTypes: ["^alerting\\."],
    });

    const replay = new EventReplay({
        maxHistory: 100,
        persist: false,
    });

    const debouncer = new EventDebouncer({
        delay: 1000,
        patterns: ["^user\\.input"],
    });

    // Create monitor
    const monitor = new Monitor({
        plugins: [aggregator, router, enricher, breaker, replay, debouncer],
    });

    console.log("✅ Monitor initialized with advanced plugins\n");

    // Get namespaces
    const namespaces = monitor.namespaces();
    const {
        aggregator: agg,
        router: rt,
        enricher: enr,
        breaker: brk,
        replay: rpl,
    } = namespaces as any;

    // ========================================================================
    // Scenario 1: Event Aggregation
    // ========================================================================

    console.log("📦 Testing Event Aggregation...\n");

    monitor.on("events.batch", (event: EventData) => {
        console.log(`📦 Batch received: ${event.payload.count} events`);
        console.log(`   Batch ID: ${event.metadata?.batchId}`);
    });

    for (let i = 0; i < 3; i++) {
        monitor.emit({
            type: "user.action",
            payload: { action: `action-${i}` },
            timestamp: Date.now(),
        });
    }

    // ========================================================================
    // Scenario 2: Event Routing
    // ========================================================================

    console.log("\n🛣️  Testing Event Routing...\n");

    monitor.on("analytics.user", (event: EventData) => {
        console.log(
            `📊 Analytics received: routed from ${event.metadata?.routedFrom}`,
        );
    });

    monitor.emit({
        type: "user.click",
        payload: { element: "button-submit" },
        timestamp: Date.now(),
    });

    // ========================================================================
    // Scenario 3: Event Enrichment
    // ========================================================================

    console.log("\n✨ Testing Event Enrichment...\n");

    monitor.on("enriched.analytics.user", (event: EventData) => {
        console.log(
            "✨ Enriched event:",
            JSON.stringify(event.payload, null, 2),
        );
    });

    // ========================================================================
    // Scenario 4: Circuit Breaker
    // ========================================================================

    setTimeout(() => {
        console.log("\n⚡ Testing Circuit Breaker...\n");

        monitor.on("circuit.opened", (event: EventData) => {
            console.log("🔴 Circuit OPENED!", event.payload);
        });

        monitor.on("circuit.half-open", (event: EventData) => {
            console.log("🟡 Circuit HALF-OPEN - testing recovery");
        });

        monitor.on("circuit.closed", (event: EventData) => {
            console.log("🟢 Circuit CLOSED - system recovered");
        });

        // Trigger failures
        for (let i = 0; i < 4; i++) {
            monitor.emit({
                type: "alerting.error",
                payload: { error: `Error ${i}` },
                timestamp: Date.now(),
            });
        }

        console.log("Circuit state:", brk.getState());
    }, 1000);

    // ========================================================================
    // Scenario 5: Event Replay
    // ========================================================================

    setTimeout(() => {
        console.log("\n🔁 Testing Event Replay...\n");

        const history = rpl.getHistory({ type: "user\\." });
        console.log(`📚 History contains ${history.length} user events`);

        monitor.on("user.action", (event: EventData) => {
            if (event.metadata?.replayed) {
                console.log(`🔁 Replayed event: ${event.payload.action}`);
            }
        });

        const replayedCount = rpl.replay({ type: "user\\." });
        console.log(`🔁 Replayed ${replayedCount} events`);
    }, 2000);

    // ========================================================================
    // Scenario 6: Event Debouncing
    // ========================================================================

    setTimeout(() => {
        console.log("\n⏱️  Testing Event Debouncing...\n");

        monitor.on("user.input", (event: EventData) => {
            if (event.metadata?.debounced) {
                console.log(`⏱️  Debounced input: ${event.payload.text}`);
            }
        });

        // Rapid-fire events (should debounce to 1)
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                monitor.emit({
                    type: "user.input",
                    payload: { text: `text-${i}` },
                    timestamp: Date.now(),
                });
            }, i * 100);
        }
    }, 3000);

    // ========================================================================
    // Cleanup
    // ========================================================================

    setTimeout(() => {
        console.log("\n🧹 Cleaning up...\n");
        console.log("\n" + "=".repeat(80));
        console.log("✅ Advanced example completed");
        console.log("=".repeat(80) + "\n");
        process.exit(0);
    }, 8000);
}

// Run if executed directly
if (require.main === module) {
    runAdvancedExample();
}

export {
    CircuitBreaker,
    EventAggregator,
    EventDebouncer,
    EventEnricher,
    EventReplay,
    EventRouter,
};
