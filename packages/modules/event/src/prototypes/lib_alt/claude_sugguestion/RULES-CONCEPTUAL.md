# Rules System - Conceptual Breakdown & Implementation Guide

**Understanding what Rules are, why they're hard, and how to implement them**

---

## 🤔 What Are Rules?

The Rules system is a **declarative way to control which events reach which plugins**.

Think of it as a **smart router** or **filter** that sits between the Monitor and each plugin, deciding:
- "Should this plugin receive this event?"
- "Should this event be filtered/transformed before reaching the plugin?"

---

## 📊 Visual Concept

### Without Rules (Current lib_alt)
```
Event Emission
     │
     ▼
┌─────────────┐
│   Monitor   │ ─────► Broadcasts to ALL plugins
└─────────────┘
     │ │ │
     │ │ └───────► Plugin C receives ALL events
     │ └─────────► Plugin B receives ALL events  
     └───────────► Plugin A receives ALL events
```

### With Rules (MVP Spec)
```
Event Emission
     │
     ▼
┌─────────────┐
│   Monitor   │
└─────────────┘
     │
     ▼
┌─────────────┐
│   RULES     │ ◄─── Declarative configuration
│   LAYER     │      Controls event routing
└─────────────┘
     │ │ │
     │ │ └───────► Plugin C: Only "user.*" events
     │ └─────────► Plugin B: Only errors + warnings
     └───────────► Plugin A: ALL events
```

---

## 💡 The MVP Spec Example Decoded

```typescript
bus.rules({
    exportPlugin: {
        receive: [
            "exportFail",           // Exact match
            "e-observableFn",       // Exact match
            (e) => e.type === "test-event",  // Custom predicate
        ],
        filter: (event, data) => data.read().content !== null,
    },
});
```

### What This Means:

**Plugin**: `exportPlugin`

**Receive Rules** (Event Type Filtering):
- Should receive events of type `"exportFail"` 
- Should receive events of type `"e-observableFn"`
- Should receive events where `event.type === "test-event"`
- Should NOT receive any other event types

**Filter Rules** (Content Filtering):
- Even if the event type matches, ALSO check: `data.content !== null`
- If content is null, drop the event (don't send to plugin)

---

## 🎯 Real-World Analogy

Think of Rules like **email filters**:

```typescript
// Email analogy
emailRules({
    inbox: {
        receive: [
            "from:boss@company.com",           // Specific sender
            "subject:URGENT",                   // Specific subject
            (email) => email.priority === "high" // Custom rule
        ],
        filter: (email) => !email.isSpam  // Additional check
    }
});
```

---

## 🧩 Why It's Hard to Implement

### Challenge 1: Plugin Identification
```typescript
bus.rules({
    exportPlugin: { ... }  // How do we map "exportPlugin" to actual plugin instance?
});
```

**Problem**: String name → Plugin instance mapping
- Need to track plugin names/IDs
- Need to match rules to plugins at runtime
- What if multiple plugins have the same name?

**Solution Options**:
```typescript
// Option A: Use plugin name from descriptor
plugin.core.name === "exportPlugin"

// Option B: Use plugin signature (symbol)
plugin.signature() === Symbol.for("exportPlugin")

// Option C: Pass plugin instance directly
bus.rules({
    [exportPluginInstance]: { ... }
});
```

### Challenge 2: Event Matching Logic
```typescript
receive: [
    "exactString",              // String match
    (e) => e.type === "test",  // Predicate function
    /^user\./,                  // Regex? (not in spec but logical)
]
```

**Problem**: Multiple matching strategies
- Strings need exact match
- Functions need execution
- What about regex patterns?
- Performance: Check all rules for every event?

### Challenge 3: Filter vs Receive
```typescript
{
    receive: [...],  // Event TYPE filtering
    filter: (e, data) => ...  // Event CONTENT filtering
}
```

**Problem**: Two-stage filtering
- First check: Does event type match `receive` array?
- Second check: Does event pass `filter` function?
- What's `data`? Is it different from `event`?
- How does `data.read()` work?

### Challenge 4: Performance
```typescript
// For EVERY event emission:
for (const plugin of plugins) {
    const rules = getRulesFor(plugin);
    if (matchesReceiveRules(event, rules.receive)) {
        if (passesFilter(event, rules.filter)) {
            sendToPlugin(plugin, event);
        }
    }
}
```

**Problem**: Rules check on every event
- Could be hundreds/thousands of events per second
- Each event checks rules for each plugin
- Predicate functions execute frequently

---

## 🛠️ Implementation Approaches

### Approach 1: Simple String Matching (Easiest)

```typescript
interface SimpleRules {
    [pluginName: string]: {
        receive: string[];  // Only exact string matches
    };
}

class Monitor {
    private rules = new Map<string, string[]>();

    public rules(config: SimpleRules) {
        for (const [pluginName, rule] of Object.entries(config)) {
            this.rules.set(pluginName, rule.receive);
        }
    }

    private shouldReceiveEvent(plugin: Plugin, event: EventData): boolean {
        const allowedTypes = this.rules.get(plugin.core.name);
        if (!allowedTypes) return true; // No rules = receive all
        return allowedTypes.includes(event.type);
    }
}
```

**Pros**: Simple, fast, easy to understand  
**Cons**: No predicates, no filters, limited flexibility

---

### Approach 2: With Predicates (Medium)

```typescript
type ReceiveRule = string | ((event: EventData) => boolean);

interface Rules {
    [pluginName: string]: {
        receive?: ReceiveRule[];
        filter?: (event: EventData) => boolean;
    };
}

class Monitor {
    private rulesMap = new Map<string, Rules[string]>();

    private matchesReceiveRules(event: EventData, rules?: ReceiveRule[]): boolean {
        if (!rules || rules.length === 0) return true;
        
        for (const rule of rules) {
            if (typeof rule === 'string') {
                if (event.type === rule) return true;
            } else if (typeof rule === 'function') {
                try {
                    if (rule(event)) return true;
                } catch (err) {
                    console.error('Rule predicate failed:', err);
                }
            }
        }
        return false;
    }

    private shouldReceiveEvent(plugin: Plugin, event: EventData): boolean {
        const rules = this.rulesMap.get(plugin.core.name);
        if (!rules) return true;

        // Check receive rules
        if (!this.matchesReceiveRules(event, rules.receive)) {
            return false;
        }

        // Check filter
        if (rules.filter) {
            try {
                return rules.filter(event);
            } catch (err) {
                console.error('Filter failed:', err);
                return false;
            }
        }

        return true;
    }
}
```

**Pros**: Flexible, supports predicates  
**Cons**: Performance overhead, error handling complexity

---

### Approach 3: Plugin Instance Based (Advanced)

```typescript
// Use WeakMap for plugin instance keys
private rulesMap = new WeakMap<Plugin<any>, RuleConfig>();

public rules(config: {
    [K in keyof P]: {
        receive?: ReceiveRule[];
        filter?: (event: EventData) => boolean;
    };
}): void {
    for (const [plugin, ruleConfig] of Object.entries(config)) {
        // Map by plugin instance, not name
        this.rulesMap.set(plugin as any, ruleConfig);
    }
}
```

**Pros**: Type-safe, no name conflicts  
**Cons**: Awkward API, hard to write

---

### Approach 4: Compile Rules to Fast Lookup (Performance)

```typescript
// Pre-compile rules into optimized structure
class RuleEngine {
    private exactMatches = new Map<string, Set<Plugin>>();  // "error" → [pluginA, pluginB]
    private predicates: Array<{ test: Function; plugins: Set<Plugin> }>;

    compile(rules: Rules, plugins: Plugin[]) {
        for (const plugin of plugins) {
            const rule = rules[plugin.core.name];
            if (!rule?.receive) continue;

            for (const receiveRule of rule.receive) {
                if (typeof receiveRule === 'string') {
                    if (!this.exactMatches.has(receiveRule)) {
                        this.exactMatches.set(receiveRule, new Set());
                    }
                    this.exactMatches.get(receiveRule)!.add(plugin);
                } else {
                    this.predicates.push({
                        test: receiveRule,
                        plugins: new Set([plugin])
                    });
                }
            }
        }
    }

    getMatchingPlugins(event: EventData): Set<Plugin> {
        const matches = new Set<Plugin>();

        // Fast exact match lookup
        const exactMatch = this.exactMatches.get(event.type);
        if (exactMatch) {
            exactMatch.forEach(p => matches.add(p));
        }

        // Predicate checks
        for (const { test, plugins } of this.predicates) {
            if (test(event)) {
                plugins.forEach(p => matches.add(p));
            }
        }

        return matches;
    }
}
```

**Pros**: Fast for high-volume events  
**Cons**: Complex, memory overhead

---

## 🎨 Simplified Alternative: Plugin-Level Filtering

Instead of centralized rules, let plugins filter themselves:

```typescript
const SelectiveConsumer = assemblePlugin(
    describePlugin({ name: "selective", type: "consumer", opts: null }),
    {
        init(ctx, cfg) {
            ctx.subscribe((event) => {
                // Plugin decides what to process
                if (event.type === "user.login" || event.type.startsWith("error.")) {
                    // Process this event
                    console.log("Processing:", event.type);
                } else {
                    // Ignore
                    return;
                }
            });
        }
    }
);
```

**Pros**: Simple, explicit, no central rules needed  
**Cons**: Filtering logic in every plugin, can't see routing at glance

---

## 🚀 Recommended Implementation Path

### Phase 1: Start Simple
```typescript
public rules(config: Record<string, { receive: string[] }>) {
    // Only exact string matches
    // Store in Map<pluginName, allowedTypes>
}
```

### Phase 2: Add Predicates
```typescript
receive: Array<string | ((e: EventData) => boolean)>
```

### Phase 3: Add Filters
```typescript
filter?: (event: EventData) => boolean
```

### Phase 4: Optimize (if needed)
```typescript
// Compile rules on rules() call
// Fast lookup during event routing
```

---

## 💭 The "data" Object Mystery

In the MVP spec:
```typescript
filter: (event, data) => data.read().content !== null
```

What's `data`? Possibilities:

### Option 1: `data` = `event`
```typescript
filter: (event, data) => {
    // data is just event with helper methods
    return event.payload.content !== null;
}
```

### Option 2: `data` is a wrapper
```typescript
class EventDataWrapper {
    constructor(private event: EventData) {}
    
    read() {
        return this.event.payload;
    }
    
    merge(options: any) {
        // Transformation logic
    }
}

filter: (event, wrapper) => wrapper.read().content !== null
```

### Option 3: Two separate things
```typescript
// event = EventData
// data = some accumulated/transformed data from previous plugins?
```

**Most Likely**: `data` is the same as `event` but with transformation methods.

---

## 🎯 Your Next Steps

### If You Want Rules:

1. **Clarify the spec** - What exactly is `data`? Same as event?
2. **Start simple** - Implement string matching only
3. **Add complexity** - Predicates, then filters
4. **Test heavily** - Rules bugs are hard to debug

### If You Don't Want Rules:

1. **Document the alternative** - Plugin-level filtering
2. **Provide helper** - Make filtering easy in plugins
3. **Update MVP spec** - Show this is a design choice
4. **Create filter plugin pattern** - Reusable filters

---

## 📝 Example: Rules Implementation (Basic)

```typescript
// In bus-impl.ts

type ReceiveRule = string | ((event: EventData) => boolean);

interface RuleConfig {
    receive?: ReceiveRule[];
    filter?: (event: EventData) => boolean;
}

// Add to Monitor class:
private pluginRules = new Map<string, RuleConfig>();

public rules(config: Record<string, RuleConfig>): void {
    for (const [pluginName, ruleConfig] of Object.entries(config)) {
        this.pluginRules.set(pluginName, ruleConfig);
    }
}

private shouldPluginReceiveEvent(
    pluginName: string,
    event: EventData
): boolean {
    const rules = this.pluginRules.get(pluginName);
    
    // No rules = receive everything
    if (!rules) return true;
    
    // Check receive rules
    if (rules.receive && rules.receive.length > 0) {
        let matched = false;
        
        for (const rule of rules.receive) {
            if (typeof rule === 'string') {
                if (event.type === rule) {
                    matched = true;
                    break;
                }
            } else if (typeof rule === 'function') {
                try {
                    if (rule(event)) {
                        matched = true;
                        break;
                    }
                } catch (err) {
                    console.error(`Rule predicate error for ${pluginName}:`, err);
                }
            }
        }
        
        if (!matched) return false;
    }
    
    // Check filter
    if (rules.filter) {
        try {
            return rules.filter(event);
        } catch (err) {
            console.error(`Filter error for ${pluginName}:`, err);
            return false;
        }
    }
    
    return true;
}

// Modify routeEvent to use rules
private async routeEvent(event: EventData, sourceSignature: symbol): Promise<void> {
    await this.executeHooks("emit", event, sourceSignature);
    
    // Route to global subscribers (bypass rules)
    for (const handler of this.globalSubscribers) {
        try {
            await handler(event);
        } catch (error) {
            console.error("Global subscriber failed:", error);
        }
    }
    
    // Route to specific handlers WITH rules check
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
        for (const handler of handlers) {
            // Find which plugin this handler belongs to
            // (You'd need to track this when handlers are registered)
            const pluginName = this.getPluginNameForHandler(handler);
            
            if (pluginName && !this.shouldPluginReceiveEvent(pluginName, event)) {
                continue; // Skip this handler due to rules
            }
            
            try {
                await handler(event);
            } catch (error) {
                console.error("Handler failed:", error);
            }
        }
    }
    
    await this.executeHooks("receive", event, sourceSignature);
}
```

---

## ✅ Decision Time

**Option A: Implement Rules** (~8-12 hours)
- Add rules() method
- Track plugin → handler mapping
- Implement filtering logic
- Update examples

**Option B: Skip Rules** (~1 hour)
- Document alternative (plugin-level filtering)
- Create FilterPlugin utility
- Update MVP spec to reflect decision
- Show pattern in examples

**Option C: Simplified Rules** (~3-4 hours)
- Only string matching (no predicates)
- Only receive rules (no filters)
- Easier to implement and understand
- Can extend later

---

**My Recommendation**: Start with **Option C** (Simplified Rules), then decide if you need more complexity based on actual usage.
