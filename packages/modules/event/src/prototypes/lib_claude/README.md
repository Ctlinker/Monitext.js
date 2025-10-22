# @monitext/event

A powerful, type-safe event system for building plugin-based monitoring solutions. `@monitext/event` provides a multibus architecture with flexible event routing, rules, and hooks.

## 🎯 Features

- **🔌 Plugin Architecture** - Type-safe plugin system with automatic registration
- **🚦 Event Routing** - Sophisticated routing with rules and filters
- **🪝 Hooks System** - Intercept and transform data at emit/receive time
- **📊 Syslog-Style Severity** - Built-in severity levels (emergency → debug)
- **🎨 Type Safety** - Full TypeScript support with schema validation via `@monitext/typson`
- **🔄 Async Support** - Async-aware event handling and hooks
- **🌐 Flexible Context** - Consumer/Producer/Both plugin types
- **📦 Namespace API** - Expose plugin methods through namespaces

## 📦 Installation

```bash
npm install @monitext/event @monitext/typson
# or
pnpm add @monitext/event @monitext/typson
# or
yarn add @monitext/event @monitext/typson
```

## 🚀 Quick Start

```typescript
import { createPlugin, Monitor, createEvent } from '@monitext/event';
import { T } from '@monitext/typson';

// 1. Create a logger plugin
const LoggerPlugin = createPlugin(
  {
    name: 'logger',
    type: 'consumer',
    opts: T.object({
      properties: {
        mode: T.literals({ enum: ['json', 'pretty'] })
      },
      required: ['mode']
    })
  },
  {
    init(ctx, cfg) {
      ctx.subscribe((event) => {
        console.log(`[${event.type}]`, event.payload);
      });
    }
  }
);

// 2. Create a monitor and register plugins
const monitor = new Monitor({
  plugins: [
    new LoggerPlugin({ mode: 'pretty' })
  ]
});

// 3. Emit events
await monitor.emit(createEvent('user:login', { userId: '123' }));
```

## 📚 Core Concepts

### Monitor

A **Monitor** is the central event bus that manages plugins and routes events. It acts as a multibus structure where each plugin connects to its own branch.

```typescript
const monitor = new Monitor({
  plugins: [plugin1, plugin2, plugin3]
});
```

**Key Methods:**
- `emit(event)` - Emit an event to the bus
- `on(type, handler)` - Subscribe to specific event types
- `subscribe(handler)` - Subscribe to all events
- `rule(pluginClass, rule)` - Set routing rules for a plugin
- `hook(id, handler)` - Add transformation hooks
- `plugins()` - Get plugin namespaces

### Plugins

Plugins are self-contained units that can consume events, produce events, or both.

**Plugin Types:**
- `"consumer"` - Only receives events (ctx has `subscribe`, `on`)
- `"producer"` - Only emits events (ctx has `emit`)
- `"both"` - Can receive and emit (ctx has all methods)

**Creating a Plugin:**

```typescript
const MyPlugin = createPlugin(
  {
    name: 'my-plugin',
    type: 'both', // or 'consumer' or 'producer'
    opts: T.object({ /* schema */ })
  },
  {
    // Required: initialization function
    init(ctx, cfg) {
      // Setup event handlers, subscriptions, etc.
    },
    
    // Optional: expose helper methods
    namespace: {
      alias: 'myPlugin',
      getHandlers(ctx, cfg) {
        return {
          doSomething() { /* ... */ }
        };
      }
    }
  }
);

// Instantiate with config
const plugin = new MyPlugin({ /* config matching schema */ });
```

### Events

Events follow a structured format with optional severity and origin:

```typescript
interface EventData<T = any> {
  type: string;          // Event type identifier
  payload: T;            // Event data
  timestamp: number;     // Unix timestamp (ms)
  severity?: SeverityLevel;  // 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug'
  origin?: EventOrigin;  // 'custom' | 'system' | 'plugin' | 'monitor' | 'error' | 'log'
  metadata?: { /* ... */ };
}
```

**Creating Events:**

```typescript
import { createEvent, createErrorEvent, createLogEvent } from '@monitext/event';

// Basic event
const event = createEvent('user:action', { action: 'click', target: 'button' });

// Error event
const error = createErrorEvent(new Error('Failed'), {
  function: 'fetchData',
  file: 'api.ts',
  line: 42
});

// Log event
const log = createLogEvent('User logged in', 'info');
```

## 🔌 Plugin Examples

### Example 1: Logger Plugin

```typescript
const LoggerPlugin = createPlugin(
  {
    name: 'logger',
    type: 'consumer',
    opts: T.object({
      properties: {
        format: T.literals({ enum: ['json', 'text'] }),
        level: T.literals({ enum: ['debug', 'info', 'warn', 'error'] })
      },
      required: ['format']
    })
  },
  {
    init(ctx, cfg) {
      ctx.subscribe((event) => {
        if (cfg.format === 'json') {
          console.log(JSON.stringify(event));
        } else {
          console.log(`[${event.type}]`, event.payload);
        }
      });
    }
  }
);
```

### Example 2: Observer Plugin with Namespace

```typescript
const ObserverPlugin = createPlugin(
  {
    name: 'observer',
    type: 'both',
    opts: T.object({
      properties: {
        captureArgs: T.boolean({ default: true })
      }
    })
  },
  {
    init(ctx, cfg) {
      ctx.on('function:call', (event) => {
        console.log('Function called:', event.payload);
      });
    },
    
    namespace: {
      alias: 'obs',
      getHandlers(ctx, cfg) {
        return {
          // Wrap a function to observe it
          safe<T extends (...args: any[]) => any>(fn: T, name?: string): T {
            return ((...args: any[]) => {
              ctx.emit(createEvent('function:call', {
                name: name || fn.name,
                args: cfg?.captureArgs ? args : undefined
              }));
              
              try {
                return fn(...args);
              } catch (error) {
                ctx.emit(createErrorEvent(error as Error));
                throw error;
              }
            }) as T;
          }
        };
      }
    }
  }
);

// Usage
const monitor = new Monitor({
  plugins: [new ObserverPlugin({ captureArgs: true })]
});

const { obs } = monitor.plugins();

const safeAdd = obs.safe((a, b) => a + b, 'add');
safeAdd(5, 3); // Emits 'function:call' event
```

### Example 3: Export Plugin

```typescript
const ExportPlugin = createPlugin(
  {
    name: 'export',
    type: 'consumer',
    opts: T.object({
      properties: {
        endpoint: T.string(),
        apiKey: T.string(),
        batchSize: T.number({ default: 10 })
      },
      required: ['endpoint', 'apiKey']
    })
  },
  {
    init(ctx, cfg) {
      const buffer: EventData[] = [];
      
      ctx.subscribe((event) => {
        buffer.push(event);
        
        if (buffer.length >= cfg.batchSize) {
          flush();
        }
      });
      
      async function flush() {
        if (buffer.length === 0) return;
        
        try {
          await fetch(cfg.endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cfg.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(buffer)
          });
          
          buffer.length = 0;
        } catch (error) {
          console.error('Failed to export events:', error);
        }
      }
      
      // Periodic flush
      setInterval(flush, 5000);
    }
  }
);
```

## 🚦 Rules System

Rules control which events reach which plugins:

```typescript
monitor.rule(ExportPlugin, {
  // Only receive these event types (or events matching the predicate)
  receive: [
    'error',
    'user:action',
    (event) => event.type.startsWith('critical:')
  ],
  
  // Additional filtering
  filter: (event, data) => {
    // Only events with high severity
    return event.severity && ['error', 'critical', 'alert'].includes(event.severity);
  }
});
```

**Rule Properties:**
- `receive?: Array<string | (event) => boolean>` - Event type allowlist
- `filter?: (event, data) => boolean` - Additional filtering logic

## 🪝 Hooks System

Hooks intercept and transform data during emission and reception:

```typescript
// Redact sensitive data before emitting
monitor.hook('redact-sensitive', {
  onEmit(event) {
    if (event.payload && typeof event.payload === 'object') {
      if (event.payload.password) {
        event.payload.password = '***REDACTED***';
      }
    }
  }
});

// Add metadata when receiving
monitor.hook('add-metadata', {
  onReceive(event) {
    if (!event.metadata) event.metadata = {};
    event.metadata.custom = {
      ...event.metadata.custom,
      receivedAt: Date.now()
    };
  }
});

// Remove a hook
monitor.unhook('redact-sensitive');
```

**Hook Properties:**
- `onEmit?: (event) => void | Promise<void>` - Called before event is routed
- `onReceive?: (event) => void | Promise<void>` - Called when plugin receives event

## 📊 Event Helpers

### Severity Levels

```typescript
import { SeverityLevels, isSeverityAtLeast } from '@monitext/event';

// SeverityLevels = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug']

const event = createEvent('error', { message: 'Failed' }, { severity: 'error' });

if (isSeverityAtLeast(event, 'warning')) {
  // Event is warning or higher severity
}
```

### Event Origins

```typescript
import { EventOrigins, hasOrigin } from '@monitext/event';

// EventOrigins = ['custom', 'system', 'plugin', 'monitor', 'error', 'log']

const event = createEvent('test', {}, { origin: 'system' });

if (hasOrigin(event, 'system', 'plugin')) {
  // Event originated from system or plugin
}
```

### Metadata Manipulation

```typescript
import { mergeEventMetadata, cloneEvent } from '@monitext/event';

const event = createEvent('test', { value: 42 });

const enhanced = mergeEventMetadata(event, {
  context: {
    projectId: 'my-project',
    environment: 'production'
  }
});

const copy = cloneEvent(event);
```

## 🎯 Real-World Example

```typescript
import { createPlugin, Monitor, createEvent } from '@monitext/event';
import { T } from '@monitext/typson';

// Create plugins
const logger = new LoggerPlugin({ mode: 'pretty' });
const observer = new ObserverPlugin({ captureArgs: true, captureStack: true });
const exporter = new ExportPlugin({
  endpoint: 'https://api.monitext.io/events',
  apiKey: process.env.MONITEXT_API_KEY,
  batchSize: 50
});

// Setup monitor
const monitor = new Monitor({
  plugins: [logger, observer, exporter]
});

// Configure rules - only export errors and performance data
monitor.rule(ExportPlugin, {
  receive: ['error', 'performance', (e) => e.severity === 'critical'],
  filter: (event) => event.metadata?.context?.environment === 'production'
});

// Add redaction hook
monitor.hook('redact-pii', {
  onEmit(event) {
    // Redact sensitive fields
    const payload = event.payload as any;
    if (payload?.user?.email) {
      payload.user.email = '***@***.***';
    }
  }
});

// Get observer namespace
const { obs } = monitor.plugins();

// Wrap your functions
async function fetchUserData(userId: string) {
  return obs.track(`fetch-user-${userId}`, async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  });
}

const processData = obs.safe((data: any) => {
  // Processing logic
  return data.map(item => item.value);
}, 'processData');

// Use in your application
try {
  const userData = await fetchUserData('123');
  const processed = processData(userData);
} catch (error) {
  // Errors are automatically captured and exported
}
```

## 🔧 API Reference

### Monitor Class

#### Constructor
```typescript
new Monitor(options?: MonitorOptions)
```

#### Methods
- `emit(event: EventData): Promise<void>` - Emit an event
- `on(type: string, handler: (event) => void): void` - Subscribe to event type
- `subscribe(handler: (event) => void): void` - Subscribe to all events
- `off(type: string, handler: (event) => void): boolean` - Unsubscribe from type
- `unsubscribe(handler: (event) => void): boolean` - Unsubscribe from all
- `rule(pluginClass, rule: Rule): void` - Set plugin routing rule
- `hook(id: string, handler: HookHandler): void` - Add hook
- `unhook(id: string): boolean` - Remove hook
- `plugins(): Record<string, any>` - Get plugin namespaces
- `destroy(): void` - Clean up all connections

#### Properties
- `pluginCount: number` - Number of registered plugins

### createPlugin Function

```typescript
createPlugin(descriptor, handlers)
```

**Descriptor:**
```typescript
{
  name: string;
  type: 'consumer' | 'producer' | 'both';
  opts?: Schema; // @monitext/typson schema
}
```

**Handlers:**
```typescript
{
  init(ctx: PluginCtx, cfg: ConfigType): void;
  namespace?: {
    alias: string;
    getHandlers(ctx, cfg): Record<string, Function>;
  };
}
```

## 🧪 Testing

```typescript
import { Monitor, createEvent, createPlugin } from '@monitext/event';
import { T } from '@monitext/typson';

describe('Event System', () => {
  it('should route events to plugins', async () => {
    const received: any[] = [];
    
    const TestPlugin = createPlugin(
      { name: 'test', type: 'consumer' },
      {
        init(ctx) {
          ctx.subscribe((event) => received.push(event));
        }
      }
    );
    
    const monitor = new Monitor({
      plugins: [new TestPlugin(null)]
    });
    
    await monitor.emit(createEvent('test:event', { value: 42 }));
    
    expect(received).toHaveLength(1);
    expect(received[0].payload.value).toBe(42);
  });
});
```

## 🤝 Integration with Monitext Core

This module is designed to be the event backbone for `@monitext/core`. The observer plugin pattern demonstrated here is the foundation for the function observation system.

```typescript
// In @monitext/core
import { Monitor } from '@monitext/event';
import { ObserverPlugin, ExportPlugin } from '@monitext/plugins';

export function createMonitor(config) {
  return new Monitor({
    plugins: [
      new ObserverPlugin(config.observer),
      new ExportPlugin(config.export)
    ]
  });
}
```

## 📄 License

Apache-2.0 © Ctlinker

## 🔗 Related Packages

- [@monitext/core](../../../packages/core) - Main monitoring SDK
- [@monitext/typson](../typson) - Schema-to-type conversion
- [@monitext/color](../color) - Console formatting
- [@monitext/data](../data) - Data structures

---

**Made with ❤️ for the Monitext monitoring framework**