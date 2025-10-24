import {
    ConsumerCtx,
    InferPluginContext,
    InferPluginMethods,
    PluginDescriptor,
    PluginType,
    ProducerCtx,
} from "./plugin-types";
import { Plugin } from "./plugin-class";
import { BusHookOptions, EventData } from "./bus-types";
import { createContext } from "./bus-tools";

export class Connection<T> {
    constructor(
        public readonly plugin: T extends {
            core: infer _Core extends (
                & PluginDescriptor<
                    infer _N,
                    infer _T,
                    infer _O
                >
                & InferPluginMethods<infer _T, infer _O, infer _A>
            );
        } ? T & Plugin<_Core>
            : never,
    ) {}

    public get type(): this["plugin"]["core"]["type"] {
        return this.plugin.core.type;
    }

    public get name(): this["plugin"]["core"]["name"] {
        return this.plugin.core.name;
    }

    public get signature(): symbol {
        return this.plugin.signature();
    }

    public get isProducer(): boolean {
        return this.type === "producer" || this.type === "both";
    }

    public get isConsumer(): boolean {
        return this.type === "consumer" || this.type === "both";
    }

    public toString(): string {
        return `BusConnection(${this.name}:${this.type})`;
    }

    private hooks = new Map<string, BusHookOptions>();

    public get hookCount(): number {
        return this.hooks.size;
    }

    public setHook(id: string, param: BusHookOptions): void {
        this.hooks.set(id, param);
    }

    public getHook(id: string): BusHookOptions | undefined {
        return this.hooks.get(id);
    }

    public getAllHooks(): Map<string, BusHookOptions> {
        return this.hooks;
    }

    public removeHook(id: string): boolean {
        return this.hooks.delete(id);
    }

    public clearHooks(): void {
        this.hooks.clear();
    }

    /**
     * Map of event types to their registered handlers.
     * Used for type-specific event routing (via `on` method).
     */
    public eventHandlers = new Map<string, Set<(event: EventData) => void>>();

    /**
     * Set of global subscribers that receive all events regardless of type.
     */
    public globalSubscribers = new Set<(event: EventData) => void>();

    /**
     * Activate the connection's plugin with a scoped context
     */
    public activate(ctx: InferPluginContext<this["type"]>) {
        const context = this.scopeContext(this.type, ctx);
        return this.plugin.activate(context);
    }

    private scopeContext<T extends PluginType>(
        type: T,
        ctx: InferPluginContext<T>,
    ) {
        const context = ctx as ProducerCtx & ConsumerCtx;

        const pluginContext = createContext({
            type: type,
            emit: context?.emit,
            globalSubscribers: this.globalSubscribers,
            eventHandlers: this.eventHandlers,
        });

        return pluginContext as InferPluginContext<T>;
    }

    public hasNamespace(): boolean {
        const core = this.plugin.core as any;

        const hasNamespaceProperty = "namespace" in core;
        const hasAlias = typeof core.namespace?.alias === "string";
        const hasGetHandlers =
            typeof core.namespace?.getHandlers === "function";

        return hasNamespaceProperty && hasAlias && hasGetHandlers;
    }

    public getNamespace(ctx: ProducerCtx) {
        if (!this.hasNamespace()) {
            return null;
        }

        try {
            const core = this.plugin.core as any;
            const alias = core.namespace.alias as string;
            const context = this.scopeContext("producer", ctx);
            // Call getHandlers with context and config
            const handlers = core.namespace.getHandlers(
                context,
                this.plugin.config,
            );

            if (!handlers || typeof handlers !== "object") {
                console.warn(
                    `[@monitext/event]: Plugin "${this.plugin.core.name}" namespace.getHandlers() returned invalid value (expected object)`,
                );
                return null;
            }

            return { [alias]: handlers };
        } catch (error) {
            console.error(
                `[@monitext/event]: Failed to invoke namespace for "${this.plugin.core.name}":`,
                error,
            );
            return null;
        }
    }
}
