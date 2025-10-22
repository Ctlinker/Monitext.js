/**
 * @file example.ts
 *
 * Comprehensive example demonstrating the lib_alt event system architecture.
 * This shows practical usage of Monitor, Plugins, Hooks, and Namespaces.
 */

import { T } from "@monitext/typson";
import { assemblePlugin, describePlugin } from "../plugin-build";
import { Monitor } from "../bus-impl";
import { EventData } from "../bus-types";

// ============================================================================
// Example 1: Logger Plugin (Producer)
// ============================================================================

const loggerDescriptor = describePlugin({
    name: "logger",
    type: "producer",
    opts: {
        schema: T.object({
            level: T.union([
                T.literal("debug"),
                T.literal("info"),
                T.literal("warn"),
                T.literal("error"),
            ]),
            prefix: T.string(),
        }),
        required: true,
    },
});

const Logger = assemblePlugin(loggerDescriptor, {
    init(ctx, cfg) {
        // Store context for later use
        (this as any).ctx = ctx;
        (this as any).cfg = cfg;
        console.log(
            `[${cfg.prefix}] Logger initialized with level: ${cfg.level}`,
        );
    },
    namespace: {
        alias: "logger",
        getHandlers(ctx, cfg) {
            return {
                log(
                    message: string,
                    level: "debug" | "info" | "warn" | "error" = "info",
                ) {
                    // Emit a log event
                    ctx.emit({
                        type: "log",
                        payload: { message, level },
                        timestamp: Date.now(),
                        metadata: {
                            prefix: cfg.prefix,
                            source: "logger-plugin",
                        },
                    });
                },
                debug(message: string) {
                    this.log(message, "debug");
                },
                info(message: string) {
                    this.log(message, "info");
                },
                warn(message: string) {
                    this.log(message, "warn");
                },
                error(message: string) {
                    this.log(message, "error");
                },
            };
        },
    },
});

// ============================================================================
// Example 2: Console Writer Plugin (Consumer)
// ============================================================================

const consoleWriterDescriptor = describePlugin({
    name: "consoleWriter",
    type: "consumer",
    opts: {
        schema: T.object({
            colorize: T.boolean(),
            timestamps: T.boolean(),
        }),
        required: false,
    },
});

const ConsoleWriter = assemblePlugin(consoleWriterDescriptor, {
    init(ctx, cfg) {
        const config = cfg || { colorize: false, timestamps: true };

        // Subscribe to all events
        ctx.subscribe((event: EventData) => {
            const timestamp = config.timestamps
                ? `[${new Date(event.timestamp).toISOString()}]`
                : "";

            console.log(
                `${timestamp} [ConsoleWriter] Event: ${event.type}`,
                event.payload,
            );
        });

        // Subscribe to specific log events
        ctx.on("log", (event: EventData) => {
            const { message, level } = event.payload;
            const prefix = event.metadata?.prefix || "LOG";

            if (config.colorize) {
                const colors: Record<string, string> = {
                    debug: "\x1b[36m", // Cyan
                    info: "\x1b[32m", // Green
                    warn: "\x1b[33m", // Yellow
                    error: "\x1b[31m", // Red
                };
                const reset = "\x1b[0m";
                console.log(
                    `${
                        colors[level] || ""
                    }[${prefix}:${level.toUpperCase()}] ${message}${reset}`,
                );
            } else {
                console.log(`[${prefix}:${level.toUpperCase()}] ${message}`);
            }
        });
    },
});

// ============================================================================
// Example 3: Metrics Collector Plugin (Both)
// ============================================================================

const metricsDescriptor = describePlugin({
    name: "metricsCollector",
    type: "both",
    opts: {
        schema: T.object({
            interval: T.number(),
            autoReport: T.boolean(),
        }),
        required: true,
    },
});

const MetricsCollector = assemblePlugin(metricsDescriptor, {
    init(ctx, cfg) {
        const metrics = {
            eventCount: 0,
            eventsByType: new Map<string, number>(),
            lastReport: Date.now(),
        };

        // Consume: Track all events
        ctx.subscribe((event: EventData) => {
            metrics.eventCount++;
            const count = metrics.eventsByType.get(event.type) || 0;
            metrics.eventsByType.set(event.type, count + 1);
        });

        // Store for namespace access
        (this as any).metrics = metrics;
        (this as any).ctx = ctx;

        // Auto-report if enabled
        if (cfg.autoReport) {
            setInterval(() => {
                ctx.emit({
                    type: "metrics.report",
                    payload: {
                        totalEvents: metrics.eventCount,
                        byType: Object.fromEntries(metrics.eventsByType),
                        period: Date.now() - metrics.lastReport,
                    },
                    timestamp: Date.now(),
                    metadata: { source: "metrics-collector" },
                });
                metrics.lastReport = Date.now();
            }, cfg.interval);
        }
    },
    namespace: {
        alias: "metrics",
        getHandlers(ctx, cfg) {
            return {
                getStats() {
                    const metrics = (this as any).metrics;
                    return {
                        total: metrics.eventCount,
                        byType: Object.fromEntries(metrics.eventsByType),
                    };
                },
                reset() {
                    const metrics = (this as any).metrics;
                    metrics.eventCount = 0;
                    metrics.eventsByType.clear();
                    metrics.lastReport = Date.now();
                },
                report() {
                    const metrics = (this as any).metrics;
                    ctx.emit({
                        type: "metrics.report",
                        payload: {
                            totalEvents: metrics.eventCount,
                            byType: Object.fromEntries(metrics.eventsByType),
                            period: Date.now() - metrics.lastReport,
                        },
                        timestamp: Date.now(),
                        metadata: { source: "metrics-collector", manual: true },
                    });
                },
            };
        },
    },
});

// ============================================================================
// Example 4: Event Filter Plugin (Both)
// ============================================================================

const filterDescriptor = describePlugin({
    name: "eventFilter",
    type: "both",
    opts: {
        schema: T.object({
            allowedTypes: T.array(T.string()),
            blockedTypes: T.array(T.string()),
        }),
        required: true,
    },
});

const EventFilter = assemblePlugin(filterDescriptor, {
    init(ctx, cfg) {
        ctx.subscribe((event: EventData) => {
            const isBlocked = cfg.blockedTypes.includes(event.type);
            const isAllowed = cfg.allowedTypes.length === 0 ||
                cfg.allowedTypes.includes(event.type);

            if (!isBlocked && isAllowed) {
                // Re-emit filtered events with metadata
                ctx.emit({
                    ...event,
                    metadata: {
                        ...event.metadata,
                        filtered: true,
                        filterPass: true,
                    },
                });
            }
        });
    },
    namespace: {
        alias: "filter",
        getHandlers(ctx, cfg) {
            return {
                isAllowed(eventType: string): boolean {
                    return (
                        !cfg.blockedTypes.includes(eventType) &&
                        (cfg.allowedTypes.length === 0 ||
                            cfg.allowedTypes.includes(eventType))
                    );
                },
            };
        },
    },
});

// ============================================================================
// Example Usage: Setting up the Monitor
// ============================================================================

function runExample() {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 Starting lib_alt Event System Example");
    console.log("=".repeat(80) + "\n");

    // Create plugin instances
    const loggerPlugin = new Logger({
        level: "info",
        prefix: "APP",
    });

    const consolePlugin = new ConsoleWriter({
        colorize: true,
        timestamps: true,
    });

    const metricsPlugin = new MetricsCollector({
        interval: 5000,
        autoReport: true,
    });

    const filterPlugin = new EventFilter({
        allowedTypes: [], // Allow all
        blockedTypes: ["debug", "trace"], // Block debug and trace
    });

    // Create the monitor with all plugins
    const monitor = new Monitor({
        plugins: [loggerPlugin, consolePlugin, metricsPlugin, filterPlugin],
    });

    console.log("✅ Monitor initialized with 4 plugins\n");

    // Get namespaces for easier access
    const namespaces = monitor.namespaces();
    const { logger, metrics, filter } = namespaces as any;

    // ============================================================================
    // Example: Using Hooks
    // ============================================================================

    console.log("📌 Setting up hooks...\n");

    // Global emit hook - logs all emitted events
    monitor.hook("global-emit-logger", {
        handlers: {
            emit: [
                (event: EventData) => {
                    console.log(`🔷 [HOOK:EMIT] ${event.type} emitted`);
                },
            ],
        },
    });

    // Global receive hook - adds processing timestamp
    monitor.hook("global-receive-processor", {
        handlers: {
            receive: [
                (event: EventData) => {
                    event.metadata = event.metadata || {};
                    event.metadata.processedAt = Date.now();
                },
            ],
        },
    });

    // Plugin-specific hook for the logger
    monitor.hook("logger-audit", {
        handlers: {
            emit: [
                (event: EventData) => {
                    if (event.payload?.level === "error") {
                        console.log("🚨 [AUDIT] Error event detected!");
                    }
                },
            ],
        },
        plugins: [loggerPlugin],
    });

    // ============================================================================
    // Example: Emitting Events
    // ============================================================================

    console.log("📤 Emitting events...\n");

    // Using the logger namespace
    logger.info("Application started successfully");
    logger.warn("This is a warning message");
    logger.error("An error occurred!");

    // Direct emission through monitor
    monitor.emit({
        type: "user.login",
        payload: {
            userId: "user-123",
            username: "john.doe",
        },
        timestamp: Date.now(),
        metadata: {
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0",
        },
    });

    monitor.emit({
        type: "user.action",
        payload: {
            action: "file.upload",
            fileSize: 1024000,
        },
        timestamp: Date.now(),
    });

    // ============================================================================
    // Example: Using Event Handlers
    // ============================================================================

    console.log("\n📥 Setting up custom event handlers...\n");

    // Subscribe to specific event type
    monitor.on("user.login", (event: EventData) => {
        console.log(
            `👤 User logged in: ${event.payload.username} from ${event.metadata?.ip}`,
        );
    });

    // Subscribe to all events
    const globalHandler = (event: EventData) => {
        if (event.type.startsWith("user.")) {
            console.log(`🔔 User-related event: ${event.type}`);
        }
    };
    monitor.subscribe(globalHandler);

    // ============================================================================
    // Example: Metrics and Reporting
    // ============================================================================

    setTimeout(() => {
        console.log("\n📊 Checking metrics...\n");
        const stats = metrics.getStats();
        console.log("Current Statistics:", JSON.stringify(stats, null, 2));

        // Manual report
        metrics.report();

        // Test unsubscribe
        console.log("\n🔌 Testing unsubscribe...");
        const removed = monitor.unsubscribe(globalHandler);
        console.log(`Handler removed: ${removed}`);
    }, 2000);

    // ============================================================================
    // Example: Error Handling
    // ============================================================================

    setTimeout(() => {
        console.log("\n⚠️  Testing error handling...\n");

        // This will trigger the error hook
        logger.error("Critical system failure detected");

        // Emit an event with invalid data to test error handling
        monitor.emit({
            type: "test.error",
            payload: { test: "error handling" },
            timestamp: Date.now(),
        });
    }, 3000);

    // ============================================================================
    // Example: Cleanup
    // ============================================================================

    setTimeout(() => {
        console.log("\n🧹 Cleaning up...\n");

        // Remove specific event handler
        monitor.off("user.login", globalHandler as any);

        console.log("\n" + "=".repeat(80));
        console.log("✅ Example completed successfully");
        console.log("=".repeat(80) + "\n");

        process.exit(0);
    }, 6000);
}

// ============================================================================
// Run the example
// ============================================================================

if (require.main === module) {
    runExample();
}

// ============================================================================
// Export for use in other examples
// ============================================================================

export {
    ConsoleWriter,
    consoleWriterDescriptor,
    EventFilter,
    filterDescriptor,
    Logger,
    loggerDescriptor,
    MetricsCollector,
    metricsDescriptor,
};
