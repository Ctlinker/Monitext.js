# lib_alt - Event System Prototype

**A sophisticated, type-safe event bus architecture for Monitext.js**

---

## 📖 Overview

`lib_alt` is an alternative implementation of the `@monitext/event` system, featuring a plugin-based architecture inspired by event-driven and I/O patterns. It provides a flexible, multibus-like structure for handling complex data flows with strong TypeScript support.

### Key Features

- 🔌 **Plugin-Based Architecture** - Modular, self-contained event processors
- 🎯 **Three Plugin Types** - Consumer, Producer, and Both for maximum flexibility
- 🪝 **Hook System** - Intercept and transform events at emit/receive points
- 📦 **Type-Safe Configuration** - Schema-based plugin configuration with full type inference
- 🎨 **Namespace API** - Expose plugin methods for external access
- 🔗 **Connection Abstraction** - Clean separation between plugins and the bus
- ⚡ **Async Support** - Promise-based event handling throughout

---

## 🚀 Quick Start

```typescript
import { T } from "@monitext/typson";
import { describePlugin, assemblePlugin } from "./plugin-build";
import { Monitor } from "./bus-impl";

// 1. Create a logger plugin
const Logger = assemblePlugin(
    describePlugin({ name: "logger", type: "producer", opts: null }),
    {
        init(ctx, cfg) {},
        namespace: {
            alias: "log",
            getHandlers(ctx, cfg) {
                return {
                    info: (msg) => ctx.emit({
                        type: "log.info",
                        payload: { msg },
                        timestamp: Date.now()
                    })
                };
            }
        }
    }
);

// 2. Create a consumer plugin
const Console = assemblePlugin(
    describePlugin({ name: "console", type: "consumer", opts: null }),
    {
        init(ctx, cfg) {
            ctx.on("log.info", (e) => console.log(e.payload.msg));
        }
    }
);

// 3. Initialize and use
const monitor = new Monitor({ plugins: [new Logger(null), new Console(null)] });
const { log } = monitor.namespaces();

log.info("Hello, lib_alt!");
```

---

## 📚 Documentation

### Core Files

| File | Purpose |
|------|---------|
| `bus-impl.ts` | Monitor/Bus implementation - event routing hub |
| `plugin-class.ts` | Abstract Plugin base class |
| `plugin-types.ts` | Type system for plugins and contexts |
| `plugin-build.ts` | Factory functions for creating plugins |
| `connection.ts` | Plugin-bus connection abstraction |
| `bus-types.ts` | Event data structures and hook options |

### Examples

| File | Description | Recommended For |
|------|-------------|----------------|
| `example-simple.ts` | Minimal quick-start example | Beginners |
| `example.ts` | Comprehensive feature demonstration | Learning all features |
| `example-advanced.ts` | Advanced patterns (aggregation, routing, etc.) | Production patterns |
| `sample.ts` | Working test/validation sample | Testing setup |

### Guides

- **[EXAMPLES.md](./EXAMPLES.md)** - Complete guide to examples and patterns
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - One-page cheat sheet
- **[../../mvp.md](../../mvp.md)** - Original MVP specification

---

## 🏗️ Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                          Monitor                            │
│  - Manages plugin lifecycle                                 │
│  - Routes events between plugins                            │
│  - Executes hooks (global & plugin-specific)                │
│  - Exposes plugin namespaces                                │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─────► Connection ◄──────┐
               │         (Plugin A)       │
               │                          │
               ├─────► Connection ◄──────┤
               │         (Plugin B)       │
               │                          │
               └─────► Connection ◄──────┘
                         (Plugin C)
```

### Event Flow

```
Producer Plugin                    Monitor                    Consumer Plugin
     │                               │                              │
     │  emit(event)                  │                              │
     ├──────────────────────────────►│                              │
     │                               │                              │
     │                          [Emit Hooks]                        │
     │                               │                              │
     │                       [Route to handlers]                    │
     │                               │                              │
     │                               ├─────────────────────────────►│
     │                               │         receive(event)       │
     │                               │                              │
     │                        [Receive Hooks]                       │
     │                               │                              │
```

---

## 🎯 Plugin Types

### Consumer

**Purpose**: Listens to and processes events

**Capabilities**:
- ✅ Subscribe to all events via `ctx.subscribe()`
- ✅ Subscribe to specific events via `ctx.on()`
- ❌ Cannot emit events
- ❌ Cannot have namespace

**Use Cases**: Logging to file, sending metrics, database writes

```typescript
const Consumer = assemblePlugin(
    describePlugin({ name: "consumer", type: "consumer", opts: null }),
    {
        init(ctx, cfg) {
            ctx.on("user.action", (event) => {
                // Process the event
            });
        }
    }
);
```

### Producer

**Purpose**: Generates and emits events

**Capabilities**:
- ❌ Cannot subscribe to events
- ✅ Can emit events via `ctx.emit()`
- ✅ Can have namespace with public methods

**Use Cases**: Sensors, timers, API clients, user input handlers

```typescript
const Producer = assemblePlugin(
    describePlugin({ name: "producer", type: "producer", opts: null }),
    {
        init(ctx, cfg) {
            // Setup internal state
        },
        namespace: {
            alias: "myProducer",
            getHandlers(ctx, cfg) {
                return {
                    trigger: () => ctx.emit({ type: "event", payload: {}, timestamp: Date.now() })
                };
            }
        }
    }
);
```

### Both

**Purpose**: Listens to events, transforms them, and re-emits

**Capabilities**:
- ✅ Subscribe to events
- ✅ Emit events
- ✅ Can have namespace

**Use Cases**: Event transformers, filters, routers, aggregators

```typescript
const Both = assemblePlugin(
    describePlugin({ name: "both", type: "both", opts: null }),
    {
        init(ctx, cfg) {
            ctx.subscribe((event) => {
                // Transform and re-emit
                ctx.emit({ type: `transformed.${event.type}`, payload: event.payload, timestamp: Date.now() });
            });
        },
        namespace: {
            alias: "transformer",
            getHandlers(ctx, cfg) {
                return { /* methods */ };
            }
        }
    }
);
```

---

## 🪝 Hook System

Hooks allow you to intercept events at various points in their lifecycle.

### Hook Types

| Type | When Executed | Use Case |
|------|---------------|----------|
| `emit` | When event is emitted | Logging, validation, modification before routing |
| `receive` | After routing, before handler | Adding metadata, filtering |
| `general` | Always (catch-all) | Auditing, debugging |

### Global Hooks

Apply to all plugins:

```typescript
monitor.hook("global-logger", {
    handlers: {
        emit: [(event) => console.log("Emitted:", event.type)],
        receive: [(event) => console.log("Received:", event.type)]
    }
});
```

### Plugin-Specific Hooks

Apply only to specific plugins:

```typescript
monitor.hook("logger-audit", {
    handlers: {
        emit: [(event) => {
            if (event.payload?.level === "error") {
                console.log("ERROR LOGGED:", event);
            }
        }]
    },
    plugins: [loggerPlugin]  // Only for this plugin
});
```

---

## 📊 Event Data Structure

```typescript
interface EventData<T = any> {
    type: string;                      // Event identifier (e.g., "user.login")
    payload: T;                        // Event data (any type)
    timestamp: number;                 // Unix timestamp (milliseconds)
    metadata?: Record<string, any>;   // Optional contextual data
}
```

### Best Practices

1. **Use namespaced event types**: `user.login`, `system.error`, `analytics.pageview`
2. **Include rich metadata**: IP addresses, session IDs, user agents, etc.
3. **Type your payloads**: Use TypeScript generics for type safety
4. **Use timestamps**: Always include `Date.now()` for temporal ordering

---

## 🔧 Configuration System

Plugins can accept typed configuration using `@monitext/typson` schemas.

### Schema Definition

```typescript
import { T } from "@monitext/typson";

const schema = T.object({
    apiKey: T.string(),
    timeout: T.number(),
    retries: T.optional(T.number()),
    mode: T.union([T.literal("dev"), T.literal("prod")])
});
```

### Required vs Optional

```typescript
// Required configuration
describePlugin({
    name: "myPlugin",
    type: "producer",
    opts: {
        schema: T.object({ apiKey: T.string() }),
        required: true  // Must provide config
    }
});

const plugin = new MyPlugin({ apiKey: "abc123" });  // ✅

// Optional configuration
describePlugin({
    name: "myPlugin",
    type: "producer",
    opts: {
        schema: T.object({ debug: T.boolean() }),
        required: false  // Config is optional
    }
});

const plugin1 = new MyPlugin(null);              // ✅
const plugin2 = new MyPlugin({ debug: true });   // ✅
```

---

## 🎨 Namespace System

Namespaces expose plugin methods for external access.

### Definition

```typescript
namespace: {
    alias: "logger",  // Access key
    getHandlers(ctx, cfg) {
        return {
            info: (msg) => ctx.emit({ type: "log.info", payload: { msg }, timestamp: Date.now() }),
            error: (msg) => ctx.emit({ type: "log.error", payload: { msg }, timestamp: Date.now() })
        };
    }
}
```

### Usage

```typescript
const monitor = new Monitor({ plugins: [new Logger(config)] });
const { logger } = monitor.namespaces();

logger.info("Application started");
logger.error("Something went wrong");
```

### Type Safety

Namespaces are fully typed using TypeScript's advanced type inference:

```typescript
type Namespaces = ReturnType<typeof monitor.namespaces>;
// Fully typed with autocomplete support!
```

---

## ⚠️ Current Limitations

### Missing from MVP Spec

1. **Rules System** ❌
   - The MVP spec shows `bus.rules()` for controlling event reception
   - Not yet implemented in lib_alt

2. **Hook API Differences** ⚠️
   - MVP spec shows `onEmit(data)` with `data.merge()` methods
   - lib_alt uses array of handlers with different API

3. **Event Data Methods** ❌
   - No `data.read()` or `data.merge()` as shown in spec
   - Events are simple interfaces, not objects with methods

4. **Factory Pattern** ⚠️
   - MVP spec suggests plugins return `[instance, config]` tuples
   - lib_alt uses class-based instantiation

### Technical Issues

1. **TypeScript Configuration** 🔴
   - Compilation errors due to module resolution
   - Target ES version incompatibility
   - See main evaluation for details

2. **No Tests** ⚠️
   - Implementation lacks test coverage
   - Examples serve as validation but not comprehensive tests

---

## 🚀 Running Examples

### Prerequisites

```bash
# From project root
cd packages/modules/event
npm install
```

### Run Examples

```bash
# Simple quick-start
npx ts-node src/prototypes/lib_alt/example-simple.ts

# Comprehensive feature demo
npx ts-node src/prototypes/lib_alt/example.ts

# Advanced patterns
npx ts-node src/prototypes/lib_alt/example-advanced.ts

# Basic validation
npx ts-node src/prototypes/lib_alt/sample.ts
```

**Note**: TypeScript configuration issues may prevent execution. See troubleshooting section.

---

## 🐛 Troubleshooting

### "Cannot find module '@monitext/typson'"

**Solution**: Update `tsconfig.json` to use modern module resolution:

```json
{
    "compilerOptions": {
        "moduleResolution": "node16"
    }
}
```

### "Private identifiers are only available when targeting ECMAScript 2015"

**Solution**: Update target in `tsconfig.json`:

```json
{
    "compilerOptions": {
        "target": "ES2015"
    }
}
```

### "can only be iterated through when using '--downlevelIteration' flag"

**Solution**: Add compiler flag:

```json
{
    "compilerOptions": {
        "downlevelIteration": true
    }
}
```

### Plugin namespace not available

**Check**:
1. Plugin type is `producer` or `both` (not `consumer`)
2. Namespace is defined in plugin implementation
3. Plugin is registered with monitor

---

## 💡 Best Practices

### Plugin Design

1. **Single Responsibility** - Each plugin should do one thing well
2. **Stateless When Possible** - Minimize internal state
3. **Error Handling** - Wrap risky operations in try-catch
4. **Documentation** - Add JSDoc comments for public APIs

### Event Design

1. **Meaningful Types** - Use descriptive, namespaced event types
2. **Consistent Payloads** - Keep payload structure consistent per type
3. **Rich Metadata** - Include context useful for debugging
4. **Avoid Circular Events** - Prevent infinite emit loops

### Monitor Setup

1. **Order Matters** - Plugins process events in registration order
2. **Keep It Lean** - Don't register unnecessary plugins
3. **Use Hooks Wisely** - Hooks add overhead, use sparingly
4. **Test Thoroughly** - Validate plugin interactions

---

## 📈 Performance Considerations

- **Event handlers run synchronously** (unless async)
- **Hooks add overhead** to every event
- **Map/Set iterations** may be slow with many plugins
- **Error handling** doesn't stop propagation (performance-safe)

---

## 🔮 Future Improvements

1. **Implement Rules System** - Allow event filtering per plugin
2. **Align with MVP Spec** - Match API exactly as specified
3. **Add Tests** - Comprehensive unit and integration tests
4. **Fix TypeScript Config** - Resolve compilation errors
5. **Add Disposal** - Plugin cleanup and resource management
6. **Performance Monitoring** - Built-in metrics and profiling
7. **Event Replay** - Time-travel debugging capabilities
8. **Persistence** - Save/load event history

---

## 📄 License

Part of the Monitext.js project. See project root for license information.

---

## 🤝 Contributing

This is a prototype implementation. Contributions should:

1. Maintain type safety
2. Add tests for new features
3. Update documentation
4. Follow existing patterns

---

## 📞 Support

- **Documentation**: See `EXAMPLES.md` and `QUICK-REFERENCE.md`
- **Issues**: Check main Monitext.js repository
- **MVP Spec**: Refer to `../../mvp.md`

---

**Built with ❤️ for the Monitext.js ecosystem**