import { createContext, primitiveObjClone } from "./bus-tools";
import { BusHookOptions, EventData } from "./bus-types";
import { Connection } from "./connection";
import {
    InferPluginContext,
    InferPluginInstance,
    PluginType,
} from "./plugin-types";

import type { Plugin } from "./plugin-class";
import { HookManager } from "./bus-hook";

export class Monitor<P extends (InferPluginInstance<any>)[]> {
    /**
     * Plugin storage that extends the capability/behavior on the bus
     */
    public readonly plugins: [...P];

    private signature = Symbol();

    /**
     * Map of plugin signatures to their bus connections.
     * Each plugin gets a unique connection that manages its interaction with the bus.
     */
    private connections = new Map<
        symbol,
        Connection<P[number]>
    >();

    private hookManager = new HookManager();

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
            const error = connection.activate(ctx);

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

    public deactivatePlugins(param: { plugins: Plugin<any>[] }) {
        for (const plugin of param.plugins) {
            const signature = plugin.signature();
            const target = this.connections.get(signature);
            if (!target) {
                console.warn(
                    `[@monitext/event] Plugin "${plugin.core?.name}" could bot be found on bus, cannot deactivate it`,
                );
                continue;
            }
            this.connections.delete(signature);
        }
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
        const emitFn = async (event: EventData): Promise<void> => {
            await this.routeEvent(event, signature);
        };

        const context = createContext({
            emit: emitFn,
            type: pluginType,
            globalSubscribers: this.globalSubscribers,
            eventHandlers: this.eventHandlers,
        });

        return context;
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

    /**
     * Emit an event to the bus
     */
    public async emit(event: EventData): Promise<void> {
        await this.routeEvent(event, this.signature);
    }

    private async routeEvent(
        event: EventData,
        sourceSignature: symbol,
    ): Promise<void> {
        const connection = this.connections.get(sourceSignature);

        if (connection) {
            await this.hookManager.executeMultipleHooks({
                hookTypes: ["emit"],
                event,
                sourceSignature,
                hookProvider: connection.getAllHooks(),
            });
        } else if (this.signature === sourceSignature) {
            await this.hookManager.executeMultipleHooks({
                hookTypes: ["emit"],
                event,
                sourceSignature,
                hookProvider: this.hookManager.hooks,
            });
        } else {
            throw new Error(
                "[@monitext/event] This should not be possible, event of unknown source detected",
            );
        }

        await this.hookManager.executeMultipleHooks({
            hookTypes: ["receive"],
            event,
            sourceSignature,
            hookProvider: this.hookManager.hooks,
        });

        // Route to specific event subscribers/type handlers
        await Promise.allSettled(
            Array.from(this.connections.values()).map(
                async (connection) => {
                    const clonedEvent = primitiveObjClone(event);

                    await this.hookManager.executeMultipleHooks({
                        hookTypes: ["receive"],
                        event: clonedEvent,
                        sourceSignature,
                        hookProvider: connection.getAllHooks(),
                    });

                    await this.executeSubscribers(
                        clonedEvent,
                        connection.globalSubscribers,
                    );

                    await this.executeEventHandlers(
                        clonedEvent,
                        connection.eventHandlers,
                    );
                },
            ),
        );
    }

    async executeSubscribers(
        event: EventData,
        param: Set<(event: EventData<any>) => void>,
    ) {
        for (const handler of param) {
            try {
                await handler(event);
            } catch (error) {
                console.error(
                    `[@monitext/event]: Global subscriber failed for event "${event.type}":`,
                    error,
                );
            }
        }
    }

    async executeEventHandlers(
        event: EventData,
        param: Map<string, Set<(event: EventData<any>) => void>>,
    ) {
        const handlers = param.get(event.type);
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
    }

    public hook(hookId: string, param: BusHookOptions): void {
        this.hookManager.addHook({
            hookId,
            param,
            connections: this.connections,
        });
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
                    "producer",
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
}
