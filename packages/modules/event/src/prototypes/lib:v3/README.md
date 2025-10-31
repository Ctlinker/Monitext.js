# @monitext/event

A powerful, type-safe event system for Node.js applications with plugin-based architecture, hooks, and rules. Built with TypeScript for maximum type safety and developer experience.

## Features

- 🔌 **Plugin Architecture**: Extensible system with consumer, producer, and hybrid plugins
- 🎯 **Type Safety**: Full TypeScript support with compile-time type checking
- 🪝 **Hooks System**: Intercept and transform events at emit/receive points
- 📏 **Rules Engine**: Control which plugins receive which events
- 🔀 **Event Routing**: Sophisticated event distribution with filtering
- 🏷️ **Namespaces**: Expose plugin functionality through typed namespaces
- ⚡ **Performance**: Efficient event routing with minimal overhead
- 🛡️ **Error Handling**: Robust error handling with detailed error messages

## Installation

```bash
npm install @monitext/event
```

## Quick Start

```typescript
import { Monitor, assemblePlugin, describePlugin } from '@monitext/event';

// Create a simple logger plugin
const LoggerPlugin = assemblePlugin(
  describePlugin({
    name: 'logger',
    type: 'consumer',
    opts: null
  }),
  {
    init(ctx) {
      ctx.subscribe((event) => {
        console.log(`[${event.timestamp}] ${event.type}:`, event.payload);
      });
    }
  }
);

// Create a data producer plugin
const DataPlugin = assemblePlugin(
  describePlugin({
    name: 'data-producer',
    type: 'producer',
    opts: null
  }),
  {
    init(ctx) {
      setInterval(() => {
        ctx.emit({
          type: 'data.update',
          payload: { value: Math.random() },
          timestamp: Date.now()
        });
      }, 1000);
    }
  }
);

// Initialize monitor with plugins
const monitor = new Monitor({
  plugins: [
    new LoggerPlugin(null),
    new DataPlugin(null)
  ]
});
```

## Core Concepts

### Monitor

The `Monitor` class is the central event bus that manages plugins, routes events, and applies rules and hooks. It acts as a multibus structure where each plugin lives on its own branch.

```typescript
const monitor = new Monitor({
  plugins: [plugin1, plugin2, plugin3]
});

// Subscribe to all events
monitor.subscribe((event) => {
  console.log('Global event:', event);
});

// Subscribe to specific event types
monitor.on('user.login', (event) => {
  console.log('User logged in:', event.payload);
});

// Emit events directly from monitor
monitor.emit({
  type: 'system.startup',
  payload: { version: '1.0.0' },
  timestamp: Date.now()
});
```

### Plugins

Plugins are self-contained behaviors that extend the monitor's capabilities. There are three types:

- **Consumer**: Only receives/consumes events
- **Producer**: Only emits/produces events  
- **Both**: Can both emit and receive events

#### Creating a Consumer Plugin

```typescript
import { Schema } from '@monitext/typson';

const ConfigSchema = Schema.object({
  level: Schema.enum(['debug', 'info', 'warn', 'error']),
  format: Schema.string().optional()
});

const LoggerPlugin = assemblePlugin(
  describePlugin({
    name: 'advanced-logger',
    type: 'consumer',
    opts: {
      schema: ConfigSchema,
      required: true
    }
  }),
  {
    init(ctx, config) {
      ctx.subscribe((event) => {
        if (shouldLog(event, config.level)) {
          console.log(formatMessage(event, config.format));
        }
      });
      
      ctx.on('error.*', (event) => {
        console.error('ERROR:', event.payload);
      });
    }
  }
);

const logger = new LoggerPlugin({
  level: 'info',
  format: 'json'
});
```

#### Creating a Producer Plugin with Namespace

```typescript
const ApiPlugin = assemblePlugin(
  describePlugin({
    name: 'api-client',
    type: 'producer',
    opts: {
      schema: Schema.object({
        baseUrl: Schema.string(),
        apiKey: Schema.string()
      }),
      required: true
    }
  }),
  {
    init(ctx, config) {
      // Initialize API client
    },
    
    // Expose methods through namespace
    namespace: {
      alias: 'api',
      getHandlers(ctx, config) {
        return {
          get: async (endpoint: string) => {
            const response = await fetch(`${config.baseUrl}/${endpoint}`);
            const data = await response.json();
            
            ctx.emit({
              type: 'api.response',
              payload: { endpoint, data },
              timestamp: Date.now()
            });
            
            return data;
          },
          
          post: async (endpoint: string, body: any) => {
            // Implementation...
          }
        };
      }
    }
  }
);

// Usage
const api = new ApiPlugin({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-key'
});

const monitor = new Monitor({ plugins: [api] });
const { api: apiMethods } = monitor.namespaces();

// Use exposed methods
const userData = await apiMethods.get('users/123');
```

### Rules

Rules control which plugins receive which events. They provide fine-grained control over event routing.

```typescript
monitor.rule({
  targets: [loggerPlugin, databasePlugin],
  receiveEvent: [
    'user.*',           // String pattern
    /^error\./,         // RegExp pattern
    (event) => event.payload.urgent === true  // Function filter
  ]
});
```

### Hooks

Hooks allow you to intercept and transform events during emission or reception.

```typescript
// Global hook that adds metadata to all events
monitor.hook('add-metadata', {
  handlers: {
    emit: [
      (event) => {
        event.metadata = {
          ...event.metadata,
          server: 'prod-01',
          version: '1.2.3'
        };
      }
    ],
    receive: [
      (event) => {
        console.log(`Processing event: ${event.type}`);
      }
    ]
  },
  meta: {
    description: 'Adds server metadata to events',
    priority: 10
  }
});

// Plugin-specific hook
monitor.hook('validation', {
  handlers: {
    receive: [
      (event) => {
        if (!isValidEvent(event)) {
          throw new Error(`Invalid event: ${event.type}`);
        }
      }
    ]
  },
  plugins: [specificPlugin],
  meta: {
    priority: 100  // Higher priority = runs first
  }
});
```

## Event Structure

All events follow a consistent structure:

```typescript
interface EventData<T = any> {
  type: string;                    // Event type (e.g., 'user.login')
  payload: T;                      // Event data
  timestamp: number;               // Unix timestamp
  metadata?: Record<string, any>;  // Optional metadata
}
```

## Advanced Usage

### Plugin Configuration Validation

```typescript
import { Schema } from '@monitext/typson';

const DatabaseSchema = Schema.object({
  host: Schema.string(),
  port: Schema.number().min(1).max(65535),
  database: Schema.string(),
  credentials: Schema.object({
    username: Schema.string(),
    password: Schema.string()
  })
});

const DatabasePlugin = assemblePlugin(
  describePlugin({
    name: 'database',
    type: 'both',
    opts: {
      schema: DatabaseSchema,
      required: true
    }
  }),
  {
    init(ctx, config) {
      // config is fully typed based on schema
      const connection = connect({
        host: config.host,
        port: config.port,
        database: config.database,
        ...config.credentials
      });
    }
  }
);
```

### Error Handling

```typescript
// Monitor-level error handling
monitor.subscribe((event) => {
  if (event.type.startsWith('error.')) {
    console.error('System error:', event.payload);
    
    // Emit recovery event
    monitor.emit({
      type: 'system.recovery',
      payload: { originalError: event.payload },
      timestamp: Date.now()
    });
  }
});

// Plugin-level error handling
const SafePlugin = assemblePlugin(
  describePlugin({
    name: 'safe-processor',
    type: 'consumer',
    opts: null
  }),
  {
    init(ctx) {
      ctx.on('data.process', async (event) => {
        try {
          await processData(event.payload);
        } catch (error) {
          ctx.emit({
            type: 'error.processing',
            payload: { error: error.message, data: event.payload },
            timestamp: Date.now()
          });
        }
      });
    }
  }
);
```

### Complex Event Routing

```typescript
// Route different events to different plugins based on complex conditions
monitor.rule({
  targets: [emailPlugin],
  receiveEvent: [
    (event) => {
      return event.type === 'user.signup' && 
             event.payload.emailVerified === false;
    }
  ]
});

monitor.rule({
  targets: [analyticsPlugin],
  receiveEvent: [
    /^user\.(login|logout|signup)$/,
    (event) => event.metadata?.track !== false
  ]
});
```

## API Reference

### Monitor

#### Constructor
- `new Monitor({ plugins: Plugin[] })`

#### Methods
- `subscribe(handler: (event: EventData) => void): void` - Subscribe to all events
- `on(eventType: string, handler: (event: EventData) => void): void` - Subscribe to specific event types
- `unsubscribe(handler: Function): boolean` - Remove global subscription
- `off(eventType: string, handler: Function): boolean` - Remove event type subscription
- `emit(event: EventData): Promise<void>` - Emit an event
- `rule(rule: Rule): void` - Add routing rule
- `hook(hookId: string, options: BusHookOptions): void` - Add hook
- `namespaces(): Record<string, any>` - Get all plugin namespaces
- `deactivatePlugins({ plugins: Plugin[] }): void` - Deactivate plugins

### Plugin Creation

#### `describePlugin(descriptor)`
Creates a plugin descriptor with metadata.

#### `assemblePlugin(descriptor, implementation)`
Combines descriptor and implementation into a plugin class.

## TypeScript Support

This library is built with TypeScript and provides extensive type safety:

- Plugin configurations are validated against schemas
- Context objects are typed based on plugin type (consumer/producer/both)
- Event payloads can be strongly typed
- Namespace return types are automatically inferred

```typescript
// Fully typed plugin with schema validation
const TypedPlugin = assemblePlugin(
  describePlugin({
    name: 'typed-example',
    type: 'both',
    opts: {
      schema: Schema.object({
        setting: Schema.string()
      }),
      required: true
    }
  }),
  {
    init(ctx, config) {
      // ctx: ConsumerCtx & ProducerCtx
      // config: { setting: string }
    },
    namespace: {
      alias: 'example',
      getHandlers(ctx, config) {
        return {
          doSomething: () => config.setting.toUpperCase()
        };
      }
    }
  }
);

const monitor = new Monitor({ plugins: [new TypedPlugin({ setting: "test" })] });
const { example } = monitor.namespaces();
// example.doSomething() is fully typed
```

## License

Apache-2.0

## Contributing

Contributions are welcome! Please see our contributing guidelines for more details.