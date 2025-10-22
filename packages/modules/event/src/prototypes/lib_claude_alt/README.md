# Event Bus Library - Enhanced Implementation (`lib_alt`)

This directory contains an enhanced, cleaned-up version of the event bus library with comprehensive JSDoc documentation, improved error handling, and better architectural patterns.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Improvements](#key-improvements)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

## 🎯 Overview

The enhanced event bus system provides a type-safe, plugin-based architecture for managing event-driven communication between different parts of your application. It supports:

- **Type-safe plugins** with consumer/producer patterns
- **Event routing** with hooks and middleware capabilities
- **Namespace support** for plugin-specific APIs
- **Comprehensive error handling** and validation
- **Full TypeScript support** with advanced type inference

## ✨ Key Improvements

### 1. **Comprehensive JSDoc Documentation**

Every class, method, and type now includes detailed JSDoc comments with:
- Clear descriptions of purpose and behavior
- Parameter documentation with types
- Return value documentation
- Usage examples
- Important remarks and warnings

### 2. **Enhanced Error Handling**

- Descriptive error messages with context
- Error wrapping with `cause` property for debugging
- Graceful degradation (errors don't stop event propagation)
- Validation of plugin configuration
- Prevention of duplicate plugin registration

### 3. **Improved Type Safety**

- Better type inference for plugin instances
- Type guards for runtime validation (`isPluginInstance`, `isEventData`)
- Helper types for extracting plugin configuration and types
- Stricter typing for plugin contexts

### 4. **Additional Features**

- Plugin activation status tracking
- Monitor statistics and introspection methods
- Better hook management (get, remove, clear)
- Connection utility methods (isConsumer, isProducer)
- Debug-friendly `toString()` methods

### 5. **Better Abstractions**

- Cleaner separation of concerns
- More intuitive method names
- Consistent error prefixes (`[@monitext/event]`)
- Frozen contexts to prevent accidental modification

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                        Monitor                           │
│  Central event bus managing plugins and event routing   │
├─────────────────────────────────────────────────────────┤
│  • Plugin registration and lifecycle                     │
│  • Event routing and subscription management            │
│  • Hook execution                                        │
│  • Namespace aggregation                                │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─── BusConnection ───┐
               │                     │
               │    Plugin wrapper   │
               │    • Hook management │
               │    • Namespace access│
               │    • Metadata access │
               │                     │
               └─────────────────────┘
                       │
                       │
                  ┌────┴────┐
                  │ Plugin  │
                  │         │
                  │ Base    │
                  │ class   │
                  └─────────┘
```

### Event Flow

```
Producer Plugin
      │
      │ ctx.emit(event)
      ├──────────────────► Monitor.routeEvent()
      │                           │
      │                           ├─► Execute emit hooks
      │                           │
      │                           ├─► Global subscribers
      │                           │
      │                           ├─► Type-specific handlers
      │                           │
      │                           └─► Execute receive hooks
      │
      ▼
Consumer Plugins
```

## 📚 API Documentation

### Monitor

The central event bus that manages plugin connections and event routing.

#### Constructor

```typescript
new Monitor<P>({ plugins: [...P] })
```

#### Methods

| Method | Description |
|--------|-------------|
| `subscribe(handler)` | Subscribe to all events |
| `on(eventType, handler)` | Subscribe to specific event type |
| `unsubscribe(handler)` | Remove global subscriber |
| `off(eventType, handler)` | Remove type-specific handler |
| `hook(hookId, options)` | Register a hook |
| `removeHook(hookId)` | Remove a hook |
| `namespaces()` | Get all plugin namespaces |
| `getStats()` | Get monitor statistics |
| `getPluginNames()` | Get list of plugin names |
| `getEventTypes()` | Get list of registered event types |
| `hasPlugin(signature)` | Check if plugin is registered |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pluginCount` | `number` | Number of registered plugins |
| `subscriberCount` | `number` | Number of global subscribers |
| `handlerCount` | `number` | Total type-specific handlers |
| `eventTypeCount` | `number` | Number of unique event types |

### Plugin

Abstract base class for all plugins.

#### Key Methods

| Method | Description |
|--------|-------------|
| `activate(ctx)` | Initialize the plugin with context |
| `signature()` | Get unique plugin signature |
| `configure(config)` | Set plugin configuration |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `core` | `PluginArchitecture` | Plugin's core structure |
| `config` | `T` | Plugin configuration |
| `isActivated` | `boolean` | Activation status |

### createPlugin()

Factory function to create plugin classes.

```typescript
createPlugin<N, O, P, A, X>(
  descriptor: P,
  handlers: X
): PluginClass
```

**Parameters:**
- `descriptor`: Plugin metadata (name, type, opts)
- `handlers`: Plugin implementation (init, namespace)

**Returns:** A Plugin class constructor

### BusConnection

Represents a connection between a plugin and the bus.

#### Methods

| Method | Description |
|--------|-------------|
| `setHook(id, options)` | Register a hook |
| `getHook(id)` | Get hook by ID |
| `getAllHooks()` | Get all hooks |
| `removeHook(id)` | Remove a hook |
| `clearHooks()` | Clear all hooks |
| `hasNamespace()` | Check if plugin has namespace |
| `getNamespace(ctx)` | Get namespace handlers |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `PluginType` | Plugin type |
| `name` | `string` | Plugin name |
| `signature` | `symbol` | Plugin signature |
| `isConsumer` | `boolean` | Is consumer type |
| `isProducer` | `boolean` | Is producer type |
| `hookCount` | `number` | Number of hooks |

## 💡 Usage Examples

### Example 1: Basic Logger Plugin

```typescript
import { createPlugin, Monitor, T } from './lib_alt';

// Define schema
const loggerSchema = T.object({
  properties: {
    level: T.literals({ enum: ['info', 'debug', 'error'] }),
    format: T.literals({ enum: ['json', 'text'] })
  }
});

// Create plugin
const LoggerPlugin = createPlugin({
  name: 'logger',
  type: 'consumer',
  opts: loggerSchema
}, {
  init(ctx, config) {
    ctx.subscribe((event) => {
      const timestamp = new Date(event.timestamp).toISOString();
      const message = config.format === 'json'
        ? JSON.stringify({ timestamp, ...event })
        : `[${timestamp}] ${event.type}: ${JSON.stringify(event.payload)}`;
      
      console.log(message);
    });
  }
});

// Instantiate and use
const logger = new LoggerPlugin({ level: 'info', format: 'json' });
const monitor = new Monitor({ plugins: [logger] });
```

### Example 2: HTTP Plugin with Namespace

```typescript
const httpSchema = T.object({
  properties: {
    baseUrl: T.string(),
    timeout: T.number()
  }
});

const HttpPlugin = createPlugin({
  name: 'http-client',
  type: 'both',
  opts: httpSchema
}, {
  init(ctx, config) {
    // Listen for http.request events
    ctx.on('http.request', async (event) => {
      // Handle incoming request events
      console.log('Processing request:', event.payload);
    });
  },
  namespace: {
    alias: 'http',
    getHandlers(ctx, config) {
      return {
        get: async (path: string) => {
          const url = `${config.baseUrl}${path}`;
          const response = await fetch(url);
          const data = await response.json();
          
          // Emit response event
          await ctx.emit({
            type: 'http.response',
            payload: { url, data },
            timestamp: Date.now()
          });
          
          return data;
        },
        post: async (path: string, body: any) => {
          const url = `${config.baseUrl}${path}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await response.json();
          
          await ctx.emit({
            type: 'http.response',
            payload: { url, data },
            timestamp: Date.now()
          });
          
          return data;
        }
      };
    }
  }
});

// Usage
const http = new HttpPlugin({ 
  baseUrl: 'https://api.example.com',
  timeout: 5000
});

const monitor = new Monitor({ plugins: [http, logger] });

// Access namespace
const { http: httpApi } = monitor.namespaces();
const users = await httpApi.get('/users');
await httpApi.post('/users', { name: 'John' });
```

### Example 3: Event Hooks

```typescript
// Add validation hook
monitor.hook('validator', {
  handlers: {
    emit: [
      async (event) => {
        // Validate all events before emission
        if (!event.type || !event.payload) {
          throw new Error('Invalid event structure');
        }
        console.log('✓ Event validated:', event.type);
      }
    ]
  },
  meta: {
    description: 'Validates event structure',
    priority: 10
  }
});

// Add timing hook
monitor.hook('timer', {
  handlers: {
    emit: [
      async (event) => {
        console.time(`Event: ${event.type}`);
      }
    ],
    receive: [
      async (event) => {
        console.timeEnd(`Event: ${event.type}`);
      }
    ]
  },
  meta: {
    description: 'Measures event processing time'
  }
});

// Plugin-specific hook
monitor.hook('http-logger', {
  handlers: {
    emit: [
      async (event) => {
        console.log('HTTP event emitted:', event.type);
      }
    ]
  },
  plugins: [http],
  meta: {
    description: 'Logs HTTP plugin events only'
  }
});
```

### Example 4: Event Subscriptions

```typescript
// Global subscription
monitor.subscribe((event) => {
  console.log('Global:', event.type);
});

// Type-specific subscriptions
monitor.on('user.login', (event) => {
  console.log('User logged in:', event.payload.userId);
});

monitor.on('user.logout', (event) => {
  console.log('User logged out:', event.payload.userId);
});

monitor.on('data.update', (event) => {
  console.log('Data updated:', event.payload);
});

// Unsubscribe
const handler = (event) => console.log(event);
monitor.on('test.event', handler);
monitor.off('test.event', handler); // Remove handler
```

### Example 5: Monitor Statistics

```typescript
// Get statistics
const stats = monitor.getStats();
console.log('Monitor Statistics:', {
  plugins: stats.plugins,
  subscribers: stats.globalSubscribers,
  handlers: stats.typeSpecificHandlers,
  eventTypes: stats.eventTypes,
  isStarted: stats.isStarted
});

// Get plugin names
console.log('Registered plugins:', monitor.getPluginNames());
// Output: ['logger', 'http-client']

// Get event types
console.log('Listening for:', monitor.getEventTypes());
// Output: ['user.login', 'user.logout', 'data.update']

// Check plugin registration
const isRegistered = monitor.hasPlugin(HttpPlugin.signature());
console.log('HTTP plugin registered:', isRegistered);
```

## 🔄 Migration Guide

### From `lib` to `lib_alt`

#### Import Changes

```typescript
// Before
import { Monitor, Plugin } from '../lib';

// After
import { Monitor, createPlugin } from '../lib_alt';
```

#### Plugin Creation

```typescript
// Before
const plugin = new Plugin(core);
plugin.congigure(config); // Typo in original

// After
const PluginClass = createPlugin(descriptor, handlers);
const plugin = new PluginClass(config);
```

#### Key API Changes

| Old | New | Notes |
|-----|-----|-------|
| `plugin.congigure()` | `plugin.configure()` | Typo fixed |
| N/A | `plugin.isActivated` | New property |
| N/A | `monitor.getStats()` | New method |
| N/A | `monitor.removeHook()` | New method |
| N/A | `connection.getAllHooks()` | New method |

## ✅ Best Practices

### 1. **Plugin Design**

- Keep plugins focused on a single responsibility
- Use descriptive plugin names
- Always define a schema for configuration options
- Handle errors gracefully in init methods

```typescript
// Good
const LoggerPlugin = createPlugin({
  name: 'logger',
  type: 'consumer',
  opts: loggerSchema
}, {
  init(ctx, config) {
    try {
      // Setup logic
    } catch (error) {
      console.error('Logger setup failed:', error);
    }
  }
});
```

### 2. **Event Naming**

Use hierarchical naming with dots for event types:

```typescript
// Good
'user.login'
'user.logout'
'data.create'
'data.update'
'http.request'
'http.response'

// Avoid
'login'
'update'
'req'
```

### 3. **Hook Usage**

- Use hooks for cross-cutting concerns (logging, validation, timing)
- Set appropriate priority values
- Include descriptive metadata
- Handle errors in hook handlers

```typescript
monitor.hook('validator', {
  handlers: {
    emit: [
      async (event) => {
        try {
          validate(event);
        } catch (error) {
          console.error('Validation failed:', error);
          throw error; // Re-throw if validation should block
        }
      }
    ]
  },
  meta: {
    description: 'Validates events',
    priority: 100 // High priority
  }
});
```

### 4. **Memory Management**

- Unsubscribe handlers when they're no longer needed
- Use plugin-specific hooks instead of global when possible
- Monitor stats regularly to detect memory leaks

```typescript
// Store reference for cleanup
const handler = (event) => { /* ... */ };
monitor.on('event.type', handler);

// Later cleanup
monitor.off('event.type', handler);
```

### 5. **Type Safety**

- Use type guards when dealing with dynamic data
- Leverage TypeScript's type inference
- Define explicit types for namespaces

```typescript
import { isEventData, isPluginInstance } from './lib_alt';

// Type guard usage
if (isEventData(unknownData)) {
  console.log(unknownData.type, unknownData.payload);
}

if (isPluginInstance(unknownPlugin)) {
  console.log(unknownPlugin.core.name);
}
```

## 🐛 Debugging

### Enable Detailed Logging

All errors are logged with the prefix `[@monitext/event]`:

```typescript
// Hook handler failures
[@monitext/event]: Hook "validator" handler failed for event "user.login": Error: ...

// Plugin activation failures
[@monitext/event]: Error while initializing plugin "logger", see error cause for more info

// Namespace errors
[@monitext/event]: Failed to invoke namespace for "http-client": Error: ...
```

### Use Monitor Statistics

```typescript
// Check monitor state
console.log(monitor.toString());
// Output: Monitor(plugins=3, subscribers=2, handlers=5)

const stats = monitor.getStats();
console.log('Detailed stats:', stats);
```

### Use Connection Debugging

```typescript
for (const plugin of monitor.plugins) {
  const sig = plugin.signature();
  if (monitor.hasPlugin(sig)) {
    console.log(`✓ ${plugin.core.name} is registered`);
    console.log(`  Type: ${plugin.core.type}`);
    console.log(`  Activated: ${plugin.isActivated}`);
  }
}
```

## 📝 Notes

### Differences from Original Implementation

1. **Fixed typos**: `congigure` → `configure`, `invoque` → `invoke`
2. **Removed test code**: Removed example instantiations from library files
3. **Added validation**: Configuration validation, duplicate prevention
4. **Enhanced errors**: Better error messages with context
5. **Added utilities**: Helper methods for introspection and debugging
6. **Improved types**: Better type inference and type guards

### Future Enhancements

Potential improvements for future versions:

- [ ] Event filtering and transformation pipelines
- [ ] Priority-based hook execution
- [ ] Event replay and history
- [ ] Plugin hot-reloading
- [ ] Async plugin initialization with dependencies
- [ ] Event batching and throttling
- [ ] Metrics and monitoring integration
- [ ] Schema validation for event payloads

---

**Version:** 1.0.0 (Enhanced)  
**License:** Same as parent project  
**Maintainer:** @monitext/event team