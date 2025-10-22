/**
 * @file example-simple.ts
 *
 * Quick-start example for the lib_alt event system.
 * This demonstrates the minimal setup needed to get started.
 */

import { T } from "@monitext/typson";
import { assemblePlugin, describePlugin } from "../plugin-build";
import { Monitor } from "../bus-impl";
import { EventData } from "../bus-types";

// ============================================================================
// Step 1: Create a Simple Logger Plugin (Producer)
// ============================================================================

const simpleLoggerDesc = describePlugin({
    name: "simpleLogger",
    type: "producer",
    opts: null, // No configuration needed
});

const SimpleLogger = assemblePlugin(simpleLoggerDesc, {
    init(ctx) {
        // Store context for namespace
        (this as any).ctx = ctx;
    },
    namespace: {
        alias: "log",
        getHandlers(ctx) {
            return {
                info(message: string) {
                    ctx.emit({
                        type: "log.info",
                        payload: { message },
                        timestamp: Date.now(),
                    });
                },
                error(message: string) {
                    ctx.emit({
                        type: "log.error",
                        payload: { message },
                        timestamp: Date.now(),
                    });
                },
            };
        },
    },
});

// ============================================================================
// Step 2: Create a Console Consumer Plugin (Consumer)
// ============================================================================

const consoleDesc = describePlugin({
    name: "console",
    type: "consumer",
    opts: null,
});

const Console = assemblePlugin(consoleDesc, {
    init(ctx) {
        // Listen to all log events
        ctx.on("log.info", (event: EventData) => {
            console.log(`ℹ️  ${event.payload.message}`);
        });

        ctx.on("log.error", (event: EventData) => {
            console.error(`❌ ${event.payload.message}`);
        });
    },
});

// ============================================================================
// Step 3: Initialize Monitor and Use It
// ============================================================================

function main() {
    // Create plugin instances
    const logger = new SimpleLogger(null);
    const consoleOutput = new Console(null);

    // Create monitor with plugins
    const monitor = new Monitor({
        plugins: [logger, consoleOutput],
    });

    // Access plugin namespace
    const { log } = monitor.namespaces();

    // Use the logger
    log.info("Application started");
    log.info("Processing data...");
    log.error("Something went wrong!");

    // Direct monitor emission
    monitor.emit({
        type: "custom.event",
        payload: { data: "Hello World" },
        timestamp: Date.now(),
    });

    // Subscribe to all events
    monitor.subscribe((event: EventData) => {
        console.log(`📡 Event: ${event.type}`);
    });

    // Emit more events to see subscription work
    log.info("Done!");
}

// Run if executed directly
if (require.main === module) {
    main();
}

export { Console, SimpleLogger };
