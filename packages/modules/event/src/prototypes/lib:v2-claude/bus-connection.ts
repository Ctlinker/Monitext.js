import { BusHookOptions } from "./monitor-types";
import {
    AnyPluginInstance,
    InferPluginInstance,
    PluginCtx,
} from "./plugin-types";

/**
 * Represents a connection between a plugin and the event bus/monitor.
 *
 * This class encapsulates the relationship between a plugin instance and the bus,
 * managing hooks, namespace access, and providing convenient accessors for plugin
 * metadata. Each plugin registered with the monitor gets its own BusConnection.
 *
 * @template P - The plugin instance type
 *
 * @example
 * ```typescript
 * const connection = new BusConnection(loggerPlugin);
 * console.log(connection.name); // 'logger-plugin'
 * console.log(connection.type); // 'consumer'
 *
 * // Set up a hook for this connection
 * connection.setHook('logging', {
 *   handlers: {
 *     emit: [async (event) => console.log('Emitting:', event)]
 *   }
 * });
 * ```
 */
export class BusConnection<P> {
    /**
     * Map of hook IDs to their configuration options.
     * Hooks allow intercepting events at different stages (emit/receive/general).
     */
    private hooks = new Map<string, BusHookOptions>();

    /**
     * Creates a new bus connection for the specified plugin.
     *
     * @param plugin - The plugin instance to connect to the bus
     */
    constructor(public readonly plugin: InferPluginInstance<P>) {}

    /**
     * Gets the plugin's type (consumer/producer/both).
     *
     * This is a convenient accessor that avoids having to navigate through
     * the plugin.core.type path repeatedly.
     *
     * @returns The plugin type
     *
     * @example
     * ```typescript
     * if (connection.type === 'consumer') {
     *   // This plugin only consumes events
     * }
     * ```
     */
    get type(): this["plugin"]["core"]["type"] {
        return this.plugin.core.type;
    }

    /**
     * Gets the plugin's name.
     *
     * @returns The plugin's name as defined in its descriptor
     *
     * @example
     * ```typescript
     * console.log(`Registering ${connection.name}...`);
     * ```
     */
    get name(): string {
        return this.plugin.core.name;
    }

    /**
     * Gets the plugin's unique signature symbol.
     *
     * The signature is used to uniquely identify plugin instances within the monitor
     * and prevent duplicate registrations.
     *
     * @returns The plugin's unique signature symbol
     *
     * @example
     * ```typescript
     * const sig = connection.signature;
     * if (existingSignatures.has(sig)) {
     *   throw new Error('Plugin already registered');
     * }
     * ```
     */
    get signature(): symbol {
        return this.plugin.signature();
    }

    /**
     * Registers a hook for this connection.
     *
     * Hooks allow intercepting and processing events at different stages:
     * - `emit`: When events are emitted by producers
     * - `receive`: When events are received by consumers
     * - `general`: Middleware-like handlers for all events
     *
     * @param id - Unique identifier for this hook
     * @param param - Hook configuration including handlers and metadata
     *
     * @example
     * ```typescript
     * connection.setHook('validation', {
     *   handlers: {
     *     emit: [
     *       async (event) => {
     *         if (!isValid(event)) {
     *           throw new Error('Invalid event format');
     *         }
     *       }
     *     ]
     *   },
     *   meta: {
     *     description: 'Validates events before emission',
     *     priority: 10
     *   }
     * });
     * ```
     */
    public setHook(id: string, param: BusHookOptions): void {
        this.hooks.set(id, param);
    }

    /**
     * Gets a hook by its ID.
     *
     * @param id - The hook identifier
     * @returns The hook options if found, undefined otherwise
     *
     * @example
     * ```typescript
     * const hook = connection.getHook('validation');
     * if (hook) {
     *   console.log('Hook exists:', hook.meta?.description);
     * }
     * ```
     */
    public getHook(id: string): BusHookOptions | undefined {
        return this.hooks.get(id);
    }

    /**
     * Gets all hooks registered for this connection.
     *
     * @returns A map of all hook IDs to their configurations
     *
     * @example
     * ```typescript
     * const allHooks = connection.getAllHooks();
     * console.log(`Connection has ${allHooks.size} hooks`);
     * ```
     */
    public getAllHooks(): ReadonlyMap<string, BusHookOptions> {
        return this.hooks;
    }

    /**
     * Removes a hook by its ID.
     *
     * @param id - The hook identifier to remove
     * @returns true if the hook was found and removed, false otherwise
     *
     * @example
     * ```typescript
     * if (connection.removeHook('validation')) {
     *   console.log('Validation hook removed');
     * }
     * ```
     */
    public removeHook(id: string): boolean {
        return this.hooks.delete(id);
    }

    /**
     * Clears all hooks registered for this connection.
     *
     * @example
     * ```typescript
     * connection.clearHooks();
     * console.log('All hooks cleared');
     * ```
     */
    public clearHooks(): void {
        this.hooks.clear();
    }

    /**
     * Checks if the plugin has a namespace definition.
     *
     * A namespace allows a plugin to expose custom API methods that can be accessed
     * via the monitor's namespaces() method. Only producer and both-type plugins
     * can have namespaces.
     *
     * @returns true if the plugin has a valid namespace configuration
     *
     * @example
     * ```typescript
     * if (connection.hasNamespace()) {
     *   const ns = connection.getNamespace(ctx);
     *   // Access namespace methods
     * }
     * ```
     */
    public hasNamespace(): boolean {
        const core = (this.plugin as AnyPluginInstance).core as any;

        const hasNamespaceProperty = "namespace" in core;
        const hasAlias = typeof core.namespace?.alias === "string";
        const hasGetHandlers = typeof core.namespace?.getHandlers === "function";

        return hasNamespaceProperty && hasAlias && hasGetHandlers;
    }

    /**
     * Retrieves the plugin's namespace handlers.
     *
     * If the plugin defines a namespace, this method calls the getHandlers function
     * and returns an object with the namespace alias as the key and the handlers
     * as the value.
     *
     * @param ctx - The plugin context to pass to the getHandlers function
     * @returns An object with the namespace alias as key and handlers as value, or null if no namespace
     *
     * @example
     * ```typescript
     * const ctx = monitor.createPluginContext('both', signature);
     * const namespace = connection.getNamespace(ctx);
     *
     * if (namespace) {
     *   // For a logger plugin with alias 'log':
     *   // namespace = { log: { info: fn, error: fn, debug: fn } }
     *   namespace.log.info('Hello from namespace!');
     * }
     * ```
     */
    public getNamespace(ctx: PluginCtx<this["type"]>): Record<string, any> | null {
        if (!this.hasNamespace()) {
            return null;
        }

        try {
            const core = this.plugin.core as any;
            const alias = core.namespace.alias as string;

            // Call getHandlers with context and config
            const handlers = core.namespace.getHandlers(
                ctx,
                this.plugin.config
            );

            if (!handlers || typeof handlers !== "object") {
                console.warn(
                    `[@monitext/event]: Plugin "${this.plugin.core.name}" namespace.getHandlers() returned invalid value (expected object)`
                );
                return null;
            }

            return { [alias]: handlers };
        } catch (error) {
            console.error(
                `[@monitext/event]: Failed to invoke namespace for "${this.plugin.core.name}":`,
                error
            );
            return null;
        }
    }

    /**
     * Gets the number of hooks registered for this connection.
     *
     * @returns The count of registered hooks
     *
     * @example
     * ```typescript
     * console.log(`Connection has ${connection.hookCount} hooks`);
     * ```
     */
    public get hookCount(): number {
        return this.hooks.size;
    }

    /**
     * Checks if this connection is for a consumer-type plugin.
     *
     * @returns true if the plugin is a consumer or both type
     *
     * @example
     * ```typescript
     * if (connection.isConsumer) {
     *   // Setup consumer-specific logic
     * }
     * ```
     */
    public get isConsumer(): boolean {
        return this.type === "consumer" || this.type === "both";
    }

    /**
     * Checks if this connection is for a producer-type plugin.
     *
     * @returns true if the plugin is a producer or both type
     *
     * @example
     * ```typescript
     * if (connection.isProducer) {
     *   // Setup producer-specific logic
     * }
     * ```
     */
    public get isProducer(): boolean {
        return this.type === "producer" || this.type === "both";
    }

    /**
     * Gets a string representation of this connection for debugging.
     *
     * @returns A debug string with plugin name and type
     *
     * @example
     * ```typescript
     * console.log(connection.toString());
     * // Output: "BusConnection(logger-plugin:consumer)"
     * ```
     */
    public toString(): string {
        return `BusConnection(${this.name}:${this.type})`;
    }
}
