# lib_alt Examples - Summary

**Complete guide to all example files created for the lib_alt event system**

---

## 📋 Overview

Four comprehensive example files have been created to demonstrate the lib_alt event system, ranging from simple quick-starts to advanced production patterns. Each example is self-contained and runnable.

**Total Examples**: 4 files  
**Total Lines of Code**: ~1,600 lines  
**Coverage**: All core features + advanced patterns

---

## 🎯 Examples at a Glance

| File | Level | Lines | Time | Features |
|------|-------|-------|------|----------|
| `example-simple.ts` | Beginner | ~120 | 5 min | Basic setup |
| `sample.ts` | Intermediate | ~320 | 10 min | All core features |
| `example.ts` | Advanced | ~480 | 15 min | Complete showcase |
| `example-advanced.ts` | Expert | ~680 | 20 min | Production patterns |

---

## 📄 File Details

### 1. example-simple.ts 👶

**Purpose**: Absolute minimal quick-start for new users

**What's Included**:
- ✅ Simple logger plugin (producer)
- ✅ Console output plugin (consumer)
- ✅ Basic Monitor setup
- ✅ Namespace usage
- ✅ Event emission
- ✅ Event subscription

**Plugins Demonstrated**:
1. `SimpleLogger` - Basic producer with namespace
2. `Console` - Basic consumer that prints to console

**Complexity**: Very Low  
**Best For**: First-time users, getting started quickly

**Run Command**:
```bash
npx ts-node src/prototypes/lib_alt/example-simple.ts
```

**Expected Output**:
```
ℹ️  Application started
ℹ️  Processing data...
❌ Something went wrong!
📡 Event: custom.event
📡 Event: log.info
ℹ️  Done!
📡 Event: log.info
```

---

### 2. sample.ts 🧪

**Purpose**: Validation and testing of core features

**What's Included**:
- ✅ Pretty printer with colorization (both)
- ✅ Event counter (consumer)
- ✅ Broadcaster plugin (both)
- ✅ All Monitor API methods
- ✅ Hook system (global & plugin-specific)
- ✅ Subscription management
- ✅ Event batching

**Plugins Demonstrated**:
1. `PrettyPrinter` - Colorized log output with namespace
2. `EventCounter` - Tracks event count
3. `Broadcaster` - Republishes events with prefix

**Tests Included**:
- Test 1: Basic Logging
- Test 2: Direct Monitor Emission
- Test 3: Event Broadcasting
- Test 4: Hook System
- Test 5: Subscription Management
- Test 6: Event Counter
- Test 7: Plugin-Specific Hooks

**Complexity**: Medium  
**Best For**: Understanding all core features, validation

**Run Command**:
```bash
npx ts-node src/prototypes/lib_alt/sample.ts
```

**Expected Output**:
```
🧪 lib_alt Sample - Testing Basic Functionality
✅ Monitor created with 3 plugins

📝 Test 1: Basic Logging
[SAMPLE] Sample initialized successfully
[SAMPLE] Debug information
[SAMPLE] This is a warning
[SAMPLE] Error demonstration

📤 Test 2: Direct Monitor Emission
[SAMPLE] ...

🪝 Test 4: Hook System
🔷 [HOOK] Event emitted: log
...

📊 Summary:
  - Created Monitor with 3 plugins
  - Tested namespace API
  - Tested hooks
  - Tested subscription management
```

---

### 3. example.ts 📚

**Purpose**: Comprehensive demonstration of all features

**What's Included**:
- ✅ Logger with multiple log levels (producer)
- ✅ Console writer with colorization (consumer)
- ✅ Metrics collector with auto-reporting (both)
- ✅ Event filter (both)
- ✅ Global hooks
- ✅ Plugin-specific hooks
- ✅ Custom event handlers
- ✅ Metrics and reporting
- ✅ Error handling
- ✅ Cleanup patterns

**Plugins Demonstrated**:
1. `Logger` - Full-featured logger with levels
   - Methods: `log()`, `debug()`, `info()`, `warn()`, `error()`
   - Configuration: log level, prefix
   
2. `ConsoleWriter` - Colorized console output
   - Configuration: colorize, timestamps
   - Subscribes to all events + specific log events
   
3. `MetricsCollector` - Event tracking and reporting
   - Methods: `getStats()`, `reset()`, `report()`
   - Auto-reporting every N seconds
   
4. `EventFilter` - Filter events by type
   - Methods: `isAllowed()`
   - Configuration: allowed/blocked types

**Scenarios Covered**:
1. Using namespace methods
2. Direct monitor emission
3. Setting up hooks (global)
4. Setting up hooks (plugin-specific)
5. Custom event handlers
6. Metrics collection
7. Error handling
8. Cleanup and unsubscribe

**Complexity**: High  
**Best For**: Learning all features, reference implementation

**Run Command**:
```bash
npx ts-node src/prototypes/lib_alt/example.ts
```

**Expected Output**:
```
🚀 Starting lib_alt Event System Example
✅ Monitor initialized with 4 plugins

📌 Setting up hooks...
📤 Emitting events...
🔷 [HOOK:EMIT] log emitted
[APP:INFO] Application started successfully
[APP:WARN] This is a warning message
🚨 [AUDIT] Error event detected!
[APP:ERROR] An error occurred!

👤 User logged in: john.doe from 192.168.1.1
📊 Checking metrics...
Current Statistics: {
  "total": 15,
  "byType": {
    "log": 3,
    "user.login": 1,
    ...
  }
}

✅ Example completed successfully
```

---

### 4. example-advanced.ts 🚀

**Purpose**: Production-ready patterns and advanced techniques

**What's Included**:
- ✅ Event Aggregator (batching pattern)
- ✅ Event Router (conditional routing)
- ✅ Event Enricher (data augmentation)
- ✅ Circuit Breaker (fault tolerance)
- ✅ Event Replay System (time-travel debugging)
- ✅ Event Debouncer (rate limiting)

**Plugins Demonstrated**:

1. **EventAggregator** (both)
   - Batches events by size or time
   - Prevents event flooding
   - Methods: `forceFlush()`
   - Config: `batchSize`, `flushInterval`

2. **EventRouter** (both)
   - Routes events based on patterns
   - Transforms event types
   - Methods: `route()`
   - Config: `routes` (pattern → target mapping)

3. **EventEnricher** (both)
   - Augments events with additional data
   - Pattern-based enrichment rules
   - Methods: `enrich()`
   - Config: `enrichers` (pattern → data mapping)

4. **CircuitBreaker** (both)
   - Fault tolerance pattern
   - Opens circuit after threshold failures
   - Auto-recovery with timeout
   - Methods: `getState()`, `reset()`
   - Config: `threshold`, `timeout`, `monitoredTypes`

5. **EventReplay** (both)
   - Records event history
   - Replay events for debugging
   - Methods: `getHistory()`, `replay()`, `clear()`
   - Config: `maxHistory`, `persist`

6. **EventDebouncer** (both)
   - Debounces rapid-fire events
   - Emits only the latest after delay
   - Pattern-based debouncing
   - Config: `delay`, `patterns`

**Scenarios Covered**:
1. Event aggregation (batching 5 events)
2. Event routing (user.* → analytics.user)
3. Event enrichment (adding system metadata)
4. Circuit breaker (opening after 3 failures)
5. Event replay (time-travel debugging)
6. Event debouncing (5 rapid events → 1)

**Complexity**: Very High  
**Best For**: Production systems, architectural patterns

**Run Command**:
```bash
npx ts-node src/prototypes/lib_alt/example-advanced.ts
```

**Expected Output**:
```
🚀 Advanced lib_alt Patterns Example
✅ Monitor initialized with advanced plugins

📦 Testing Event Aggregation...
📦 Batch received: 5 events
   Batch ID: abc123

🛣️  Testing Event Routing...
📊 Analytics received: routed from user.click

✨ Testing Event Enrichment...
✨ Enriched event: {
  "element": "button-submit",
  "enrichment": {
    "system": "user-management",
    "version": "1.0"
  }
}

⚡ Testing Circuit Breaker...
🔴 Circuit OPENED! { failureCount: 3, threshold: 3 }
Circuit state: { state: 'open', failureCount: 3, ... }

🔁 Testing Event Replay...
📚 History contains 3 user events
🔁 Replayed 3 events

⏱️  Testing Event Debouncing...
⏱️  Debounced input: text-4
(Only last of 5 rapid events emitted)

✅ Advanced example completed
```

---

## 🎓 Learning Path

### Stage 1: Getting Started (30 min)
1. Run `example-simple.ts`
2. Modify it to add your own plugin
3. Understand producer vs consumer types

### Stage 2: Core Features (1 hour)
1. Run `sample.ts`
2. Study each test section
3. Understand hooks and namespaces

### Stage 3: Complete Features (2 hours)
1. Run `example.ts`
2. Study each plugin implementation
3. Understand plugin configuration

### Stage 4: Advanced Patterns (3 hours)
1. Run `example-advanced.ts`
2. Study each pattern (aggregator, router, etc.)
3. Understand production use cases

---

## 🔧 Plugin Patterns Summary

### From Simple Example
- **Basic Producer**: Minimal emitter with namespace
- **Basic Consumer**: Minimal listener

### From Sample
- **Colorized Output**: Console formatting with ANSI codes
- **Event Counting**: Stateful consumer tracking metrics
- **Broadcasting**: Re-emitting events with transformation

### From Comprehensive Example
- **Multi-level Logger**: Producer with multiple methods
- **Configured Consumer**: Consumer with schema-based config
- **Metrics Tracking**: Stateful "both" plugin with reporting
- **Event Filtering**: Allow/block list pattern

### From Advanced Example
- **Event Aggregation**: Batching pattern (performance)
- **Event Routing**: Conditional routing (architecture)
- **Event Enrichment**: Data augmentation (transformation)
- **Circuit Breaker**: Fault tolerance (reliability)
- **Event Replay**: History tracking (debugging)
- **Event Debouncing**: Rate limiting (performance)

---

## 📊 Coverage Matrix

| Feature | Simple | Sample | Full | Advanced |
|---------|--------|--------|------|----------|
| Consumer Plugin | ✅ | ✅ | ✅ | ✅ |
| Producer Plugin | ✅ | ✅ | ✅ | ✅ |
| Both Plugin | ❌ | ✅ | ✅ | ✅ |
| Namespaces | ✅ | ✅ | ✅ | ✅ |
| Configuration | ❌ | ✅ | ✅ | ✅ |
| Global Hooks | ❌ | ✅ | ✅ | ✅ |
| Plugin Hooks | ❌ | ✅ | ✅ | ✅ |
| Subscribe/Unsubscribe | ✅ | ✅ | ✅ | ✅ |
| On/Off Handlers | ✅ | ✅ | ✅ | ✅ |
| Error Handling | ❌ | ❌ | ✅ | ✅ |
| Metrics | ❌ | ✅ | ✅ | ✅ |
| Filtering | ❌ | ❌ | ✅ | ✅ |
| Batching | ❌ | ✅ | ❌ | ✅ |
| Routing | ❌ | ❌ | ❌ | ✅ |
| Enrichment | ❌ | ❌ | ❌ | ✅ |
| Circuit Breaking | ❌ | ❌ | ❌ | ✅ |
| Replay | ❌ | ❌ | ❌ | ✅ |
| Debouncing | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 Use Case Mapping

### Need to understand basics?
→ **example-simple.ts** (5 minutes)

### Need to validate implementation?
→ **sample.ts** (10 minutes)

### Need to learn all features?
→ **example.ts** (15 minutes)

### Need production patterns?
→ **example-advanced.ts** (20 minutes)

### Building a logging system?
→ Use Logger from **example.ts**

### Building event pipeline?
→ Use Router + Enricher from **example-advanced.ts**

### Need fault tolerance?
→ Use CircuitBreaker from **example-advanced.ts**

### Need to debug event flow?
→ Use EventReplay from **example-advanced.ts**

### Need to prevent event flooding?
→ Use EventAggregator or EventDebouncer from **example-advanced.ts**

---

## 🔍 Quick Reference

### Running Examples

```bash
# Simple (5 min)
npx ts-node src/prototypes/lib_alt/example-simple.ts

# Sample validation (10 min)
npx ts-node src/prototypes/lib_alt/sample.ts

# Comprehensive (15 min)
npx ts-node src/prototypes/lib_alt/example.ts

# Advanced patterns (20 min)
npx ts-node src/prototypes/lib_alt/example-advanced.ts
```

### Code Statistics

```
example-simple.ts:    ~120 lines, 2 plugins
sample.ts:            ~320 lines, 3 plugins, 7 tests
example.ts:           ~480 lines, 4 plugins, 8 scenarios
example-advanced.ts:  ~680 lines, 6 plugins, 6 scenarios

Total:                ~1,600 lines, 15 unique plugins
```

---

## 📝 Key Takeaways

1. **Start Simple**: `example-simple.ts` gets you running in 5 minutes
2. **Validate Everything**: `sample.ts` tests all core features
3. **Learn Completely**: `example.ts` shows all capabilities
4. **Go Pro**: `example-advanced.ts` provides production patterns

5. **15 Unique Plugins**: Covers all plugin types and patterns
6. **21 Total Scenarios**: From basic to advanced use cases
7. **100% Feature Coverage**: All lib_alt features demonstrated
8. **Self-Contained**: Each example runs independently

---

## 🎨 Plugin Gallery

**Consumer Plugins** (4):
- Console (simple)
- EventCounter (sample)
- ConsoleWriter (comprehensive)
- (Various listeners in examples)

**Producer Plugins** (5):
- SimpleLogger (simple)
- Logger (comprehensive)
- (Various emitters in examples)

**Both Plugins** (6):
- PrettyPrinter (sample)
- Broadcaster (sample)
- MetricsCollector (comprehensive)
- EventFilter (comprehensive)
- EventAggregator (advanced)
- EventRouter (advanced)
- EventEnricher (advanced)
- CircuitBreaker (advanced)
- EventReplay (advanced)
- EventDebouncer (advanced)

---

## ✅ Checklist

- [x] Simple quick-start example created
- [x] Validation sample created
- [x] Comprehensive example created
- [x] Advanced patterns example created
- [x] All plugin types demonstrated
- [x] All core features covered
- [x] Production patterns included
- [x] Documentation provided
- [x] Examples are runnable
- [x] Code is well-commented

---

## 🚀 Next Steps

1. **Run all examples** in order
2. **Modify examples** to experiment
3. **Build your own plugins** using patterns
4. **Combine patterns** for complex systems
5. **Contribute back** improvements

---

**Total Documentation Created**:
- 4 example files (~1,600 lines)
- 3 documentation files (README, EXAMPLES, QUICK-REFERENCE)
- 1 index file
- 1 summary file (this)

**Happy coding! 🎉**