# Quick Start Guide

Get up and running with the enhanced event bus library in 5 minutes.

## 📦 Installation

```typescript
// Import from lib_alt
import { Monitor, createPlugin, T } from './lib_alt';
```

## 🚀 30-Second Example

```typescript
// 1. Create a plugin
const LoggerPlugin = createPlugin({
  name: 'logger',
  type: 'consumer',
  opts: T.object({
    properties: {
      level: T.literals({ enum: ['info', 'debug', 'error'] })
    }
  })
}, {
  init(ctx, config) {
    ctx.subscribe((event) => {
      console.log(`[${config.level}] ${event.type}:`, event.payload);
    });
  }
});

// 2. Create monitor with plugins
const logger = new LoggerPlugin({ level: 'info' });
const monitor = new Monitor({ plugins: [logger] });

// 3. Subscribe to events
monitor.on('user.login', (event) => {
  console.log('User logged in:', event.payload);
});

// Done! The system is now listening for events.
```

## 🎯 Core Concepts

### 1. **Plugins** - Building Blocks

Plugins come in three types:

- **Consumer**: Receives events (e.g., logger, analytics)
- **Producer**: Emits events (e.g., HTTP client, file watcher)
- **Both**: Can emit and receive (e.g., database, API client)

```typescript
// Consumer Plugin
const ConsumerPlugin = createPlugin({
  name: 'my-consumer',
  type: 'consumer',  // ← Only receives events
  opts: mySchema
}, {
  init(ctx, config) {
    ctx.subscribe((event) => {
      // Handle all events
    });
    
    ctx.on('specific.type', (event) => {
      // Handle specific event type
    });
  }
});

// Producer Plugin
const ProducerPlugin = createPlugin({
  name: 'my-producer',
  type: 'producer',  // ← Only emits events
  opts: mySchema
}, {
  init(ctx, config) {
    // Later emit events
  },
  namespace: {
    alias: 'producer',
    getHandlers(ctx, config) {
      return {
        async trigger() {
          await ctx.emit({
            type: 'something.happened',
            payload: { data: 'value' },
            timestamp: Date.now()
          });
        }
      };
    }
  }
});

// Both Plugin
const BothPlugin = createPlugin({
  name: 'my-both',
  type: 'both',  // ← Can emit AND receive
  opts: mySchema
}, {
  init(ctx, config) {
    // Can use both ctx.subscribe/on AND ctx.emit
    ctx.on('input.event', async (event) => {
      await ctx.emit({
        type: 'output.event',
        payload: { processed: event.payload },
        timestamp: Date.now()
      });
    });
  }
});
```

### 2. **Monitor** - The Event Bus

The Monitor is the central hub that:
- Manages plugin lifecycles
- Routes events between plugins
- Provides subscription APIs

```typescript
const monitor = new Monitor({
  plugins: [plugin1, plugin2, plugin3]
});

// Subscribe to all events
monitor.subscribe((event) => {
  console.log('Any event:', event);
});

// Subscribe to specific event type
monitor.on('user.login', (event) => {
  console.log('Login event:', event);
});

// Unsubscribe
const handler = (event) => console.log(event);
monitor.on('test', handler);
monitor.off('test', handler);
```

### 3. **Hooks** - Middleware

Hooks intercept events at different stages:

```typescript
monitor.hook('my-hook', {
  handlers: {
    emit: [
      async (event) => {
        console.log('Before emission:', event.type);
      }
    ],
    receive: [
      async (event) => {
        console.log('After reception:', event.type);
      }
    ],
    general: [
      async (event) => {
        console.log('Catch-all:', event.type);
      }
    ]
  },
  meta: {
    description: 'What this hook does',
    priority: 10
  }
});
```

### 4. **Namespaces** - Plugin APIs

Producer/Both plugins can expose APIs via namespaces:

```typescript
const HttpPlugin = createPlugin({
  name: 'http',
  type: 'both',
  opts: httpSchema
}, {
  init(ctx, config) {
    // Setup
  },
  namespace: {
    alias: 'http',  // ← Namespace name
    getHandlers(ctx, config) {
      return {
        async get(url: string) {
          const response = await fetch(url);
          const data = await response.json();
          
          await ctx.emit({
            type: 'http.response',
            payload: data,
            timestamp: Date.now()
          });
          
          return data;
        }
      };
    }
  }
});

// Usage
const monitor = new Monitor({ plugins: [new HttpPlugin(config)] });
const { http } = monitor.namespaces();

// Call namespace methods
const data = await http.get('https://api.example.com/data');
```

## 📋 Common Patterns

### Pattern 1: Logger Plugin

```typescript
const LoggerPlugin = createPlugin({
  name: 'logger',
  type: 'consumer',
  opts: T.object({
    properties: {
      format: T.literals({ enum: ['json', 'text'] })
    }
  })
}, {
  init(ctx, config) {
    ctx.subscribe((event) => {
      const message = config.format === 'json'
        ? JSON.stringify(event)
        : `[${event.type}] ${JSON.stringify(event.payload)}`;
      console.log(message);
    });
  }
});

const logger = new LoggerPlugin({ format: 'json' });
const monitor = new Monitor({ plugins: [logger] });
```

### Pattern 2: HTTP Client Plugin

```typescript
const HttpPlugin = createPlugin({
  name: 'http',
  type: 'both',
  opts: T.object({
    properties: {
      baseUrl: T.string(),
      timeout: T.number()
    }
  })
}, {
  init(ctx, config) {
    ctx.on('http.request', async (event) => {
      console.log('Request:', event.payload);
    });
  },
  namespace: {
    alias: 'http',
    getHandlers(ctx, config) {
      return {
        async get(path: string) {
          const url = `${config.baseUrl}${path}`;
          const response = await fetch(url);
          const data = await response.json();
          
          await ctx.emit({
            type: 'http.response',
            payload: { url, data },
            timestamp: Date.now()
          });
          
          return data;
        },
        
        async post(path: string, body: any) {
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

const http = new HttpPlugin({ baseUrl: 'https://api.example.com', timeout: 5000 });
const monitor = new Monitor({ plugins: [http] });
const { http: client } = monitor.namespaces();

// Use it
const users = await client.get('/users');
await client.post('/users', { name: 'John' });
```

### Pattern 3: Validation Hook

```typescript
monitor.hook('validator', {
  handlers: {
    emit: [
      async (event) => {
        if (!event.type || !event.payload || !event.timestamp) {
          throw new Error('Invalid event structure');
        }
      }
    ]
  },
  meta: {
    description: 'Validates all events before emission',
    priority: 100
  }
});
```

### Pattern 4: Analytics Plugin

```typescript
const AnalyticsPlugin = createPlugin({
  name: 'analytics',
  type: 'consumer',
  opts: T.object({
    properties: {
      batchSize: T.number()
    }
  })
}, {
  init(ctx, config) {
    const batch: any[] = [];
    
    ctx.subscribe((event) => {
      batch.push(event);
      
      if (batch.length >= config.batchSize) {
        console.log(`Sending ${batch.length} events to analytics`);
        // Send batch to analytics service
        batch.length = 0;
      }
    });
  }
});

const analytics = new AnalyticsPlugin({ batchSize: 50 });
const monitor = new Monitor({ plugins: [analytics] });
```

## 🔍 Debugging & Monitoring

```typescript
// Get monitor statistics
const stats = monitor.getStats();
console.log('Stats:', {
  plugins: stats.plugins,
  subscribers: stats.globalSubscribers,
  handlers: stats.typeSpecificHandlers,
  eventTypes: stats.eventTypes
});

// Get plugin names
console.log('Plugins:', monitor.getPluginNames());
// Output: ['logger', 'http', 'analytics']

// Get event types
console.log('Event types:', monitor.getEventTypes());
// Output: ['user.login', 'user.logout', 'data.update']

// Check plugin registration
const isRegistered = monitor.hasPlugin(HttpPlugin.signature());
console.log('HTTP plugin registered:', isRegistered);

// Debug output
console.log(monitor.toString());
// Output: "Monitor(plugins=3, subscribers=2, handlers=5)"
```

## ⚠️ Common Pitfalls

### ❌ Don't: Emit in Consumer-only Plugins

```typescript
const BadPlugin = createPlugin({
  name: 'bad',
  type: 'consumer',  // ← Consumer type
  opts: undefined
}, {
  init(ctx, config) {
    ctx.emit({ /* ... */ });  // ❌ ctx.emit doesn't exist!
  }
});
```

### ✅ Do: Use 'both' or 'producer' Type

```typescript
const GoodPlugin = createPlugin({
  name: 'good',
  type: 'both',  // ← Both type
  opts: undefined
}, {
  init(ctx, config) {
    ctx.emit({ /* ... */ });  // ✅ Now it works!
  }
});
```

### ❌ Don't: Forget to Unsubscribe

```typescript
// Memory leak - handler never removed
const handler = (event) => console.log(event);
monitor.on('temporary.event', handler);
// Forgot to call monitor.off('temporary.event', handler);
```

### ✅ Do: Clean Up Subscriptions

```typescript
const handler = (event) => console.log(event);
monitor.on('temporary.event', handler);

// Later, when no longer needed
monitor.off('temporary.event', handler);
```

### ❌ Don't: Modify Context

```typescript
const BadPlugin = createPlugin({
  name: 'bad',
  type: 'consumer',
  opts: undefined
}, {
  init(ctx, config) {
    (ctx as any).newMethod = () => {};  // ❌ Context is frozen!
  }
});
```

### ✅ Do: Use Context As-Is

```typescript
const GoodPlugin = createPlugin({
  name: 'good',
  type: 'consumer',
  opts: undefined
}, {
  init(ctx, config) {
    ctx.subscribe((event) => {});  // ✅ Use provided methods
    ctx.on('type', (event) => {});  // ✅ This is the way
  }
});
```

## 📚 Next Steps

1. **Read the full documentation**: See `README.md` for comprehensive guides
2. **Check out examples**: See `EXAMPLES.ts` for advanced patterns
3. **Review the analysis**: See `ANALYSIS.md` for technical details
4. **Explore the API**: All code is fully documented with JSDoc

## 🎓 Key Takeaways

- **Plugins** are the building blocks (consumer/producer/both)
- **Monitor** is the central event bus
- **Hooks** are middleware for cross-cutting concerns
- **Namespaces** expose plugin-specific APIs
- **Events** follow a standard structure: type, payload, timestamp, metadata

## 💡 Pro Tips

1. **Use descriptive event names**: `user.login` not `login`
2. **Add metadata**: Include source, priority, correlation IDs
3. **Handle errors gracefully**: Catch errors in subscribers
4. **Monitor performance**: Use `getStats()` to track system health
5. **Use hooks for cross-cutting concerns**: Logging, validation, timing
6. **Type your events**: Define payload types for type safety

---

**Ready to build?** Start with the 30-second example and gradually add complexity!

**Need help?** Check `README.md` for detailed documentation or `EXAMPLES.ts` for more patterns.