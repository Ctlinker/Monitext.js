# lib_alt Quick Reference

**One-page cheat sheet for the `lib_alt` event system.**

---

## 🚀 Quick Start (30 seconds)

```typescript
import { T } from "@monitext/typson";
import { describePlugin, assemblePlugin } from "./plugin-build";
import { Monitor } from "./bus-impl";

// 1. Define plugin
const MyPlugin = assemblePlugin(
    describePlugin({ name: "myPlugin", type: "both", opts: null }),
    {
        init(ctx, cfg) {
            ctx.on("myEvent", (e) => console.log(e.payload));
        },
        namespace: {
            alias: "my",
            getHandlers(ctx, cfg) {
                return {
                    trigger: () => ctx.emit({ type: "myEvent", payload: {}, timestamp: Date.now() })
                };
            }
        }
    }
);

// 2. Create monitor
const monitor = new Monitor({ plugins: [new MyPlugin(null)] });

// 3. Use it
const { my } = monitor.namespaces();
my.trigger();
```

---

## 📦 Plugin Types

| Type | Can Subscribe? | Can Emit? | Has Namespace? |
|------|----------------|-----------|----------------|
| `consumer` | ✅ | ❌ | ❌ |
| `producer` | ❌ | ✅ | ✅ |
| `both` | ✅ | ✅ | ✅ |

---

## 🔨 Creating Plugins

### Basic Structure

```typescript
const descriptor = describePlugin({
    name: "pluginName",        // Unique identifier
    type: "producer",          // consumer | producer | both
    opts: {
        schema: T.object({ /* config */ }),
        required: true         // true | false
    }
});

const Plugin = assemblePlugin(descriptor, {
    init(ctx, cfg) {
        // Initialization code
    },
    namespace: {               // Optional (only for producer/both)
        alias: "pluginAlias",
        getHandlers(ctx, cfg) {
            return { /* public methods */ };
        }
    }
});
```

### Consumer Plugin (Listens Only)

```typescript
const Consumer = assemblePlugin(
    describePlugin({ name: "consumer", type: "consumer", opts: null }),
    {
        init(ctx, cfg) {
            ctx.subscribe((e) => { /* handle all events */ });
            ctx.on("specific", (e) => { /* handle specific type */ });
        }
    }
);
```

### Producer Plugin (Emits Only)

```typescript
const Producer = assemblePlugin(
    describePlugin({ name: "producer", type: "producer", opts: null }),
    {
        init(ctx, cfg) {
            // Setup but don't subscribe
        },
        namespace: {
            alias: "prod",
            getHandlers(ctx, cfg) {
                return {
                    send: (msg) => ctx.emit({ type: "msg", payload: msg, timestamp: Date.now() })
                };
            }
        }
    }
);
```

### Both Plugin (Listens and Emits)

```typescript
const Both = assemblePlugin(
    describePlugin({ name: "both", type: "both", opts: null }),
    {
        init(ctx, cfg) {
            ctx.subscribe((e) => {
                ctx.emit({ type: `transformed.${e.type}`, payload: e.payload, timestamp: Date.now() });
            });
        },
        namespace: {
            alias: "both",
            getHandlers(ctx, cfg) {
                return { /* methods */ };
            }
        }
    }
);
```

---

## 🎯 Monitor API

```typescript
const monitor = new Monitor({ plugins: [...] });

// Emit event
await monitor.emit({ type: "event.type", payload: {}, timestamp: Date.now() });

// Subscribe to all events
monitor.subscribe((event) => { /* ... */ });

// Subscribe to specific event type
monitor.on("event.type", (event) => { /* ... */ });

// Unsubscribe
monitor.unsubscribe(handler);
monitor.off("event.type", handler);

// Get plugin namespaces
const namespaces = monitor.namespaces();
const { myPlugin } = namespaces;

// Add hooks
monitor.hook("hookId", {
    handlers: {
        emit: [(e) => { /* on emit */ }],
        receive: [(e) => { /* on receive */ }],
        general: [(e) => { /* always */ }]
    },
    plugins: [plugin1, plugin2]  // Optional: specific plugins only
});
```

---

## 📊 Event Structure

```typescript
interface EventData<T = any> {
    type: string;                      // "user.login", "system.error"
    payload: T;                        // Your data
    timestamp: number;                 // Date.now()
    metadata?: Record<string, any>;   // Optional context
}
```

**Example:**
```typescript
{
    type: "user.login",
    payload: { userId: "123", username: "john" },
    timestamp: 1234567890,
    metadata: { ip: "192.168.1.1", sessionId: "abc" }
}
```

---

## 🎨 Configuration Schemas

```typescript
import { T } from "@monitext/typson";

// Primitives
T.string()
T.number()
T.boolean()
T.null()
T.undefined()

// Structures
T.object({ key: T.string() })
T.array(T.number())
T.record(T.string(), T.number())

// Combinations
T.union([T.string(), T.number()])
T.intersection([T.object({a: T.string()}), T.object({b: T.number()})])
T.optional(T.string())

// Literals
T.literal("exact-value")
T.literal(42)
```

**Plugin with Config:**
```typescript
const Plugin = assemblePlugin(
    describePlugin({
        name: "myPlugin",
        type: "producer",
        opts: {
            schema: T.object({
                apiKey: T.string(),
                timeout: T.number(),
                debug: T.optional(T.boolean())
            }),
            required: true
        }
    }),
    { init(ctx, cfg) { /* cfg is typed! */ }, namespace: { /* ... */ } }
);

// Usage
const plugin = new Plugin({ apiKey: "key", timeout: 5000 });
```

---

## 🪝 Hooks

### Global Hook (All Plugins)

```typescript
monitor.hook("globalHook", {
    handlers: {
        emit: [(e) => console.log("Emitting:", e.type)],
        receive: [(e) => console.log("Receiving:", e.type)],
        general: [(e) => e.metadata = { ...e.metadata, hooked: true }]
    }
});
```

### Plugin-Specific Hook

```typescript
monitor.hook("specificHook", {
    handlers: {
        emit: [(e) => console.log("Plugin emitted:", e.type)]
    },
    plugins: [myPluginInstance]
});
```

---

## 💡 Common Patterns

### Pattern: Simple Logger

```typescript
const Logger = assemblePlugin(
    describePlugin({ name: "logger", type: "producer", opts: null }),
    {
        init(ctx) { (this as any).ctx = ctx; },
        namespace: {
            alias: "log",
            getHandlers(ctx) {
                return {
                    info: (msg) => ctx.emit({ type: "log.info", payload: { msg }, timestamp: Date.now() }),
                    error: (msg) => ctx.emit({ type: "log.error", payload: { msg }, timestamp: Date.now() })
                };
            }
        }
    }
);
```

### Pattern: Event Filter

```typescript
const Filter = assemblePlugin(
    describePlugin({ name: "filter", type: "both", opts: null }),
    {
        init(ctx) {
            ctx.subscribe((e) => {
                if (e.type.startsWith("allowed.")) {
                    ctx.emit({ ...e, metadata: { ...e.metadata, filtered: true } });
                }
            });
        },
        namespace: { alias: "filter", getHandlers: (ctx) => ({}) }
    }
);
```

### Pattern: Metrics Tracker

```typescript
const Metrics = assemblePlugin(
    describePlugin({ name: "metrics", type: "consumer", opts: null }),
    {
        init(ctx) {
            const counts = new Map<string, number>();
            ctx.subscribe((e) => {
                counts.set(e.type, (counts.get(e.type) || 0) + 1);
            });
            (this as any).counts = counts;
        }
    }
);
```

---

## 📝 Context Methods

### Consumer Context

```typescript
interface ConsumerCtx {
    subscribe(handler: (event: EventData) => void): void;
    on(eventType: string, handler: (event: EventData) => void): void;
}
```

### Producer Context

```typescript
interface ProducerCtx {
    emit(event: EventData): Promise<void>;
}
```

### Both Context

```typescript
type BothCtx = ConsumerCtx & ProducerCtx;
```

---

## ⚠️ Important Notes

1. **Plugin Instances**: Each plugin can only be registered once per monitor
2. **Namespaces**: Only `producer` and `both` types can have namespaces
3. **Error Handling**: Errors in handlers are logged but don't stop event propagation
4. **Async**: All event handlers can be async
5. **Type Safety**: Use TypeScript generics for typed event payloads

---

## 🔍 Debugging Tips

```typescript
// Log all events
monitor.subscribe((e) => console.log("[DEBUG]", e.type, e.payload));

// Track event flow with hooks
monitor.hook("debug", {
    handlers: {
        emit: [(e) => console.log("→", e.type)],
        receive: [(e) => console.log("←", e.type)]
    }
});

// Check plugin registration
console.log("Plugins:", monitor.plugins.length);

// Inspect namespaces
console.log("Namespaces:", Object.keys(monitor.namespaces()));
```

---

## 📚 Next Steps

- **Simple Example**: `example-simple.ts`
- **Full Example**: `example.ts`
- **Advanced Patterns**: `example-advanced.ts`
- **Full Documentation**: `EXAMPLES.md`
- **Type Reference**: `plugin-types.ts`

---

**Happy coding! 🎉**