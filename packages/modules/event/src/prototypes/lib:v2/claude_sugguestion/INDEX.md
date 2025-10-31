# lib_alt - File Index

**Quick navigation guide for the lib_alt event system prototype**

---

## 📂 Directory Structure

```
lib_alt/
├── Core Implementation
│   ├── bus-impl.ts          - Monitor/Bus implementation
│   ├── bus-types.ts         - Event data and hook types
│   ├── connection.ts        - Plugin-bus connection abstraction
│   ├── plugin-class.ts      - Abstract Plugin base class
│   ├── plugin-types.ts      - Type system and inference utilities
│   └── plugin-build.ts      - Plugin factory functions
│
├── Examples
│   ├── sample.ts            - Working validation sample
│   ├── example-simple.ts    - Quick-start guide (beginners)
│   ├── example.ts           - Comprehensive feature demo
│   └── example-advanced.ts  - Advanced patterns (production)
│
└── Documentation
    ├── README.md            - Main documentation (start here!)
    ├── EXAMPLES.md          - Complete examples guide
    ├── QUICK-REFERENCE.md   - One-page cheat sheet
    └── INDEX.md             - This file
```

---

## 🎯 Where to Start

### I'm new to lib_alt
1. **[README.md](./README.md)** - Read the overview and quick start
2. **[example-simple.ts](./example-simple.ts)** - Run the simple example
3. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Bookmark for later

### I want to learn all features
1. **[EXAMPLES.md](./EXAMPLES.md)** - Read the complete guide
2. **[example.ts](./example.ts)** - Run the comprehensive example
3. **[plugin-types.ts](./plugin-types.ts)** - Study the type system

### I need production patterns
1. **[example-advanced.ts](./example-advanced.ts)** - See advanced patterns
2. **[EXAMPLES.md](./EXAMPLES.md)** - Read pattern descriptions
3. **[bus-impl.ts](./bus-impl.ts)** - Study the implementation

### I want API reference
1. **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Quick API lookup
2. **[plugin-types.ts](./plugin-types.ts)** - Type definitions
3. **[bus-types.ts](./bus-types.ts)** - Event structures

---

## 📄 Core Files

### [bus-impl.ts](./bus-impl.ts)
**The Monitor/Bus implementation**

- Event routing logic
- Plugin lifecycle management
- Hook execution system
- Namespace exposure
- Global event handlers

**Key Exports**: `Monitor`

---

### [bus-types.ts](./bus-types.ts)
**Event data structures**

- `EventData<T>` interface
- `BusHookOptions` interface
- Hook handler types

**Key Exports**: `EventData`, `BusHookOptions`

---

### [connection.ts](./connection.ts)
**Plugin-bus connection abstraction**

- Wraps plugin instances
- Manages plugin hooks
- Provides namespace access
- Type-safe connection handling

**Key Exports**: `Connection`

---

### [plugin-class.ts](./plugin-class.ts)
**Abstract base class for plugins**

- Plugin lifecycle (activate, configure)
- Configuration storage
- Signature system
- Type-safe base implementation

**Key Exports**: `Plugin`

---

### [plugin-types.ts](./plugin-types.ts)
**Type system and inference utilities**

- `PluginType`: consumer | producer | both
- `PluginDescriptor<N, T, O>`
- `InferPluginContext<T>`
- `InferPluginArchitecture<X>`
- Context types (ConsumerCtx, ProducerCtx)

**Key Exports**: All types for plugin creation

---

### [plugin-build.ts](./plugin-build.ts)
**Factory functions for creating plugins**

- `describePlugin()` - Create plugin descriptor
- `assemblePlugin()` - Build complete plugin class

**Key Exports**: `describePlugin`, `assemblePlugin`

---

## 📝 Examples

### [sample.ts](./sample.ts) ⭐ START HERE
**Quick validation sample**

**What it shows**:
- ✅ Basic plugin creation
- ✅ Monitor setup
- ✅ Namespace usage
- ✅ Event emission
- ✅ Hooks
- ✅ Subscription management

**Run**: `npx ts-node src/prototypes/lib_alt/sample.ts`

---

### [example-simple.ts](./example-simple.ts) 👶 BEGINNERS
**Minimal quick-start**

**What it shows**:
- ✅ Simple logger plugin (producer)
- ✅ Console output plugin (consumer)
- ✅ Monitor initialization
- ✅ Namespace API usage

**Lines**: ~120  
**Run**: `npx ts-node src/prototypes/lib_alt/example-simple.ts`

---

### [example.ts](./example.ts) 📚 COMPLETE
**Comprehensive feature demonstration**

**What it shows**:
- ✅ Logger plugin with levels (producer)
- ✅ Console writer with colors (consumer)
- ✅ Metrics collector (both)
- ✅ Event filter (both)
- ✅ Global and plugin-specific hooks
- ✅ Event handlers and subscriptions
- ✅ Namespace methods
- ✅ Error handling
- ✅ Cleanup patterns

**Lines**: ~480  
**Run**: `npx ts-node src/prototypes/lib_alt/example.ts`

---

### [example-advanced.ts](./example-advanced.ts) 🚀 ADVANCED
**Production-ready patterns**

**What it shows**:
- ✅ Event Aggregator (batching)
- ✅ Event Router (conditional routing)
- ✅ Event Enricher (data augmentation)
- ✅ Circuit Breaker (fault tolerance)
- ✅ Event Replay System
- ✅ Event Debouncer

**Lines**: ~680  
**Run**: `npx ts-node src/prototypes/lib_alt/example-advanced.ts`

---

## 📖 Documentation

### [README.md](./README.md) 📘 MAIN DOCS
**Complete documentation**

**Contents**:
- Overview and features
- Quick start guide
- Architecture diagrams
- Plugin types explained
- Hook system details
- Configuration system
- Namespace system
- Current limitations
- Troubleshooting
- Best practices
- Performance notes

**Length**: Comprehensive (~560 lines)

---

### [EXAMPLES.md](./EXAMPLES.md) 📗 EXAMPLES GUIDE
**Examples and patterns guide**

**Contents**:
- Available examples overview
- Architecture overview
- Common patterns
- Plugin configuration
- Event data structure
- Namespace API
- Current limitations
- Next steps
- Best practices
- Troubleshooting

**Length**: Detailed (~410 lines)

---

### [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) 📙 CHEAT SHEET
**One-page API reference**

**Contents**:
- 30-second quick start
- Plugin types table
- Creating plugins (all types)
- Monitor API
- Event structure
- Configuration schemas
- Hook patterns
- Common patterns
- Context methods
- Debugging tips

**Length**: Concise (~400 lines)

---

## 🔍 Finding What You Need

### "How do I create a plugin that listens to events?"
→ See **Consumer Plugin** section in [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)  
→ Run [example-simple.ts](./example-simple.ts)

### "How do I create a plugin that emits events?"
→ See **Producer Plugin** section in [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)  
→ Check Logger example in [example.ts](./example.ts)

### "How do I use hooks?"
→ See **Hook System** section in [README.md](./README.md)  
→ Run [example.ts](./example.ts) Test 4

### "What are the plugin types?"
→ See **Plugin Types** section in [README.md](./README.md)  
→ See table in [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)

### "How do I configure plugins?"
→ See **Configuration System** in [README.md](./README.md)  
→ See **Configuration Schemas** in [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)

### "What are namespaces?"
→ See **Namespace System** in [README.md](./README.md)  
→ See **Namespace API** in [EXAMPLES.md](./EXAMPLES.md)

### "I need advanced patterns"
→ Run [example-advanced.ts](./example-advanced.ts)  
→ Read **Common Patterns** in [EXAMPLES.md](./EXAMPLES.md)

### "What's the event structure?"
→ See **Event Data Structure** in all docs  
→ Check [bus-types.ts](./bus-types.ts)

### "How does the type system work?"
→ Read [plugin-types.ts](./plugin-types.ts)  
→ See type examples in [EXAMPLES.md](./EXAMPLES.md)

---

## 🎓 Learning Path

### Beginner (1-2 hours)
1. Read [README.md](./README.md) overview
2. Read [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
3. Run [example-simple.ts](./example-simple.ts)
4. Modify example to add your own plugin

### Intermediate (3-4 hours)
1. Read [EXAMPLES.md](./EXAMPLES.md) completely
2. Run [example.ts](./example.ts)
3. Study [plugin-types.ts](./plugin-types.ts)
4. Build a "both" type plugin with namespace

### Advanced (5+ hours)
1. Run [example-advanced.ts](./example-advanced.ts)
2. Study [bus-impl.ts](./bus-impl.ts) implementation
3. Study [connection.ts](./connection.ts)
4. Build complex multi-plugin system

---

## 🔗 Quick Links

| What | Where |
|------|-------|
| Start Here | [README.md](./README.md) |
| Quick Start | [example-simple.ts](./example-simple.ts) |
| API Reference | [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) |
| All Patterns | [example-advanced.ts](./example-advanced.ts) |
| Type System | [plugin-types.ts](./plugin-types.ts) |
| MVP Spec | [../../mvp.md](../../mvp.md) |
| Evaluation | See parent directory |

---

## 📊 File Statistics

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| bus-impl.ts | Code | ~350 | Core implementation |
| bus-types.ts | Code | ~20 | Type definitions |
| connection.ts | Code | ~100 | Connection logic |
| plugin-class.ts | Code | ~90 | Base class |
| plugin-types.ts | Code | ~220 | Type system |
| plugin-build.ts | Code | ~115 | Factories |
| sample.ts | Example | ~320 | Validation |
| example-simple.ts | Example | ~120 | Quick start |
| example.ts | Example | ~480 | Comprehensive |
| example-advanced.ts | Example | ~680 | Advanced patterns |
| README.md | Docs | ~560 | Main docs |
| EXAMPLES.md | Docs | ~410 | Examples guide |
| QUICK-REFERENCE.md | Docs | ~400 | Cheat sheet |
| INDEX.md | Docs | ~350 | This file |

**Total**: ~3,615 lines of code + documentation

---

## ✅ Checklist for New Users

- [ ] Read [README.md](./README.md) overview section
- [ ] Skim [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
- [ ] Run [example-simple.ts](./example-simple.ts)
- [ ] Understand the three plugin types
- [ ] Create your first consumer plugin
- [ ] Create your first producer plugin with namespace
- [ ] Add hooks to your monitor
- [ ] Run [example.ts](./example.ts) to see all features
- [ ] Study [example-advanced.ts](./example-advanced.ts) patterns
- [ ] Build your own event system!

---

**Happy coding! 🎉**

*Last updated: Created with comprehensive examples*