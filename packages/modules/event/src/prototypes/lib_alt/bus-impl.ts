import { BusHookOptions, EventData } from "./bus-types";
import { Connection } from "./connection";
import {
    InferPluginContext,
    InferPluginInstance,
    PluginType,
} from "./plugin-types";

export class Monitor<P extends (InferPluginInstance<any>)[]> {
    public readonly plugins: [...P];

    /**
     * Map of plugin signatures to their bus connections.
     * Each plugin gets a unique connection that manages its interaction with the bus.
     */
    private connections = new Map<
        symbol,
        Connection<P[number]>
    >();

    /**
     * Map of global hook IDs to their configurations.
     * Global hooks apply to all plugins on the bus.
     */
    private hooks = new Map<string, BusHookOptions>();

    /**
     * Map of event types to their registered handlers.
     * Used for type-specific event routing (via `on` method).
     */
    private eventHandlers = new Map<string, Set<(event: EventData) => void>>();

    /**
     * Set of global subscribers that receive all events regardless of type.
     */
    private globalSubscribers = new Set<(event: EventData) => void>();

    /**
     * Flag to track if the monitor has been started/initialized.
     */
    private isStarted: boolean = false;

    constructor(param: {
        plugins: [...P];
    }) {
        this.plugins = param.plugins;
        for (const plugin of this.plugins) {
            this.registerPlugin(plugin);
        }
        this.isStarted = true;
    }

    private registerPlugin<X>(plugin: InferPluginInstance<X>): void {
        const signature = plugin.signature();

        // Check for duplicate registration
        if (this.connections.has(signature)) {
            throw new Error(
                `[@monitext/event]: Plugin "${plugin.core.name}" with signature already registered`,
            );
        }

        // Create the connection
        const connection = new Connection(plugin);
        this.connections.set(signature, connection);

        try {
            // Create context with actual implementations
            const ctx = this.createPluginContext(
                connection.type,
                signature,
            );

            // Activate plugin with context
            const error = plugin.activate(ctx);

            if (error) {
                // Rollback on activation failure
                this.connections.delete(signature);
                throw error;
            }
        } catch (error) {
            // Ensure cleanup on any error
            this.connections.delete(signature);
            throw new Error(
                `[@monitext/event]: Failed to register plugin "${plugin.core.name}"`,
                { cause: error },
            );
        }
    }

    public namespaces(): Readonly<
        {
            [
                K in keyof [...P] as [...P][K] extends {
                    core: { namespace: { alias: infer X extends string } };
                } ? X
                    : never
            ]: [...P][K] extends {
                core: {
                    namespace: {
                        getHandlers: infer X extends (...param: any[]) => any;
                    };
                };
            } ? ReturnType<X>
                : never;
        }
    > {
        const namespaces = {};

        for (const [signature, connection] of this.connections) {
            if (connection.hasNamespace()) {
                const ctx = this.createPluginContext(
                    connection.type,
                    signature,
                );
                const namespace = connection.getNamespace(ctx);

                if (namespace) {
                    Object.assign(namespaces, namespace);
                }
            }
        }

        return Object.freeze(namespaces) as any;
    }

    /**
     * Creates a properly typed context for a plugin based on its type.
     *
     * The context provides the appropriate methods:
     * - Consumer: subscribe, on
     * - Producer: emit
     * - Both: subscribe, on, emit
     *
     * @template T - The plugin type (consumer/producer/both)
     * @param pluginType - The type of plugin
     * @param signature - The plugin's unique signature
     * @returns A frozen context object with the appropriate methods
     *
     * @private
     */
    private createPluginContext<T extends PluginType>(
        pluginType: T,
        signature: symbol,
    ): InferPluginContext<T> {
        const ctx: any = {};

        // Add consumer methods
        if (pluginType === "consumer" || pluginType === "both") {
            ctx.subscribe = (handler: (event: EventData) => void): void => {
                this.globalSubscribers.add(handler);
            };

            ctx.on = (
                eventType: string,
                handler: (event: EventData) => void,
            ): void => {
                if (!this.eventHandlers.has(eventType)) {
                    this.eventHandlers.set(eventType, new Set());
                }
                this.eventHandlers.get(eventType)!.add(handler);
            };
        }

        // Add producer methods
        if (pluginType === "producer" || pluginType === "both") {
            ctx.emit = async (event: EventData): Promise<void> => {
                await this.routeEvent(event, signature);
            };
        }

        // Freeze context to prevent modification
        return Object.freeze(ctx);
    }

    /**
     * Routes an event to appropriate handlers based on rules and hooks.
     *
     * This method:
     * 1. Executes pre-emit hooks (if applicable)
     * 2. Routes to global subscribers
     * 3. Routes to type-specific handlers
     * 4. Executes post-receive hooks (if applicable)
     * 5. Handles errors gracefully without stopping propagation
     *
     * @param event - The event to route
     * @param sourceSignature - The signature of the plugin that emitted the event
     * @returns A promise that resolves when all handlers have been executed
     *
     * @private
     */
    private async routeEvent(
        event: EventData,
        sourceSignature: symbol,
    ): Promise<void> {
        // Execute emit hooks (from the source plugin)
        await this.executeHooks("emit", event, sourceSignature);

        // Route to global subscribers
        for (const handler of this.globalSubscribers) {
            try {
                await handler(event);
            } catch (error) {
                console.error(
                    `[@monitext/event]: Global subscriber failed for event "${event.type}":`,
                    error,
                );
            }
        }

        // Route to specific event type handlers
        const handlers = this.eventHandlers.get(event.type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    await handler(event);
                } catch (error) {
                    console.error(
                        `[@monitext/event]: Handler for "${event.type}" failed:`,
                        error,
                    );
                }
            }
        }

        // Execute receive hooks (for consuming plugins)
        await this.executeHooks("receive", event, sourceSignature);

        // Execute general hooks
        await this.executeHooks("general", event, sourceSignature);
    }

    public hook(hookId: string, param: BusHookOptions): void {
        if (!param.plugins || param.plugins.length === 0) {
            // Global hook
            if (this.hooks.has(hookId)) {
                console.warn(
                    `[@monitext/event]: Global hook "${hookId}" already exists, overwriting`,
                );
            }
            this.hooks.set(hookId, param);
            return;
        }

        // Plugin-specific hooks
        for (const plugin of param.plugins) {
            const conn = this.connections.get(plugin.signature());
            if (!conn) {
                console.warn(
                    `[@monitext/event]: Hook "${hookId}" references plugin "${
                        plugin.core?.name || "unknown"
                    }" which is not registered on this monitor`,
                );
                continue;
            }
            conn.setHook(hookId, param);
        }
    }

    /**
     * Executes hooks of a specific type for an event.
     *
     * @param hookType - The type of hook to execute (emit/receive/general)
     * @param event - The event being processed
     * @param sourceSignature - The signature of the plugin that originated the event
     *
     * @private
     */
    private async executeHooks(
        hookType: "emit" | "receive" | "general",
        event: EventData,
        sourceSignature: symbol,
    ): Promise<void> {
        // Execute global hooks
        for (const [hookId, hookOptions] of this.hooks) {
            const handlers = hookOptions.handlers[hookType];
            if (handlers) {
                await this.runHookHandlers(hookId, handlers, event);
            }
        }

        // Execute plugin-specific hooks
        const connection = this.connections.get(sourceSignature);
        if (connection) {
            for (const [hookId, hookOptions] of connection.getAllHooks()) {
                const handlers = hookOptions.handlers[hookType];
                if (handlers) {
                    await this.runHookHandlers(hookId, handlers, event);
                }
            }
        }
    }

    /**
     * Runs an array of hook handlers for an event.
     *
     * @param hookId - The ID of the hook being executed
     * @param handlers - The array of handlers to run
     * @param event - The event being processed
     *
     * @private
     */
    private async runHookHandlers(
        hookId: string,
        handlers: ((event: EventData) => void | Promise<void>)[],
        event: EventData,
    ): Promise<void> {
        for (const handler of handlers) {
            try {
                await handler(event);
            } catch (error) {
                console.error(
                    `[@monitext/event]: Hook "${hookId}" handler failed for event "${event.type}":`,
                    error,
                );
            }
        }
    }

    /**
     * Emit an event to the bus
     */
    public async emit(event: EventData): Promise<void> {
        await this.routeEvent(event, Symbol.for("@monitext/monitor"));
    }

    private wrapEmit(emitFn: (...args: any[]) => Promise<any>) {
        return new Proxy(emitFn, {
            apply(target, thisArg, argumentsList) {
                const result = target.apply(thisArg, argumentsList);
                if (result instanceof Promise) {
                    console.warn(
                        "⚠️ Warning: emit() returned a Promise. Did you forget to await?",
                    );
                }
                return result;
            },
        });
    }

    /**
     * Subscribes a handler to all events flowing through the bus.
     *
     * Global subscribers receive every event regardless of type or source.
     * Use this for cross-cutting concerns like logging, monitoring, or debugging.
     *
     * @param handler - The function to call for each event
     *
     * @example
     * ```typescript
     * monitor.subscribe((event) => {
     *   console.log(`[${new Date().toISOString()}] ${event.type}`, event.payload);
     * });
     * ```
     */
    public subscribe(handler: (event: EventData) => void): void {
        this.globalSubscribers.add(handler);
    }

    /**
     * Subscribes a handler to events of a specific type.
     *
     * Type-specific handlers only receive events matching the specified type string.
     * Multiple handlers can be registered for the same event type.
     *
     * @param eventType - The event type to listen for (e.g., 'user.login', 'data.update')
     * @param handler - The function to call when matching events occur
     *
     * @example
     * ```typescript
     * monitor.on('user.login', (event) => {
     *   console.log('User logged in:', event.payload.userId);
     * });
     *
     * monitor.on('user.logout', (event) => {
     *   console.log('User logged out:', event.payload.userId);
     * });
     * ```
     */
    public on(eventType: string, handler: (event: EventData) => void): void {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, new Set());
        }
        this.eventHandlers.get(eventType)!.add(handler);
    }

    /**
     * Unsubscribes a handler from the global subscription.
     *
     * @param handler - The handler function to remove
     * @returns true if the handler was found and removed, false otherwise
     *
     * @example
     * ```typescript
     * const handler = (event) => console.log(event);
     * monitor.subscribe(handler);
     *
     * // Later...
     * monitor.unsubscribe(handler); // Returns true
     * monitor.unsubscribe(handler); // Returns false (already removed)
     * ```
     */
    public unsubscribe(handler: (event: EventData) => void): boolean {
        return this.globalSubscribers.delete(handler);
    }

    /**
     * Unsubscribes a handler from a specific event type.
     *
     * @param eventType - The event type to unsubscribe from
     * @param handler - The handler function to remove
     * @returns true if the handler was found and removed, false otherwise
     *
     * @example
     * ```typescript
     * const loginHandler = (event) => console.log('Login:', event);
     * monitor.on('user.login', loginHandler);
     *
     * // Later...
     * monitor.off('user.login', loginHandler); // Returns true
     * ```
     */
    public off(
        eventType: string,
        handler: (event: EventData) => void,
    ): boolean {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            return handlers.delete(handler);
        }
        return false;
    }
}
