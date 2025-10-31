import { T } from "@monitext/typson";
import { BusConnection } from "./bus-connection";
import type { InferPluginInstance, PluginCtx } from "./plugin-types";

/**
 * Event data structure
 */
export interface EventData<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * Rule definition for filtering events to plugins
 */
export interface Rule {
    receive?: Array<string | ((event: EventData) => boolean)>;
    filter?: (event: EventData, data: any) => boolean;
}

/**
 * Hook handler for intercepting data flow
 */
export interface HookHandler {
    onEmit?: (data: any) => void | Promise<void>;
    onReceive?: (data: any) => void | Promise<void>;
}

/**
 * Monitor configuration options
 */
export interface MonitorOptions {
    plugins?: Array<InferPluginInstance<any>>;
}

/**
 * Monitor - A multibus-like structure for managing event-driven plugin communication
 */
export class Monitor {
    private connections = new Map<symbol, BusConnection<any>>();
    private rules = new Map<symbol, Rule>();
    private hooks = new Map<string, HookHandler>();
    private eventHandlers = new Map<string, Set<(event: EventData) => void>>();
    private globalSubscribers = new Set<(event: EventData) => void>();

    constructor(options: MonitorOptions = {}) {
        if (options.plugins) {
            options.plugins.forEach((plugin) => {
                this.registerPlugin(plugin);
            });
        }
    }

    /**
     * Register a plugin with the monitor
     */
    private registerPlugin(plugin: InferPluginInstance<any>): void {
        const signature = plugin.signature();

        if (this.connections.has(signature)) {
            throw new Error(
                `[@monitext/event]: Plugin with signature already registered`
            );
        }

        const connection = new BusConnection(plugin);
        this.connections.set(signature, connection);

        // Create context with actual implementations
        const ctx = this.createPluginContext(plugin, signature);

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
    private createPluginContext(
        plugin: InferPluginInstance<any>,
        signature: symbol
    ): PluginCtx<any> {
        const pluginType = plugin.core.type;
        let ctx: any = {};

        // Consumer methods
        if (pluginType === "consumer" || pluginType === "both") {
            ctx.subscribe = (handler: (event: EventData) => void) => {
                this.globalSubscribers.add(handler);
            };

            ctx.on = (eventType: string, handler: (event: EventData) => void) => {
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
    private async routeEvent(event: EventData, sourceSignature: symbol): Promise<void> {
        // Apply onEmit hooks
        for (const [hookId, hook] of this.hooks) {
            if (hook.onEmit) {
                try {
                    await hook.onEmit(event);
                } catch (error) {
                    console.error(`[@monitext/event]: Hook "${hookId}" onEmit failed:`, error);
                }
            }
        }

        // Route to global subscribers
        for (const handler of this.globalSubscribers) {
            try {
                handler(event);
            } catch (error) {
                console.error(`[@monitext/event]: Global subscriber failed:`, error);
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
                        error
                    );
                }
            }
        }

        // Route based on rules
        for (const [signature, rule] of this.rules) {
            if (signature === sourceSignature) continue; // Don't route back to source

            if (this.shouldReceiveEvent(event, rule)) {
                // Apply onReceive hooks
                for (const [hookId, hook] of this.hooks) {
                    if (hook.onReceive) {
                        try {
                            await hook.onReceive(event);
                        } catch (error) {
                            console.error(
                                `[@monitext/event]: Hook "${hookId}" onReceive failed:`,
                                error
                            );
                        }
                    }
                }
            }
        }
    }

    /**
     * Determine if an event should be received based on rules
     */
    private shouldReceiveEvent(event: EventData, rule: Rule): boolean {
        // Check receive filters
        if (rule.receive) {
            const matches = rule.receive.some((filter) => {
                if (typeof filter === "string") {
                    return event.type === filter;
                } else if (typeof filter === "function") {
                    try {
                        return filter(event);
                    } catch (error) {
                        console.error(
                            "[@monitext/event]: Rule filter function failed:",
                            error
                        );
                        return false;
                    }
                }
                return false;
            });

            if (!matches) return false;
        }

        // Check additional filter
        if (rule.filter) {
            try {
                return rule.filter(event, event.payload);
            } catch (error) {
                console.error("[@monitext/event]: Rule filter failed:", error);
                return false;
            }
        }

        return true;
    }

    /**
     * Define rules for plugin event routing
     */
    public rule(pluginClass: { signature: () => symbol }, ruleConfig: Rule): void {
        const signature = pluginClass.signature();

        if (!this.connections.has(signature)) {
            throw new Error(
                `[@monitext/event]: Cannot set rules for unregistered plugin`
            );
        }

        this.rules.set(signature, ruleConfig);
    }

    /**
     * Define multiple rules at once
     */
    public setRules(rules: Record<string, Rule>): void {
        // This would need a plugin name -> signature mapping
        // For now, use the rule() method with plugin classes directly
        console.warn(
            "[@monitext/event]: setRules with string keys not yet implemented. Use rule() method instead."
        );
    }

    /**
     * Add a hook to intercept data flow
     */
    public hook(hookId: string, handler: HookHandler): void {
        if (this.hooks.has(hookId)) {
            console.warn(
                `[@monitext/event]: Hook "${hookId}" already exists, overwriting`
            );
        }
        this.hooks.set(hookId, handler);
    }

    /**
     * Remove a hook
     */
    public unhook(hookId: string): boolean {
        return this.hooks.delete(hookId);
    }

    /**
     * Get plugin namespaces for accessing helper methods
     */
    public plugins(): Record<string, any> {
        const namespaces: Record<string, any> = {};

        for (const [signature, connection] of this.connections) {
            const plugin = connection.plugin;
            const core = plugin.core;

            if ("namespace" in core && core.namespace) {
                const alias = core.namespace.alias;
                const ctx = this.createPluginContext(plugin, signature);

                try {
                    namespaces[alias as string] = core.namespace.getHandlers(ctx as any, undefined);
                } catch (error) {
                    console.error(
                        `[@monitext/event]: Failed to get namespace for "${alias}":`,
                        error
                    );
                }
            }
        }

        return namespaces;
    }

    /**
     * Emit an event to the bus
     */
    public async emit(event: EventData): Promise<void> {
        await this.routeEvent(event, Symbol.for("@monitext/monitor"));
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
    public off(eventType: string, handler: (event: EventData) => void): boolean {
        const handlers = this.eventHandlers.get(eventType);
        if (handlers) {
            return handlers.delete(handler);
        }
        return false;
    }

    /**
     * Get number of registered plugins
     */
    public get pluginCount(): number {
        return this.connections.size;
    }

    /**
     * Clean up all connections and handlers
     */
    public destroy(): void {
        this.connections.clear();
        this.rules.clear();
        this.hooks.clear();
        this.eventHandlers.clear();
        this.globalSubscribers.clear();
    }
}
