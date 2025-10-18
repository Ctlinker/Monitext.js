import {
	createErrorEvent,
	createEvent,
	createPlugin,
	Monitor,
} from "./main_claude";
import { T } from "@monitext/typson";

// ============================================================================
// Example 1: Create a Logger Plugin
// ============================================================================

const LoggerSchema = T.object({
	properties: {
		mode: T.literals({ enum: ["json", "pretty"] }),
		prefix: T.string({ default: "[LOG]" }),
	},
	required: ["mode"],
});

const LoggerPlugin = createPlugin(
	{
		name: "logger",
		type: "consumer",
		opts: LoggerSchema,
	},
	{
		init(ctx, cfg) {
			// Subscribe to all events
			ctx.subscribe((event) => {
				if (cfg.mode === "json") {
					console.log(JSON.stringify(event, null, 2));
				} else {
					console.log(`${cfg.prefix} [${event.type}]`, event.payload);
				}
			});

			// Subscribe to specific error events
			ctx.on("error", (event) => {
				console.error("🔴 ERROR CAUGHT:", event.payload);
			});
		},
	},
);

// ============================================================================
// Example 2: Create an Observer Plugin with Namespace
// ============================================================================

const ObserverSchema = T.object({
	properties: {
		captureStack: T.boolean({ default: true }),
		captureArgs: T.boolean({ default: true }),
	},
});

const ObserverPlugin = createPlugin(
	{
		name: "observer",
		type: "both",
		opts: ObserverSchema,
	},
	{
		init(ctx, cfg) {
			console.log("Observer initialized with config:", cfg);

			// Listen for function observation events
			ctx.on("function:call", (event) => {
				console.log("📊 Function called:", event.payload);
			});

			ctx.on("function:error", (event) => {
				console.error("❌ Function error:", event.payload);
			});
		},

		namespace: {
			alias: "obs",
			getHandlers(ctx, cfg) {
				return {
					// Wrap a function to observe its execution
					safe<T extends (...args: any[]) => any>(
						fn: T,
						options?: { name?: string; level?: number },
					): T {
						return ((...args: any[]) => {
							const fnName = options?.name || fn.name ||
								"anonymous";

							// Emit function call event
							ctx.emit(
								createEvent("function:call", {
									function: fnName,
									args: cfg?.captureArgs ? args : undefined,
									timestamp: Date.now(),
								}),
							);

							try {
								const result = fn(...args);

								// Handle promises
								if (result instanceof Promise) {
									return result.catch((error) => {
										ctx.emit(
											createErrorEvent(error, {
												function: fnName,
											}),
										);
										throw error;
									});
								}

								return result;
							} catch (error) {
								// Emit error event
								ctx.emit(
									createErrorEvent(error as Error, {
										function: fnName,
									}),
								);
								throw error;
							}
						}) as T;
					},

					// Track an async operation
					async track<T>(
						name: string,
						fn: () => Promise<T>,
					): Promise<T> {
						const startTime = Date.now();

						ctx.emit(
							createEvent("track:start", {
								name,
								startTime,
							}),
						);

						try {
							const result = await fn();

							ctx.emit(
								createEvent("track:end", {
									name,
									duration: Date.now() - startTime,
									success: true,
								}),
							);

							return result;
						} catch (error) {
							ctx.emit(
								createEvent("track:end", {
									name,
									duration: Date.now() - startTime,
									success: false,
									error: (error as Error).message,
								}),
							);
							throw error;
						}
					},
				};
			},
		},
	},
);

// ============================================================================
// Example 3: Create an Export Plugin
// ============================================================================

const ExportSchema = T.object({
	properties: {
		endpoint: T.string(),
		apiKey: T.string(),
		batchSize: T.number({ default: 10 }),
	},
	required: ["endpoint", "apiKey"],
});

const ExportPlugin = createPlugin(
	{
		name: "export",
		type: "consumer",
		opts: ExportSchema,
	},
	{
		init(ctx, cfg) {
			const eventBuffer: any[] = [];

			// Subscribe to specific events we want to export
			ctx.on("error", (event) => {
				eventBuffer.push(event);
				if (eventBuffer.length >= (cfg?.batchSize || 100)) {
					flush();
				}
			});

			ctx.on("track:end", (event) => {
				eventBuffer.push(event);
				if (eventBuffer.length >= (cfg?.batchSize || 100)) {
					flush();
				}
			});

			function flush() {
				console.log(
					`📤 Exporting ${eventBuffer.length} events to ${cfg.endpoint}`,
				);
				// In real implementation: fetch(cfg.endpoint, { ... })
				eventBuffer.length = 0;
			}

			// Flush every 5 seconds
			setInterval(flush, 5000);
		},
	},
);

// ============================================================================
// Example 4: Setup Monitor with Plugins
// ============================================================================

console.log("\n🚀 Starting Monitor Example\n");

const monitor = new Monitor({
	plugins: [
		new LoggerPlugin({ mode: "pretty", prefix: "[MONITEXT]" }),
		new ObserverPlugin({ captureStack: true, captureArgs: true }),
		new ExportPlugin({
			endpoint: "https://api.monitext.io/events",
			apiKey: "test-key-123",
			batchSize: 5,
		}),
	],
});

console.log(`✅ Monitor initialized with ${monitor.pluginCount} plugins\n`);

// ============================================================================
// Example 5: Set Rules (control which events go to which plugins)
// ============================================================================

monitor.rule(ExportPlugin, {
	receive: [
		"error",
		"track:end",
		(event) => event.type.startsWith("function:"), // Custom filter
	],
	filter: (event, data) => {
		// Only export events with severity >= warning
		return event.severity
			? ["error", "warning", "critical"].includes(event.severity)
			: false;
	},
});

console.log("📋 Rules configured\n");

// ============================================================================
// Example 6: Add Hooks (transform data)
// ============================================================================

monitor.hook("redact-sensitive", {
	onEmit(event) {
		// Redact sensitive information before emitting
		if (event.payload && typeof event.payload === "object") {
			const payload = event.payload as any;
			if (payload.password) payload.password = "***REDACTED***";
			if (payload.apiKey) payload.apiKey = "***REDACTED***";
		}
	},
});

monitor.hook("add-metadata", {
	onReceive(event) {
		// Add metadata when receiving events
		if (!event.metadata) {
			event.metadata = {} as any;
		}
		event.metadata.custom = {
			...event.metadata.custom,
			receivedAt: Date.now(),
		};
	},
});

console.log("🪝 Hooks configured\n");

// ============================================================================
// Example 7: Get Plugin Namespaces
// ============================================================================

const { obs } = monitor.plugins();

console.log("🔧 Got plugin namespaces\n");

// ============================================================================
// Example 8: Use Observer Plugin to Wrap Functions
// ============================================================================

console.log("--- Testing Safe Function Wrapper ---\n");

const add = obs.safe(
	(a: number, b: number) => {
		if (typeof a !== "number" || typeof b !== "number") {
			throw new TypeError("Both arguments must be numbers");
		}
		return a + b;
	},
	{ name: "add" },
);

const divide = obs.safe(
	(a: number, b: number) => {
		if (b === 0) {
			throw new Error("Division by zero");
		}
		return a / b;
	},
	{ name: "divide" },
);

// Test successful calls
console.log("Result of add(5, 3):", add(5, 3));
console.log("Result of divide(10, 2):", divide(10, 2));

// Test error case
try {
	console.log("Attempting divide(10, 0)...");
	divide(10, 0);
} catch (error) {
	console.log("Caught error as expected\n");
}

// ============================================================================
// Example 9: Use Observer Plugin to Track Async Operations
// ============================================================================

console.log("--- Testing Async Tracking ---\n");

async function fetchUserData(userId: string) {
	return obs.track(`fetch-user-${userId}`, async () => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 100));
		if (userId === "invalid") {
			throw new Error("User not found");
		}
		return { id: userId, name: "John Doe" };
	});
}

(async () => {
	try {
		const user = await fetchUserData("123");
		console.log("Fetched user:", user);
	} catch (error) {
		console.log("Failed to fetch user");
	}

	try {
		await fetchUserData("invalid");
	} catch (error) {
		console.log("Failed to fetch invalid user (expected)\n");
	}

	// ============================================================================
	// Example 10: Manually Emit Events
	// ============================================================================

	console.log("--- Testing Manual Event Emission ---\n");

	await monitor.emit(
		createEvent("custom:event", {
			message: "This is a custom event",
			value: 42,
		}),
	);

	await monitor.emit(
		createErrorEvent(new Error("Manual error test"), {
			function: "testFunction",
			file: "example.ts",
			line: 123,
		}),
	);

	// ============================================================================
	// Example 11: Subscribe to Events Directly
	// ============================================================================

	console.log("--- Testing Direct Subscription ---\n");

	monitor.on("custom:important", (event) => {
		console.log("🔔 Received important custom event:", event.payload);
	});

	await monitor.emit(
		createEvent("custom:important", {
			alert: "Something important happened!",
		}),
	);

	// ============================================================================
	// Cleanup
	// ============================================================================

	setTimeout(() => {
		console.log("\n--- Cleaning up ---\n");
		monitor.destroy();
		console.log("✅ Monitor destroyed\n");
	}, 6000);
})();
