/**
 * @file EXAMPLES.ts
 *
 * Comprehensive examples demonstrating the usage of the enhanced event bus library.
 * These examples cover common patterns, advanced use cases, and best practices.
 *
 * NOTE: This file is for documentation purposes. Copy examples to your project as needed.
 */

import { createPlugin, Monitor, T, EventData, createEventData } from "./index";

// ============================================================================
// EXAMPLE 1: Basic Logger Plugin
// ============================================================================

/**
 * A simple logging plugin that subscribes to all events and logs them.
 */
function example1_BasicLogger() {
  // Define configuration schema
  const loggerSchema = T.object({
    properties: {
      level: T.literals({ enum: ["info", "debug", "error"] }),
      format: T.literals({ enum: ["json", "text"] }),
    },
  });

  // Create the logger plugin
  const LoggerPlugin = createPlugin(
    {
      name: "logger",
      type: "consumer",
      opts: loggerSchema,
      optsRequired: true,
    },
    {
      init(ctx, config) {
        // Subscribe to all events
        ctx.subscribe((event) => {
          const timestamp = new Date(event.timestamp).toISOString();

          if (config.format === "json") {
            console.log(
              JSON.stringify({
                level: config.level,
                timestamp,
                type: event.type,
                payload: event.payload,
                metadata: event.metadata,
              })
            );
          } else {
            console.log(
              `[${timestamp}] [${config.level}] ${event.type}:`,
              event.payload
            );
          }
        });
      },
    }
  );

  // Instantiate and use
  const logger = new LoggerPlugin({ level: "info", format: "json" });
  const monitor = new Monitor({ plugins: [logger] });

  return { monitor, logger };
}

// ============================================================================
// EXAMPLE 2: HTTP Client Plugin with Namespace
// ============================================================================

/**
 * An HTTP client plugin that provides a namespace API for making requests
 * and emits events for responses.
 */
function example2_HttpClient() {
  const httpSchema = T.object({
    properties: {
      baseUrl: T.string(),
      timeout: T.number(),
      headers: T.object({ properties: {} }),
    },
  });

  const HttpPlugin = createPlugin(
    {
      name: "http-client",
      type: "both",
      opts: httpSchema,
    },
    {
      init(ctx, config) {
        // Listen for request events from other plugins
        ctx.on("http.request", async (event) => {
          const { method, path, body } = event.payload;
          console.log(`Processing ${method} request to ${path}`);
        });

        // Listen for response events
        ctx.on("http.response", (event) => {
          console.log("Response received:", event.payload.status);
        });
      },
      namespace: {
        alias: "http",
        getHandlers(ctx, config) {
          return {
            async get(path: string, options?: RequestInit) {
              const url = `${config.baseUrl}${path}`;

              try {
                const response = await fetch(url, {
                  ...options,
                  headers: { ...config.headers, ...options?.headers },
                  signal: AbortSignal.timeout(config.timeout),
                });

                const data = await response.json();

                // Emit response event
                await ctx.emit({
                  type: "http.response",
                  payload: { url, status: response.status, data },
                  timestamp: Date.now(),
                  metadata: { method: "GET" },
                });

                return data;
              } catch (error) {
                await ctx.emit({
                  type: "http.error",
                  payload: { url, error: String(error) },
                  timestamp: Date.now(),
                  metadata: { method: "GET" },
                });
                throw error;
              }
            },

            async post(path: string, body: any, options?: RequestInit) {
              const url = `${config.baseUrl}${path}`;

              try {
                const response = await fetch(url, {
                  ...options,
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...config.headers,
                    ...options?.headers,
                  },
                  body: JSON.stringify(body),
                  signal: AbortSignal.timeout(config.timeout),
                });

                const data = await response.json();

                await ctx.emit({
                  type: "http.response",
                  payload: { url, status: response.status, data },
                  timestamp: Date.now(),
                  metadata: { method: "POST" },
                });

                return data;
              } catch (error) {
                await ctx.emit({
                  type: "http.error",
                  payload: { url, error: String(error) },
                  timestamp: Date.now(),
                  metadata: { method: "POST" },
                });
                throw error;
              }
            },

            async delete(path: string, options?: RequestInit) {
              const url = `${config.baseUrl}${path}`;

              try {
                const response = await fetch(url, {
                  ...options,
                  method: "DELETE",
                  headers: { ...config.headers, ...options?.headers },
                  signal: AbortSignal.timeout(config.timeout),
                });

                await ctx.emit({
                  type: "http.response",
                  payload: { url, status: response.status },
                  timestamp: Date.now(),
                  metadata: { method: "DELETE" },
                });

                return response.ok;
              } catch (error) {
                await ctx.emit({
                  type: "http.error",
                  payload: { url, error: String(error) },
                  timestamp: Date.now(),
                  metadata: { method: "DELETE" },
                });
                throw error;
              }
            },
          };
        },
      },
    }
  );

  // Usage
  const httpPlugin = new HttpPlugin({
    baseUrl: "https://api.example.com",
    timeout: 5000,
    headers: { Authorization: "Bearer token123" },
  });

  const monitor = new Monitor({ plugins: [httpPlugin] });
  const { http } = monitor.namespaces();

  // Make requests using the namespace
  // const users = await http.get('/users');
  // await http.post('/users', { name: 'John Doe' });

  return { monitor, httpPlugin, http };
}

// ============================================================================
// EXAMPLE 3: Database Plugin with Connection Pooling
// ============================================================================

/**
 * A database plugin that manages connection pooling and emits events
 * for queries and transactions.
 */
function example3_DatabasePlugin() {
  const dbSchema = T.object({
    properties: {
      host: T.string(),
      port: T.number(),
      database: T.string(),
      poolSize: T.number(),
    },
  });

  const DatabasePlugin = createPlugin(
    {
      name: "database",
      type: "both",
      opts: dbSchema,
    },
    {
      init(ctx, config) {
        console.log(
          `Initializing database connection to ${config.host}:${config.port}`
        );

        // Listen for query events
        ctx.on("db.query", async (event) => {
          console.log("Executing query:", event.payload.sql);
        });

        // Listen for transaction events
        ctx.on("db.transaction.start", (event) => {
          console.log("Transaction started:", event.payload.id);
        });

        ctx.on("db.transaction.commit", (event) => {
          console.log("Transaction committed:", event.payload.id);
        });

        ctx.on("db.transaction.rollback", (event) => {
          console.log("Transaction rolled back:", event.payload.id);
        });
      },
      namespace: {
        alias: "db",
        getHandlers(ctx, config) {
          let queryId = 0;

          return {
            async query(sql: string, params?: any[]) {
              const id = ++queryId;

              await ctx.emit({
                type: "db.query",
                payload: { id, sql, params },
                timestamp: Date.now(),
              });

              // Simulate query execution
              // const result = await pool.query(sql, params);

              await ctx.emit({
                type: "db.query.complete",
                payload: { id, sql, rowCount: 0 },
                timestamp: Date.now(),
              });

              return { rows: [], rowCount: 0 };
            },

            async transaction(
              callback: (tx: any) => Promise<void>
            ): Promise<void> {
              const txId = Math.random().toString(36).substring(7);

              await ctx.emit({
                type: "db.transaction.start",
                payload: { id: txId },
                timestamp: Date.now(),
              });

              try {
                // Execute transaction callback
                await callback({
                  query: async (sql: string, params?: any[]) => {
                    return { rows: [], rowCount: 0 };
                  },
                });

                await ctx.emit({
                  type: "db.transaction.commit",
                  payload: { id: txId },
                  timestamp: Date.now(),
                });
              } catch (error) {
                await ctx.emit({
                  type: "db.transaction.rollback",
                  payload: { id: txId, error: String(error) },
                  timestamp: Date.now(),
                });
                throw error;
              }
            },

            async healthCheck(): Promise<boolean> {
              try {
                // Simulate health check
                return true;
              } catch {
                return false;
              }
            },
          };
        },
      },
    }
  );

  return DatabasePlugin;
}

// ============================================================================
// EXAMPLE 4: Event Hooks - Validation, Timing, and Logging
// ============================================================================

/**
 * Demonstrates various hook patterns for cross-cutting concerns.
 */
function example4_EventHooks() {
  const { monitor } = example1_BasicLogger();

  // Hook 1: Validation - Ensure all events have required fields
  monitor.hook("event-validator", {
    handlers: {
      emit: [
        async (event) => {
          if (!event.type || typeof event.type !== "string") {
            throw new Error("Event must have a valid type");
          }
          if (!event.payload) {
            throw new Error("Event must have a payload");
          }
          if (!event.timestamp || typeof event.timestamp !== "number") {
            throw new Error("Event must have a valid timestamp");
          }
        },
      ],
    },
    meta: {
      description: "Validates event structure before emission",
      priority: 100,
    },
  });

  // Hook 2: Timing - Measure event processing time
  const timings = new Map<string, number>();

  monitor.hook("event-timer", {
    handlers: {
      emit: [
        async (event) => {
          timings.set(event.type, Date.now());
        },
      ],
      receive: [
        async (event) => {
          const startTime = timings.get(event.type);
          if (startTime) {
            const duration = Date.now() - startTime;
            console.log(`Event ${event.type} took ${duration}ms`);
            timings.delete(event.type);
          }
        },
      ],
    },
    meta: {
      description: "Measures event processing time",
      priority: 50,
    },
  });

  // Hook 3: Rate Limiting - Prevent event spam
  const eventCounts = new Map<string, { count: number; resetTime: number }>();

  monitor.hook("rate-limiter", {
    handlers: {
      emit: [
        async (event) => {
          const now = Date.now();
          const key = event.type;
          const limit = 100; // Max 100 events per minute
          const window = 60000; // 1 minute

          const current = eventCounts.get(key);

          if (!current || now > current.resetTime) {
            eventCounts.set(key, {
              count: 1,
              resetTime: now + window,
            });
          } else {
            current.count++;

            if (current.count > limit) {
              console.warn(
                `Rate limit exceeded for event type: ${event.type}`
              );
              throw new Error(`Rate limit exceeded for ${event.type}`);
            }
          }
        },
      ],
    },
    meta: {
      description: "Prevents event spam with rate limiting",
      priority: 90,
    },
  });

  // Hook 4: Event Enrichment - Add metadata
  monitor.hook("event-enricher", {
    handlers: {
      general: [
        async (event) => {
          if (!event.metadata) {
            (event as any).metadata = {};
          }
          event.metadata!.processedAt = Date.now();
          event.metadata!.environment = process.env.NODE_ENV || "development";
        },
      ],
    },
    meta: {
      description: "Enriches events with additional metadata",
    },
  });

  return monitor;
}

// ============================================================================
// EXAMPLE 5: Complex Multi-Plugin System
// ============================================================================

/**
 * A complete system with multiple plugins working together.
 */
async function example5_CompleteSystem() {
  // Create plugins
  const { logger } = example1_BasicLogger();
  const { httpPlugin } = example2_HttpClient();
  const DatabasePlugin = example3_DatabasePlugin();

  const dbPlugin = new DatabasePlugin({
    host: "localhost",
    port: 5432,
    database: "myapp",
    poolSize: 10,
  });

  // Analytics plugin
  const analyticsSchema = T.object({
    properties: {
      apiKey: T.string(),
      batchSize: T.number(),
    },
  });

  const AnalyticsPlugin = createPlugin(
    {
      name: "analytics",
      type: "consumer",
      opts: analyticsSchema,
    },
    {
      init(ctx, config) {
        const eventBatch: EventData[] = [];

        ctx.subscribe((event) => {
          // Collect events for batch processing
          eventBatch.push(event);

          if (eventBatch.length >= config.batchSize) {
            console.log(`Sending ${eventBatch.length} events to analytics`);
            // sendToAnalytics(eventBatch, config.apiKey);
            eventBatch.length = 0; // Clear batch
          }
        });
      },
    }
  );

  const analytics = new AnalyticsPlugin({
    apiKey: "analytics-key-123",
    batchSize: 50,
  });

  // Create monitor with all plugins
  const monitor = new Monitor({
    plugins: [logger, httpPlugin, dbPlugin, analytics],
  });

  // Add hooks
  monitor.hook("system-logger", {
    handlers: {
      emit: [
        async (event) => {
          console.log(`→ Event emitted: ${event.type}`);
        },
      ],
      receive: [
        async (event) => {
          console.log(`← Event received: ${event.type}`);
        },
      ],
    },
    meta: {
      description: "System-wide event flow logger",
    },
  });

  // Subscribe to specific events
  monitor.on("user.login", (event) => {
    console.log("User logged in:", event.payload);
  });

  monitor.on("user.logout", (event) => {
    console.log("User logged out:", event.payload);
  });

  monitor.on("error", (event) => {
    console.error("System error:", event.payload);
  });

  // Access namespaces
  const namespaces = monitor.namespaces();
  console.log("Available namespaces:", Object.keys(namespaces));

  // Monitor statistics
  const stats = monitor.getStats();
  console.log("Monitor Stats:", {
    plugins: stats.plugins,
    subscribers: stats.globalSubscribers,
    handlers: stats.typeSpecificHandlers,
    eventTypes: stats.eventTypes,
  });

  return { monitor, namespaces, stats };
}

// ============================================================================
// EXAMPLE 6: Custom Event Producer Plugin
// ============================================================================

/**
 * A plugin that produces events based on external triggers (e.g., file system).
 */
function example6_FileWatcherPlugin() {
  const fileWatcherSchema = T.object({
    properties: {
      watchPath: T.string(),
      pollInterval: T.number(),
    },
  });

  const FileWatcherPlugin = createPlugin(
    {
      name: "file-watcher",
      type: "producer",
      opts: fileWatcherSchema,
    },
    {
      init(ctx, config) {
        console.log(`Watching directory: ${config.watchPath}`);

        // Simulate file system events
        const interval = setInterval(async () => {
          // In a real implementation, you'd use fs.watch or chokidar
          const randomEvent = Math.random() > 0.5 ? "created" : "modified";

          await ctx.emit({
            type: `file.${randomEvent}`,
            payload: {
              path: `${config.watchPath}/example.txt`,
              size: 1024,
            },
            timestamp: Date.now(),
            metadata: {
              watchPath: config.watchPath,
            },
          });
        }, config.pollInterval);

        // Cleanup would happen here in a real implementation
        // return () => clearInterval(interval);
      },
    }
  );

  return FileWatcherPlugin;
}

// ============================================================================
// EXAMPLE 7: Type-Safe Event Creation and Validation
// ============================================================================

/**
 * Demonstrates type-safe event creation and validation patterns.
 */
function example7_TypeSafeEvents() {
  // Define event payload types
  interface UserLoginPayload {
    userId: string;
    email: string;
    timestamp: number;
  }

  interface DataUpdatePayload {
    entityId: string;
    entityType: "user" | "post" | "comment";
    changes: Record<string, any>;
  }

  // Create type-safe event factory
  function createUserLoginEvent(
    payload: UserLoginPayload
  ): EventData<UserLoginPayload> {
    return createEventData("user.login", payload, {
      source: "auth-service",
      importance: "high",
    });
  }

  function createDataUpdateEvent(
    payload: DataUpdatePayload
  ): EventData<DataUpdatePayload> {
    return createEventData("data.update", payload, {
      source: "data-service",
    });
  }

  // Usage
  const loginEvent = createUserLoginEvent({
    userId: "user-123",
    email: "user@example.com",
    timestamp: Date.now(),
  });

  const updateEvent = createDataUpdateEvent({
    entityId: "post-456",
    entityType: "post",
    changes: { title: "New Title" },
  });

  // Type-safe event handlers
  const { monitor } = example1_BasicLogger();

  monitor.on("user.login", (event: EventData<UserLoginPayload>) => {
    // TypeScript knows the payload type
    console.log(`User ${event.payload.userId} logged in`);
    console.log(`Email: ${event.payload.email}`);
  });

  monitor.on("data.update", (event: EventData<DataUpdatePayload>) => {
    // TypeScript knows the payload type
    console.log(`${event.payload.entityType} updated`);
    console.log(`Changes:`, event.payload.changes);
  });

  return { loginEvent, updateEvent };
}

// ============================================================================
// EXAMPLE 8: Dynamic Plugin Loading
// ============================================================================

/**
 * Demonstrates patterns for dynamic plugin management.
 */
function example8_DynamicPlugins() {
  // Start with minimal plugins
  const { logger } = example1_BasicLogger();
  const monitor = new Monitor({ plugins: [logger] });

  // Function to check if a plugin is loaded
  function isPluginLoaded(pluginClass: any): boolean {
    return monitor.hasPlugin(pluginClass.signature());
  }

  // Function to get plugin info
  function getPluginInfo() {
    return {
      names: monitor.getPluginNames(),
      count: monitor.pluginCount,
      eventTypes: monitor.getEventTypes(),
    };
  }

  console.log("Initial state:", getPluginInfo());

  // Note: In the current implementation, plugins must be added during
  // Monitor construction. This example shows patterns for checking
  // plugin state, which could be extended to support dynamic loading.

  return { monitor, isPluginLoaded, getPluginInfo };
}

// ============================================================================
// EXAMPLE 9: Error Handling Patterns
// ============================================================================

/**
 * Best practices for error handling in the event bus system.
 */
function example9_ErrorHandling() {
  const errorSchema = T.object({
    properties: {
      notifyOnError: T.boolean(),
    },
  });

  const ErrorHandlerPlugin = createPlugin(
    {
      name: "error-handler",
      type: "consumer",
      opts: errorSchema,
    },
    {
      init(ctx, config) {
        // Subscribe to error events
        ctx.on("error", (event) => {
          console.error("Error caught:", event.payload);

          if (config.notifyOnError) {
            // Send notification
            console.log("Sending error notification...");
          }
        });

        // Subscribe to all events and catch errors
        ctx.subscribe(async (event) => {
          try {
            // Process event
            if (event.type.includes("critical")) {
              // Handle critical events specially
              console.log("Processing critical event:", event.type);
            }
          } catch (error) {
            console.error(`Error processing ${event.type}:`, error);
          }
        });
      },
    }
  );

  const errorHandler = new ErrorHandlerPlugin({ notifyOnError: true });
  const monitor = new Monitor({ plugins: [errorHandler] });

  // Add error recovery hook
  monitor.hook("error-recovery", {
    handlers: {
      general: [
        async (event) => {
          try {
            // Process event
          } catch (error) {
            // Emit error event for centralized handling
            console.error("Error in hook, emitting error event");
          }
        },
      ],
    },
    meta: {
      description: "Catches and handles errors in event processing",
    },
  });

  return monitor;
}

// ============================================================================
// EXAMPLE 10: Testing Patterns
// ============================================================================

/**
 * Patterns for testing plugins and event flows.
 */
function example10_TestingPatterns() {
  // Mock plugin for testing
  const mockSchema = T.object({
    properties: {
      mockMode: T.boolean(),
    },
  });

  const MockPlugin = createPlugin(
    {
      name: "mock-plugin",
      type: "both",
      opts: mockSchema,
    },
    {
      init(ctx, config) {
        if (config.mockMode) {
          console.log("Running in mock mode");
        }

        // Store events for inspection
        const receivedEvents: EventData[] = [];

        ctx.subscribe((event) => {
          receivedEvents.push(event);
        });

        // Expose test helpers via closure
        (this as any).getReceivedEvents = () => [...receivedEvents];
        (this as any).clearEvents = () => (receivedEvents.length = 0);
      },
      namespace: {
        alias: "mock",
        getHandlers(ctx, config) {
          return {
            async emitTestEvent(type: string, payload: any) {
              await ctx.emit({
                type,
                payload,
                timestamp: Date.now(),
                metadata: { test: true },
              });
            },
          };
        },
      },
    }
  );

  // Test helper
  function createTestMonitor() {
    const mockPlugin = new MockPlugin({ mockMode: true });
    const monitor = new Monitor({ plugins: [mockPlugin] });

    return {
      monitor,
      mockPlugin,
      async emitTestEvent(type: string, payload: any) {
        const { mock } = monitor.namespaces();
        await mock.emitTestEvent(type, payload);
      },
    };
  }

  // Usage in tests
  const { monitor, emitTestEvent } = createTestMonitor();

  // Spy on events
  const capturedEvents: EventData[] = [];
  monitor.subscribe((event) => {
    capturedEvents.push(event);
  });

  // Emit test event
  // await emitTestEvent('test.event', { data: 'test' });

  // Assert
  console.log("Captured events:", capturedEvents.length);

  return { createTestMonitor };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  example1_BasicLogger,
  example2_HttpClient,
  example3_DatabasePlugin,
  example4_EventHooks,
  example5_CompleteSystem,
  example6_FileWatcherPlugin,
  example7_TypeSafeEvents,
  example8_DynamicPlugins,
  example9_ErrorHandling,
  example10_TestingPatterns,
};

// ============================================================================
// MAIN (for running examples)
// ============================================================================

if (require.main === module) {
  console.log("=".repeat(80));
  console.log("Event Bus Library - Examples");
  console.log("=".repeat(80));

  // Run example
  const { monitor } = example1_BasicLogger();
  console.log("\nMonitor created with", monitor.pluginCount, "plugin(s)");
  console.log("Available plugins:", monitor.getPluginNames());
}
