import { BusHookOptions } from "./monitor-types";
import { Logger } from "./plugin";
import {
    AnyPluginInstance,
    InferPluginInstance,
    PluginCtx,
} from "./plugin-types";

export class BusConnection<P> {
    private hooks = new Map<string, BusHookOptions>();

    constructor(public readonly plugin: InferPluginInstance<P>) {}

    /**
     * Get the plugin's type (consumer/producer/both)
     */
    get type(): this["plugin"]["core"]["type"] {
        return this.plugin.core.type;
    }

    /**
     * Get the plugin's name
     */
    get name(): string {
        return this.plugin.core.name;
    }

    /**
     * Get the plugin's signature
     */
    get signature() {
        return this.plugin.signature();
    }

    public setHook(id: string, param: BusHookOptions) {
        this.hooks.set(id, param);
    }

    public hasNamespace() {
        const core = (this.plugin as AnyPluginInstance).core as any;
        const condition = "namespace" in core &&
            typeof core.namespace?.alias === "string" &&
            typeof core.namespace?.getHandlers === "function";

        return condition;
    }

    public getNamespace(ctx: PluginCtx<this["type"]>) {
        if (!this.hasNamespace()) return null;

        try {
            const alias = (this.plugin.core as any).alias as string;
            const handlers = (this.plugin.core as any).getHandlers(
                ctx,
                this.plugin.config,
            );
            return { [alias]: handlers };
        } catch (error) {
            console.error(
                `[@monitext/event]: Failed to invoque namespace for "${this.plugin.core.name}":`,
                error,
            );
            return null;
        }
    }
}

const b = new BusConnection(Logger);
