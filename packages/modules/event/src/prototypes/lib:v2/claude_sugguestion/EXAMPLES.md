# lib_alt Examples Guide

This directory contains example files demonstrating how to use the `lib_alt` event system implementation.

## 📚 Available Examples

### 1. `example-simple.ts` - Quick Start Guide

**Recommended for beginners.**

A minimal example showing the basic setup:
- Creating a simple logger plugin (producer)
- Creating a console output plugin (consumer)
- Setting up a Monitor
- Using plugin namespaces
- Emitting and subscribing to events

**Run it:**
```bash
npx ts-node src/prototypes/lib_alt/example-simple.ts
```

**What you'll learn:**
- Basic plugin creation with `describePlugin()` and `assemblePlugin()`
- Producer vs Consumer plugin types
- Monitor initialization
- Namespace usage
- Event emission and subscription

---

### 2. `example.ts` - Comprehensive Guide

**Recommended for understanding full capabilities.**

A complete example with advanced features:
- Logger plugin with multiple log levels (producer)
- Console writer with colorization (consumer)
- Metrics collector with auto-reporting (both)
- Event filter plugin (both)
- Hook system usage (global and plugin-specific)
- Event handlers and subscriptions
- Namespace methods
- Error handling
- Cleanup patterns

**Run it:**
```bash
npx ts-node src/prototypes/lib_alt/example.ts
```

**What you'll learn:**
- All plugin types: consumer, producer, and both
- Plugin configuration with schemas
- Hook system (emit, receive, general)
- Plugin namespaces with complex APIs
- Metrics tracking
- Event filtering patterns
- Handler subscription/unsubscription

---

## 🏗️ Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                        Monitor                          │
│  - Event routing hub                                    │
│  - Plugin lifecycle management                          │
│  - Hook execution                                       │
│  - Namespace exposure                                   │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
    ┌───▼────┐          ┌───▼────┐
    │ Plugin │          │ Plugin │
    │   A    │          │   B    │
    └────────┘          └────────┘
```

### Plugin Types

1. **Consumer**: Listens to events (e.g., logging to file, sending metrics)
2. **Producer**: Emits events (e.g., HTTP request tracker, sensor reader)
3. **Both**: Listens and emits (e.g., event transformer, filter, aggregator)

---

## 🎯 Common Patterns

### Pattern 1: Creating a Producer Plugin

```typescript
const descriptor = describePlugin({
    name: "myProducer",
    type: "producer",
    opts: {
        schema: T.object({ interval: T.number() }),
        required: true,
    },
});

const MyProducer = assemblePlugin(descriptor, {
    init(ctx, cfg) {
        setInterval(() => {
            ctx.emit({
                type: "my.event",
                payload: { data: "value" },
                timestamp: Date.now(),
            });
        }, cfg.interval);
    },
    namespace: {
        alias: "producer",
        getHandlers(ctx, cfg) {
            return {
                trigger() {
                    ctx.emit({
                        type: "my.manual.event",
                        payload: {},
                        timestamp: Date.now(),
                    });
                },
            };
        },
    },
});
```

### Pattern 2: Creating a Consumer Plugin

```typescript
const descriptor = describePlugin({
    name: "myConsumer",
    type: "consumer",
    opts: null,
});

const MyConsumer = assemblePlugin(descriptor, {
    init(ctx, cfg) {
        // Listen to all events
        ctx.subscribe((event) => {
            console.log(`Received: ${event.type}`);
        });

        // Listen to specific events
        ctx.on("my.event", (event) => {
            console.log("Specific handler:", event.payload);
        });
    },
});
```

### Pattern 3: Creating a Both Plugin

```typescript
const descriptor = describePlugin({
    name: "transformer",
    type: "both",
    opts: null,
});

const Transformer = assemblePlugin(descriptor, {
    init(ctx, cfg) {
        ctx.subscribe((event) => {
            // Transform and re-emit
            ctx.emit({
                type: `transformed.${event.type}`,
                payload: { original: event.payload },
                timestamp: Date.now(),
            });
        });
    },
    namespace: {
        alias: "transform",
        getHandlers(ctx, cfg) {
            return {
                manual(data: any) {
                    ctx.emit({
                        type: "manual.transform",
                        payload: data,
                        timestamp: Date.now(),
                    });
                },
            };
        },
    },
});
```

### Pattern 4: Using Hooks

```typescript
const monitor = new Monitor({ plugins: [...] });

// Global hook - affects all plugins
monitor.hook("my-global-hook", {
    handlers: {
        emit: [(event) => console.log("Emitted:", event.type)],
        receive: [(event) => console.log("Received:", event.type)],
        general: [(event) => event.metadata = { ...event.metadata, hooked: true }],
    },
});

// Plugin-specific hook
monitor.hook("logger-only", {
    handlers: {
        emit: [(event) => console.log("Logger emitted:", event.type)],
    },
    plugins: [loggerPlugin],
});
```

---

## 🔧 Plugin Configuration

### Schema Definition with @monitext/typson

```typescript
import { T } from "@monitext/typson";

// Simple types
T.string()
T.number()
T.boolean()

// Objects
T.object({
    name: T.string(),
    age: T.number(),
})

// Arrays
T.array(T.string())

// Unions
T.union([T.literal("A"), T.literal("B")])

// Optional fields
T.object({
    required: T.string(),
    optional: T.optional(T.string()),
})
```

### Required vs Optional Configuration

```typescript
// Required configuration
const descriptor = describePlugin({
    name: "myPlugin",
    type: "producer",
    opts: {
        schema: T.object({ apiKey: T.string() }),
        required: true, // Must provide config
    },
});

// Plugin instantiation requires config
const plugin = new MyPlugin({ apiKey: "abc123" });

// Optional configuration
const descriptor2 = describePlugin({
    name: "myPlugin2",
    type: "consumer",
    opts: {
        schema: T.object({ debug: T.boolean() }),
        required: false, // Config is optional
    },
});

// Can instantiate with or without config
const plugin2a = new MyPlugin2(null);
const plugin2b = new MyPlugin2({ debug: true });
```

---

## 📊 Event Data Structure

```typescript
interface EventData<T = any> {
    type: string;              // Event identifier (e.g., "user.login")
    payload: T;                // Event data
    timestamp: number;         // Unix timestamp in milliseconds
    metadata?: Record<string, any>;  // Optional metadata
}
```

### Example Events

```typescript
// Simple event
{
    type: "log.info",
    payload: { message: "Hello" },
    timestamp: 1234567890,
}

// Rich event with metadata
{
    type: "user.login",
    payload: { userId: "123", username: "john" },
    timestamp: 1234567890,
    metadata: {
        ip: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        sessionId: "sess-abc",
    },
}
```

---

## 🎨 Namespace API

Namespaces allow plugins to expose methods that can be called directly:

```typescript
// Plugin definition
const MyPlugin = assemblePlugin(descriptor, {
    init(ctx, cfg) {
        // Initialization
    },
    namespace: {
        alias: "myPlugin",  // Access key
        getHandlers(ctx, cfg) {
            return {
                // Public methods
                doSomething() { /* ... */ },
                getValue() { return 42; },
            };
        },
    },
});

// Usage
const monitor = new Monitor({ plugins: [new MyPlugin(config)] });
const { myPlugin } = monitor.namespaces();

myPlugin.doSomething();
const value = myPlugin.getValue();
```

---

## ⚠️ Current Limitations

1. **No Rules System**: The MVP spec's `rules()` method is not yet implemented
2. **Hook API Differences**: Current hook API differs from MVP spec's `onEmit`/`onReceive` pattern
3. **Event Data Methods**: No `data.merge()` or `data.read()` as shown in MVP spec
4. **TypeScript Config**: Compilation errors need resolution (see main README)

---

## 🚀 Next Steps

1. **Try the simple example** to understand basics
2. **Study the comprehensive example** for advanced patterns
3. **Build your own plugin** using the patterns above
4. **Check the type system** - TypeScript provides excellent autocomplete

---

## 💡 Best Practices

1. **Keep plugins focused**: Each plugin should have a single responsibility
2. **Use meaningful event types**: Use namespaced types like `user.login`, `system.error`
3. **Include metadata**: Add context to events with metadata
4. **Handle errors gracefully**: The system logs errors but continues execution
5. **Clean up resources**: Implement cleanup logic in your plugins if needed
6. **Type your payloads**: Use generic types for type-safe event handling
7. **Document your plugins**: Add JSDoc comments to help users understand your plugin API

---

## 📖 Further Reading

- `bus-impl.ts` - Monitor implementation
- `plugin-class.ts` - Plugin base class
- `plugin-types.ts` - Type system documentation
- `connection.ts` - Plugin-bus connection abstraction
- `../../../mvp.md` - Original MVP specification

---

## 🐛 Troubleshooting

### "Plugin already registered" error
Each plugin instance can only be registered once. Create a new instance if you need the same plugin multiple times.

### TypeScript compilation errors
The project has configuration issues. See the main evaluation document for details.

### Namespace not available
Ensure your plugin type is not "consumer" - only "producer" and "both" types support namespaces.

### Events not being received
Check that:
1. Your plugin is registered with the monitor
2. You're subscribing in the `init()` method
3. Event types match exactly (case-sensitive)

---

**Happy coding! 🎉**