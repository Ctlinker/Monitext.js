import { Logger, obsPlugin } from "./plugin";
import { InferPluginInstance, PluginCtx, PluginType } from "./plugin-types";
import { BusHookOptions, EventData } from "./monitor-types";
import { BusConnection } from "./bus-connection";

export class Monitor<P extends Array<InferPluginInstance<any>>> {
    public readonly plugins: [...P];

    private connections = new Map<
        symbol,
        { [K in keyof P]: BusConnection<P[K]> }[number]
    >();

    private hooks = new Map<string, BusHookOptions>();
    private eventHandlers = new Map<string, Set<(event: EventData) => void>>();
    private globalSubscribers = new Set<(event: EventData) => void>();

    constructor(param: { plugins: [...P] }) {
        this.plugins = { ...param.plugins };
        for (const plugin in this.plugins) {
            this.registerPlugin<any>(plugin);
        }
    }

    private registerPlugin<X>(plugin: InferPluginInstance<X>) {
        const signature = plugin.signature();

        if (this.connections.has(signature)) {
            throw new Error(
                `[@monitext/event]: Plugin with signature already registered`,
            );
        }

        const connection = new BusConnection(plugin);
        this.connections.set(signature, connection);

        // Create context with actual implementations
        const ctx = this.createPluginContext(
            connection.type,
            signature,
        );

        // Activate plugin with context
        const error = plugin.activate(ctx);

        if (error) {
            this.connections.delete(signature);
            throw error;
        }
    }

    /**
     * Create a properly typed context for a plugin
     */
    private createPluginContext<P extends PluginType>(
        pluginType: P,
        signature: symbol,
    ): PluginCtx<P> {
        let ctx: any = {};

        // Consumer methods
        if (pluginType === "consumer" || pluginType === "both") {
            ctx.subscribe = (handler: (event: EventData) => void) => {
                this.globalSubscribers.add(handler);
            };

            ctx.on = (
                eventType: string,
                handler: (event: EventData) => void,
            ) => {
                if (!this.eventHandlers.has(eventType)) {
                    this.eventHandlers.set(eventType, new Set());
                }
                this.eventHandlers.get(eventType)!.add(handler);
            };
        }

        // Producer methods
        if (pluginType === "producer" || pluginType === "both") {
            ctx.emit = async (event: EventData) => {
                await this.routeEvent(event, signature);
            };
        }

        return Object.freeze(ctx);
    }

    /**
     * Route an event to appropriate handlers based on rules and hooks
     */
    private async routeEvent(
        event: EventData,
        sourceSignature: symbol,
    ): Promise<void> {
        // Route to global subscribers
        for (const handler of this.globalSubscribers) {
            try {
                handler(event);
            } catch (error) {
                console.error(
                    `[@monitext/event]: Global subscriber failed:`,
                    error,
                );
            }
        }

        // Route to specific event type handlers
        const handlers = this.eventHandlers.get(event.type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                } catch (error) {
                    console.error(
                        `[@monitext/event]: Handler for "${event.type}" failed:`,
                        error,
                    );
                }
            }
        }
    }

    public namespaces(): {
        [
            K in keyof [...P] as [...P][K] extends
                { core: { namespace: { alias: infer X extends string } } } ? X
                : never
        ]: [...P][K] extends {
            core: {
                namespace: {
                    getHandlers: infer X extends (...param: any[]) => any;
                };
            };
        } ? ReturnType<X>
            : never;
    } {
        let namespaces: Record<string, any> = {};

        for (const [signature, connection] of this.connections) {
            if (connection.hasNamespace()) {
                const ctx = this.createPluginContext(
                    connection.type,
                    signature,
                );
                namespaces = { ...namespaces, ...connection.getNamespace(ctx) };
            }
        }

        return namespaces as any;
    }

    /**
     * Subscribe to all events
     */
    public subscribe(handler: (event: EventData) => void): void {
        this.globalSubscribers.add(handler);
    }

    /**
     * Subscribe to specific event type
     */
    public on(eventType: string, handler: (event: EventData) => void): void {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, new Set());
        }
        this.eventHandlers.get(eventType)!.add(handler);
    }

    /**
     * Unsubscribe from all events
     */
    public unsubscribe(handler: (event: EventData) => void): boolean {
        return this.globalSubscribers.delete(handler);
    }

    /**
     * Unsubscribe from specific event type
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
     * Add a hook to intercept data flow
     */
    public hook(hookId: string, param: BusHookOptions): void {
        if (!param.plugins) {
            if (this.hooks.has(hookId)) {
                console.warn(
                    `[@monitext/event]: Hook "${hookId}" already exists, overwriting`,
                );
            }
            this.hooks.set(hookId, param);
            return;
        }

        for (const plugin of param.plugins) {
            const conn = this.connections.get(plugin.signature());
            if (!conn) {
                console.warn(
                    `[@monitext/event]: Hook "${hookId}" does not point to any existing plugin on the bus`,
                );
                continue;
            }
            conn.setHook(hookId, param);
        }
    }

    /**
     * Get number of registered plugins
     */
    public get pluginCount(): number {
        return this.connections.size;
    }
}

const m = new Monitor({
    plugins: [
        Logger,
        new obsPlugin({}),
    ],
});
