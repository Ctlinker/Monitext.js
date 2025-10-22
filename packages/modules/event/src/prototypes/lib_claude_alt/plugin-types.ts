import { Schema, T } from "@monitext/typson";
import { EventData } from "./monitor-types";

/**
 * Defines the possible types/roles a plugin can have in the event bus system.
 *
 * - `consumer`: Only receives/consumes events from the bus
 * - `producer`: Only emits/produces events to the bus
 * - `both`: Can both consume and produce events (bidirectional)
 *
 * @example
 * ```typescript
 * // A logger plugin that only consumes events
 * const loggerType: PluginType = 'consumer';
 *
 * // An HTTP service that produces events
 * const httpType: PluginType = 'producer';
 *
 * // A database plugin that reads and writes
 * const dbType: PluginType = 'both';
 * ```
 */
export type PluginType = "consumer" | "producer" | "both";

/**
 * Context interface provided to consumer plugins.
 * Allows plugins to subscribe to and listen for events on the bus.
 *
 * @example
 * ```typescript
 * function initConsumer(ctx: ConsumerCtx) {
 *   // Subscribe to all events
 *   ctx.subscribe((event) => console.log(event));
 *
 *   // Listen to specific event types
 *   ctx.on('user.login', (event) => console.log('User logged in:', event.payload));
 * }
 * ```
 */
export type ConsumerCtx = {
    /**
     * Subscribe to all events flowing through the bus.
     * This is a global subscription that receives every event regardless of type.
     *
     * @param handler - Callback function invoked for each event
     */
    subscribe(handler: (event: EventData) => void): void;

    /**
     * Subscribe to events of a specific type.
     * Only events matching the specified type will be passed to the handler.
     *
     * @param eventType - The event type to listen for (e.g., 'user.login')
     * @param handler - Callback function invoked when matching events occur
     */
    on(eventType: string, handler: (event: EventData) => void): void;
};

/**
 * Context interface provided to producer plugins.
 * Allows plugins to emit events to the bus.
 *
 * @example
 * ```typescript
 * function initProducer(ctx: ProducerCtx) {
 *   // Emit an event to the bus
 *   ctx.emit({
 *     type: 'data.updated',
 *     payload: { id: 123, value: 'new data' },
 *     timestamp: Date.now()
 *   });
 * }
 * ```
 */
export type ProducerCtx = {
    /**
     * Emit an event to the bus.
     * The event will be routed to all relevant subscribers and handlers.
     *
     * @param event - The event data to emit
     * @returns A promise that resolves when the event has been processed
     */
    emit(event: EventData): Promise<void>;
};

/**
 * Infers the correct context type for a plugin based on its PluginType.
 *
 * - Consumer plugins get ConsumerCtx (subscribe, on)
 * - Producer plugins get ProducerCtx (emit)
 * - Both-type plugins get the intersection of both contexts
 *
 * @template T - The plugin type
 *
 * @example
 * ```typescript
 * type LoggerCtx = PluginCtx<'consumer'>; // ConsumerCtx
 * type HttpCtx = PluginCtx<'producer'>; // ProducerCtx
 * type DatabaseCtx = PluginCtx<'both'>; // ConsumerCtx & ProducerCtx
 * ```
 */
export type PluginCtx<T extends PluginType> = T extends "consumer"
    ? ConsumerCtx
    : T extends "producer"
    ? ProducerCtx
    : ConsumerCtx & ProducerCtx;

/**
 * High-level descriptor for a plugin defining its core characteristics.
 *
 * @template N - The plugin name type (literal string)
 * @template O - The configuration options schema type
 *
 * @example
 * ```typescript
 * const descriptor: PluginDescriptor<'logger', typeof loggerSchema> = {
 *   name: 'logger',
 *   type: 'consumer',
 *   opts: loggerSchema,
 *   optsRequired: true
 * };
 * ```
 */
export type PluginDescriptor<N, O> = {
    /**
     * Unique identifier/name for the plugin
     */
    name: N;

    /**
     * The plugin's type (consumer/producer/both)
     */
    type: PluginType;

    /**
     * Optional schema defining the structure of configuration options
     */
    opts?: O;

    /**
     * Whether configuration options are required when instantiating the plugin
     * @default false
     */
    readonly optsRequired?: boolean;
};

/**
 * Type wrapper for plugin initialization logic.
 *
 * @template S - The plugin type (consumer/producer/both)
 * @template X - The configuration schema type
 *
 * @example
 * ```typescript
 * const initializer: PluginInitializer<'consumer', typeof schema> = {
 *   init(ctx, config) {
 *     ctx.subscribe((event) => {
 *       console.log(`[${config.level}]`, event);
 *     });
 *   }
 * };
 * ```
 */
export type PluginInitializer<S extends PluginType, X> = {
    /**
     * Initialize the plugin with the provided context and configuration.
     * This is called once when the plugin is registered with the monitor.
     *
     * @param ctx - The plugin context (provides emit/subscribe/on methods)
     * @param cfg - The validated configuration object
     */
    init(ctx: PluginCtx<S>, cfg: T.Infer<X>): void;
};

/**
 * Type wrapper for plugin namespace functionality.
 * Namespaces provide a way to expose plugin-specific APIs to the outside world.
 * Only available for producer and both-type plugins.
 *
 * @template S - The plugin type (must be 'producer' or 'both')
 * @template X - The configuration schema type
 * @template N - The namespace alias (literal string)
 * @template H - The handlers object type
 *
 * @example
 * ```typescript
 * const namespace: PluginNamespaces<'both', typeof schema, 'log'> = {
 *   namespace: {
 *     alias: 'log',
 *     getHandlers(ctx, cfg) {
 *       return {
 *         info: (msg: string) => console.log(`[INFO] ${msg}`),
 *         error: (msg: string) => console.error(`[ERROR] ${msg}`)
 *       };
 *     }
 *   }
 * };
 * ```
 */
export type PluginNamespaces<
    S extends PluginType,
    X,
    N extends string,
    H = Record<string, (...params: any[]) => any>,
> = {
    namespace?: {
        /**
         * The namespace alias under which handlers will be exposed
         * Example: 'log' allows access via monitor.namespaces().log.info()
         */
        alias: N;

        /**
         * Factory function that returns the namespace's handler methods.
         * Called with the plugin context and configuration.
         *
         * @param ctx - The plugin context
         * @param cfg - The plugin configuration
         * @returns An object containing handler methods
         */
        getHandlers(ctx: PluginCtx<S>, cfg?: T.Infer<X>): H;
    };
};

/**
 * Infers the available methods on a plugin based on its type.
 *
 * - Consumer plugins: Only have init() method
 * - Producer/Both plugins: Have init() and optional namespace
 *
 * @template S - The plugin type
 * @template O - The configuration options type
 * @template N - The namespace alias
 */
export type PluginMethods<
    S extends PluginType,
    O extends unknown,
    N extends string,
> = S extends "consumer"
    ? PluginInitializer<S, O>
    : PluginInitializer<S, O> & PluginNamespaces<S, O, N>;

/**
 * Represents the complete architecture/core structure of a plugin.
 * Merges the descriptor (metadata) with the methods (behavior).
 *
 * @template N - Plugin name type
 * @template O - Configuration schema type
 * @template P - Plugin descriptor type
 * @template A - Namespace alias type
 * @template X - Plugin methods type
 *
 * @remarks
 * This type is used internally to create a unified plugin core that combines
 * all aspects of a plugin definition into a single cohesive structure.
 */
export type PluginArchitecture<
    N extends string,
    O extends Schema | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        ExtractPluginType<P>,
        ExtractPluginOption<P>,
        A extends undefined ? never : A
    >,
> = {
    /**
     * Merges properties from both descriptor (P) and methods (X)
     */
    [K in keyof (P & X)]: (P & X)[K];
};

/**
 * Extracts the configuration option schema type from a plugin descriptor.
 * Returns undefined if no options are defined.
 *
 * @template P - The plugin descriptor type
 *
 * @example
 * ```typescript
 * type MyPluginOpts = ExtractPluginOption<typeof myPluginDescriptor>;
 * // Result: typeof optionsSchema | undefined
 * ```
 */
export type ExtractPluginOption<P> = P extends { opts: infer X extends Schema }
    ? X
    : undefined;

/**
 * Extracts the plugin type from a plugin descriptor.
 *
 * @template P - The plugin descriptor type
 *
 * @example
 * ```typescript
 * type MyPluginType = ExtractPluginType<typeof myPluginDescriptor>;
 * // Result: 'consumer' | 'producer' | 'both'
 * ```
 */
export type ExtractPluginType<P> = P extends { type: infer Y extends PluginType }
    ? Y
    : never;

// Forward declaration for Plugin class
import { type Plugin } from "./plugin";

/**
 * Infers and unwraps the complete type of a Plugin class instance.
 * This utility type extracts all generic parameters from a Plugin instance.
 *
 * @template T - A plugin instance type
 *
 * @example
 * ```typescript
 * const myPlugin = new MyPluginClass({ config: 'value' });
 * type InferredType = InferPluginInstance<typeof myPlugin>;
 * // InferredType now contains all the plugin's type information
 * ```
 *
 * @remarks
 * This is useful for working with plugin instances in a type-safe manner,
 * especially when passing plugins to other functions or storing them in collections.
 */
export type InferPluginInstance<T> = T extends Plugin<
    infer _N,
    infer _O,
    infer _P,
    infer _A,
    infer _X
>
    ? T
    : never;

/**
 * A generic plugin instance type that accepts any valid plugin configuration.
 *
 * ⚠️ WARNING: This type is intentionally very loose and should NOT be used as a base
 * class or extended from. It exists purely for type-checking scenarios where you need
 * to accept any plugin instance without caring about its specific configuration.
 *
 * @remarks
 * This type is marked as unstable because it accepts any combination of valid plugin
 * parameters. Using it as a constraint may lead to type safety issues. Prefer using
 * `InferPluginInstance<T>` when working with specific plugin instances.
 *
 * @example
 * ```typescript
 * // Good: Accepting any plugin in a collection
 * const plugins: AnyPluginInstance[] = [loggerPlugin, dbPlugin, httpPlugin];
 *
 * // Bad: Don't extend from this
 * // class MyPlugin extends AnyPluginInstance { } // ❌ Don't do this!
 * ```
 */
export type AnyPluginInstance = Plugin<
    string,
    Schema | undefined,
    PluginDescriptor<string, Schema | undefined>,
    string | undefined,
    PluginMethods<PluginType, Schema | undefined, string>
>;

/**
 * Type guard to check if a value is a valid plugin instance.
 *
 * @param value - The value to check
 * @returns True if the value is a plugin instance
 *
 * @example
 * ```typescript
 * if (isPluginInstance(unknownValue)) {
 *   console.log(unknownValue.core.name);
 *   unknownValue.activate(ctx);
 * }
 * ```
 */
export function isPluginInstance(value: any): value is AnyPluginInstance {
    return (
        value !== null &&
        typeof value === "object" &&
        "core" in value &&
        "signature" in value &&
        "activate" in value &&
        typeof value.signature === "function" &&
        typeof value.activate === "function"
    );
}
