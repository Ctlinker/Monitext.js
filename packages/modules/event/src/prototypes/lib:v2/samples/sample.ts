/**
 * @file sample.ts
 *
 * Working sample demonstrating lib_alt event system basics.
 * This file serves as a quick test and validation of the implementation.
 */

import { T } from "@monitext/typson";
import { assemblePlugin, describePlugin } from "../plugin-build";
import { Monitor } from "../bus-impl";
import { EventData } from "../bus-types";

// ============================================================================
// Sample Plugin 1: Pretty Printer (Producer + Namespace)
// ============================================================================

const prettyPrinterDescriptor = describePlugin({
	name: "prettyPrinter",
	type: "both",
	opts: {
		schema: T.object({
			properties: {
				prefix: T.string(),
				colorize: T.boolean(),
			},
		}),
		required: false,
	},
});

const PrettyPrinter = assemblePlugin(prettyPrinterDescriptor, {
	init(ctx, cfg) {
		const config = cfg || { prefix: "LOG", colorize: false };

		// Subscribe to log events
		ctx.on("log", (event: EventData) => {
			const message = event.payload?.message || "No message";
			const level = event.payload?.level || "info";

			if (config.colorize) {
				const colors: Record<string, string> = {
					debug: "\x1b[36m",
					info: "\x1b[32m",
					warn: "\x1b[33m",
					error: "\x1b[31m",
				};
				console.log(
					`${
						colors[level] || ""
					}\x1b[1m[${config.prefix}]\x1b[0m ${message}`,
				);
			} else {
				console.log(`[${config.prefix}] ${message}`);
			}
		});
	},
	namespace: {
		alias: "printer",
		getHandlers(ctx, _cfg) {
			return {
				async print(message: string, level: string = "info") {
					await ctx.emit({
						type: "log",
						payload: { message, level },
						timestamp: Date.now(),
					});
				},
				async debug(message: string) {
					await this.print(message, "debug");
				},
				async info(message: string) {
					await this.print(message, "info");
				},
				async warn(message: string) {
					await this.print(message, "warn");
				},
				async error(message: string) {
					await this.print(message, "error");
				},
			};
		},
	},
});

// ============================================================================
// Sample Plugin 2: Event Counter (Consumer)
// ============================================================================

const eventCounterDescriptor = describePlugin({
	name: "eventCounter",
	type: "consumer",
	opts: null,
});

const EventCounter = assemblePlugin(eventCounterDescriptor, {
	init(ctx, _cfg) {
		let count = 0;

		ctx.subscribe((_event: EventData) => {
			count++;
			if (count % 5 === 0) {
				console.log(`📊 Event counter: ${count} events processed`);
			}
		});
	},
});

// ============================================================================
// Sample Plugin 3: Event Broadcaster (Both)
// ============================================================================

const broadcasterDescriptor = describePlugin({
	name: "broadcaster",
	type: "both",
	opts: {
		schema: T.object({
			properties: {
				prefix: T.string(),
			},
		}),
		required: true,
	},
});

const Broadcaster = assemblePlugin(broadcasterDescriptor, {
	init(ctx, cfg) {
		// Listen to all events and broadcast them with a prefix
		ctx.subscribe((event: EventData) => {
			if (!event.type.startsWith(cfg.prefix)) {
				ctx.emit({
					type: `${cfg.prefix}.${event.type}`,
					payload: event.payload,
					timestamp: Date.now(),
					metadata: {
						...event.metadata,
						broadcasted: true,
						originalType: event.type,
					},
				});
			}
		});
	},
	namespace: {
		alias: "broadcast",
		getHandlers(ctx, cfg) {
			return {
				async send(eventType: string, payload: any) {
					await ctx.emit({
						type: `${cfg.prefix}.${eventType}`,
						payload,
						timestamp: Date.now(),
					});
				},
			};
		},
	},
});

// ============================================================================
// Sample Usage
// ============================================================================

async function runSample() {
	console.log("\n" + "=".repeat(60));
	console.log("🧪 lib_alt Sample - Testing Basic Functionality");
	console.log("=".repeat(60) + "\n");

	// Create plugin instances
	const printer = new PrettyPrinter({ prefix: "SAMPLE", colorize: true });
	const counter = new EventCounter(null);
	const broadcaster = new Broadcaster({ prefix: "broadcast" });

	// Initialize monitor
	const monitor = new Monitor({
		plugins: [printer, counter, broadcaster],
	});

	console.log("✅ Monitor created with 3 plugins\n");

	// Get namespaces
	const namespaces = monitor.namespaces();
	const { printer: log, broadcast } = namespaces;

	// ========================================================================
	// Test 1: Basic logging through namespace
	// ========================================================================

	console.log("📝 Test 1: Basic Logging\n");
	await log.info("Sample initialized successfully");
	await log.debug("Debug information");
	await log.warn("This is a warning");
	await log.error("Error demonstration");

	// ========================================================================
	// Test 2: Direct monitor emission
	// ========================================================================

	console.log("\n📤 Test 2: Direct Monitor Emission\n");

	await monitor.emit({
		type: "user.action",
		payload: { action: "click", element: "button" },
		timestamp: Date.now(),
	});

	// ========================================================================
	// Test 3: Event broadcasting
	// ========================================================================

	console.log("\n📡 Test 3: Event Broadcasting\n");

	// Subscribe to broadcast events
	monitor.on("broadcast.custom", (event: EventData) => {
		console.log("🔔 Received broadcast event:", event.payload);
	});

	await broadcast.send("custom", { data: "Hello from broadcaster!" });

	// ========================================================================
	// Test 4: Hooks
	// ========================================================================

	console.log("\n🪝 Test 4: Hook System\n");

	monitor.hook("sample-hook", {
		handlers: {
			emit: [
				(event: EventData) => {
					console.log(`🔷 [HOOK] Event emitted: ${event.type}`);
				},
			],
			receive: [
				(event: EventData) => {
					// Add metadata to all received events
					event.metadata = event.metadata || {};
					event.metadata.processedBy = "sample-hook";
				},
			],
		},
	});

	await log.info("Testing hooks - this should trigger the hook");

	// ========================================================================
	// Test 5: Subscription and unsubscription
	// ========================================================================

	console.log("\n📥 Test 5: Subscription Management\n");

	const handler = (event: EventData) => {
		console.log(`👂 Custom handler received: ${event.type}`);
	};

	monitor.subscribe(handler);
	await monitor.emit({
		type: "test.subscription",
		payload: { test: true },
		timestamp: Date.now(),
	});

	const removed = monitor.unsubscribe(handler);
	console.log(`🔌 Handler removed: ${removed}`);

	// ========================================================================
	// Test 6: Multiple events to test counter
	// ========================================================================

	console.log("\n🔢 Test 6: Event Counter\n");

	for (let i = 1; i <= 12; i++) {
		await monitor.emit({
			type: "test.batch",
			payload: { index: i },
			timestamp: Date.now(),
		});
	}

	// ========================================================================
	// Test 7: Plugin-specific hooks
	// ========================================================================

	console.log("\n🎯 Test 7: Plugin-Specific Hooks\n");

	monitor.hook("printer-audit", {
		handlers: {
			emit: [
				(event: EventData) => {
					if (event.payload?.level === "error") {
						console.log("🚨 [AUDIT] Error logged via printer!");
					}
				},
			],
		},
		plugins: [printer],
	});

	await log.error("Audited error message");

	// ========================================================================
	// Summary
	// ========================================================================

	setTimeout(() => {
		console.log("\n" + "=".repeat(60));
		console.log("✅ Sample completed successfully!");
		console.log("=".repeat(60) + "\n");

		console.log("📊 Summary:");
		console.log("  - Created Monitor with 3 plugins");
		console.log("  - Tested namespace API");
		console.log("  - Tested direct event emission");
		console.log("  - Tested broadcasting pattern");
		console.log("  - Tested global and plugin-specific hooks");
		console.log("  - Tested subscription management");
		console.log("  - Tested event batching and counting");
		console.log("\n💡 See example.ts and example-advanced.ts for more!\n");
	}, 100);
}

// Run if executed directly
if (require.main === module) {
	runSample();
}

// Export for use in tests
export { Broadcaster, EventCounter, PrettyPrinter };
