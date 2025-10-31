# MVP Spec vs lib_alt Implementation - Surface API Comparison

**Direct side-by-side comparison of what users actually write**

---

## 🎯 Quick Answer

**Similarity: ~70%**

- ✅ Core concepts are the same (Monitor, Plugins, Hooks, Namespaces)
- ✅ Plugin types and context system match
- ⚠️ API syntax differs significantly
- ❌ Rules system missing entirely
- ⚠️ Hook API structure different
- ⚠️ Plugin instantiation pattern different

---

## 📊 Side-by-Side Comparison

### 1. Plugin Creation

#### MVP Spec (Factory Pattern)
```typescript
import { prettyPrint } from "@monitext/plugins";

// Plugin is a factory function returning [instance, config]
const plugin = prettyPrint({
    mode: "json",
    spacing: 2,
    stdout: (msg, level) => customExport(msg, level),
});
```

#### lib_alt (Class Instantiation)
```typescript
import { assemblePlugin, describePlugin } from "./plugin-build";
import { T } from "@monitext/typson";

// Plugin is a class you build with descriptors
const PrettyPrint = assemblePlugin(
    describePlugin({
        name: "prettyPrint",
        type: "producer",
        opts: {
            schema: T.object({
                mode: T.string(),
                spacing: T.number(),
            }),
            required: true
        }
    }),
    {
        init(ctx, cfg) { /* implementation */ },
        namespace: { alias: "print", getHandlers(ctx, cfg) { /* ... */ } }
    }
);

const plugin = new PrettyPrint({
    mode: "json",
    spacing: 2,
});
```

**Difference**: ⚠️ **SIGNIFICANT** - MVP uses factory functions, lib_alt uses class-based approach

---

### 2. Monitor Initialization

#### MVP Spec
```typescript
const bus = new Monitor({
    plugins: [
        prettyPrint({ mode: "json", spacing: 2 }),
        observer(),
        exportToServer({ encrypt: "rsa" }),
    ],
});
```

#### lib_alt
```typescript
const monitor = new Monitor({
    plugins: [
        new PrettyPrint({ mode: "json", spacing: 2 }),
        new Observer(null),
        new ExportToServer({ encrypt: "rsa" }),
    ],
});
```

**Difference**: ✅ **MINIMAL** - Both use `new Monitor({ plugins: [...] })`
- MVP: Plugins are pre-instantiated by factories
- lib_alt: Plugins are explicitly instantiated with `new`

---

### 3. Namespace Access

#### MVP Spec
```typescript
const { observer: obs } = bus.plugins();

obs.safe(myFunction, { level: 0, name: "TestFn" });
```

#### lib_alt
```typescript
const { observer: obs } = monitor.namespaces();

obs.safe(myFunction, { level: 0, name: "TestFn" });
```

**Difference**: ⚠️ **MINOR** - Method name differs
- MVP: `bus.plugins()`
- lib_alt: `monitor.namespaces()`

---

### 4. Rules System

#### MVP Spec
```typescript
bus.rules({
    exportPlugin: {
        receive: [
            "exportFail",
            "e-observableFn",
            (e) => e.type === "test-event",
        ],
        filter: (event, data) => data.read().content !== null,
    },
});
```

#### lib_alt
```typescript
// ❌ NOT IMPLEMENTED
// No rules() method exists
```

**Difference**: ❌ **CRITICAL** - Entire feature missing

---

### 5. Hook System

#### MVP Spec
```typescript
bus.hook("observer-ip", {
    onEmit(data) {
        data.merge({
            on: "content",
            values: redact({ target: data.content, mode: "dfs" }),
        });
    },
});
```

#### lib_alt
```typescript
monitor.hook("observer-ip", {
    handlers: {
        emit: [
            (event) => {
                // No data.merge() available
                // Direct mutation only
                event.metadata = {
                    ...event.metadata,
                    redacted: true
                };
            }
        ]
    },
    plugins: [observerPlugin]  // Optional: target specific plugins
});
```

**Difference**: ⚠️ **SIGNIFICANT**
- MVP: Single `onEmit` callback with `data.merge()` API
- lib_alt: Array of handlers in `handlers.emit`, no merge API

---

### 6. Event Subscription (Not in MVP mockup, but implied)

#### MVP Spec (Implied)
```typescript
// Not shown in MVP, but context provides:
ctx.subscribe((event) => { /* ... */ });
ctx.on("event-type", (event) => { /* ... */ });
```

#### lib_alt
```typescript
// Same API available both in plugins and on monitor
monitor.subscribe((event) => { /* ... */ });
monitor.on("event-type", (event) => { /* ... */ });

// Unsubscribe also available
monitor.unsubscribe(handler);
monitor.off("event-type", handler);
```

**Difference**: ✅ **IDENTICAL** - API matches expected behavior

---

### 7. Event Emission (Not in MVP mockup, but implied)

#### MVP Spec (Implied)
```typescript
ctx.emit({
    type: "my-event",
    payload: { data: "value" },
    // timestamp and metadata handled automatically?
});
```

#### lib_alt
```typescript
ctx.emit({
    type: "my-event",
    payload: { data: "value" },
    timestamp: Date.now(),  // Explicit
    metadata: { source: "myPlugin" }  // Optional
});
```

**Difference**: ⚠️ **MINOR** - lib_alt requires explicit timestamp

---

## 📋 Feature Comparison Matrix

| Feature | MVP Spec | lib_alt | Match? |
|---------|----------|---------|--------|
| Monitor class | ✅ | ✅ | ✅ YES |
| Plugin system | ✅ | ✅ | ✅ YES |
| Plugin types (consumer/producer/both) | ✅ | ✅ | ✅ YES |
| Namespaces | ✅ `plugins()` | ✅ `namespaces()` | ⚠️ NAME |
| Hooks | ✅ `onEmit` | ✅ `handlers.emit` | ⚠️ API |
| Rules | ✅ `rules()` | ❌ Missing | ❌ NO |
| Factory pattern | ✅ Functions | ❌ Classes | ⚠️ PATTERN |
| Event structure | ✅ | ✅ | ✅ YES |
| Context (subscribe/emit/on) | ✅ | ✅ | ✅ YES |
| Data manipulation (`merge`) | ✅ | ❌ | ❌ NO |
| Plugin configuration | ✅ | ✅ | ✅ YES |

---

## 🔍 Detailed Differences

### 1. Plugin Instantiation Pattern

**MVP Expectation**:
```typescript
// Import pre-built plugins
import { observer, prettyPrint } from "@monitext/plugins";

// Just call them
const obs = observer();
const printer = prettyPrint({ mode: "json" });
```

**lib_alt Reality**:
```typescript
// Build plugins yourself
const Observer = assemblePlugin(
    describePlugin({ name: "observer", type: "both", opts: null }),
    { init(ctx, cfg) { /* ... */ }, namespace: { /* ... */ } }
);

// Instantiate with new
const obs = new Observer(null);
```

**Impact**: 🔴 **High** - Developer experience significantly different

---

### 2. Rules System

**MVP Expectation**:
```typescript
// Control which events each plugin receives
bus.rules({
    myPlugin: {
        receive: ["event1", "event2", (e) => e.type.startsWith("user.")],
        filter: (event, data) => data.payload.important === true,
    },
});
```

**lib_alt Reality**:
```typescript
// ❌ No equivalent
// Workaround: Create filter plugin
const filter = new EventFilter({
    allowedTypes: ["event1", "event2"],
    blockedTypes: []
});
```

**Impact**: 🔴 **Critical** - Core architectural feature missing

---

### 3. Hook API

**MVP Expectation**:
```typescript
bus.hook("myHook", {
    onEmit(data) {
        // data object with methods
        data.merge({ on: "field", values: newValues });
        const content = data.read().content;
    },
    onReceive(data) {
        // Similar API
    }
});
```

**lib_alt Reality**:
```typescript
monitor.hook("myHook", {
    handlers: {
        emit: [
            (event) => {
                // Plain event object, no methods
                event.payload = { ...event.payload, modified: true };
                event.metadata = { ...event.metadata, hooked: true };
            }
        ],
        receive: [ /* array of handlers */ ],
        general: [ /* catch-all */ ]
    }
});
```

**Impact**: 🟡 **Medium** - Same purpose, different API surface

---

### 4. Namespace Method Name

**MVP Expectation**:
```typescript
const namespaces = bus.plugins();
```

**lib_alt Reality**:
```typescript
const namespaces = monitor.namespaces();
```

**Impact**: 🟢 **Low** - Simple rename, easy to adjust

---

### 5. Event Data Object

**MVP Expectation**:
```typescript
// Data object with methods
interface EventData {
    type: string;
    payload: any;
    merge(options: MergeOptions): void;
    read(): { content: any };
    // Other transformation methods?
}
```

**lib_alt Reality**:
```typescript
// Plain interface, no methods
interface EventData<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    metadata?: Record<string, any>;
}
```

**Impact**: 🟡 **Medium** - Less convenient but more transparent

---

## 💡 Key Insights

### What's the Same (70%)
1. ✅ **Core architecture** - Monitor + Plugins pattern
2. ✅ **Plugin types** - consumer/producer/both system
3. ✅ **Context API** - subscribe/emit/on methods
4. ✅ **Namespaces** - Exposing plugin methods
5. ✅ **Hooks** - Intercepting events (different API)
6. ✅ **Configuration** - Type-safe plugin config
7. ✅ **Type safety** - Strong TypeScript support

### What's Different (30%)
1. ⚠️ **Plugin pattern** - Classes vs factories
2. ❌ **Rules system** - Completely missing
3. ⚠️ **Hook API** - Different structure
4. ⚠️ **Event data** - No methods (merge/read)
5. ⚠️ **Method names** - plugins() vs namespaces()

---

## 🎯 Migration Effort

### To align lib_alt with MVP spec:

#### Easy (< 1 hour)
- Rename `namespaces()` to `plugins()`
- Make timestamp optional with default

#### Medium (2-4 hours)
- Wrap plugins in factory functions
- Align hook API structure (`onEmit` vs `handlers.emit`)
- Add `data.merge()` and `data.read()` methods

#### Hard (8+ hours)
- Implement complete Rules system
- Refactor plugin instantiation pattern
- Update all examples and documentation

---

## 📊 Compatibility Score

| Aspect | Score | Notes |
|--------|-------|-------|
| Conceptual | 95% | Core ideas match perfectly |
| API Surface | 65% | Significant syntax differences |
| Features | 70% | Rules system missing |
| Developer Experience | 60% | More verbose, different patterns |
| Type Safety | 90% | Both excellent, slightly different approaches |
| **Overall** | **70%** | Good foundation, needs alignment |

---

## 🚀 Recommendations

### For Production Use

**If you want MVP-compliant API**:
1. Implement Rules system first (critical)
2. Add data transformation methods (merge/read)
3. Create factory wrapper functions
4. Rename `namespaces()` to `plugins()`

**If you prefer lib_alt approach**:
1. Update MVP spec to match implementation
2. Document why classes are better than factories
3. Explain alternative to Rules (filter plugins)
4. Keep current cleaner event data structure

---

## 🤔 Design Philosophy Differences

### MVP Spec Philosophy
- **Magic over explicit** - Factories hide complexity
- **Rich objects** - Events have transformation methods
- **Declarative rules** - Rules() method for routing
- **Convenience** - Single callbacks instead of arrays

### lib_alt Philosophy
- **Explicit over magic** - Clear class instantiation
- **Simple data** - Plain objects, manual transformation
- **Compositional rules** - Build filter plugins instead
- **Flexibility** - Handler arrays for multiple hooks

---

## ✅ Bottom Line

**Your implementation captures the SPIRIT of the MVP (95%) but differs significantly in SYNTAX (65%).**

The core architecture is sound and actually has some advantages (explicit instantiation, simpler event objects, flexible hooks). However, if you want to match the MVP spec exactly, you'll need to:

1. **Add Rules system** (biggest gap)
2. **Align hook API** (onEmit vs handlers)
3. **Add event methods** (merge/read)
4. **Wrap in factories** (optional, architectural choice)

**Estimated effort to full compliance**: 12-16 hours of focused work.

---

**Verdict**: lib_alt is a **solid alternative implementation** with different but valid design choices. Whether to align with MVP spec or update the spec to match lib_alt depends on your priorities.