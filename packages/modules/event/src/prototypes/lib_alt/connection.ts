import {
    InferPluginContext,
    InferPluginMethods,
    PluginDescriptor,
} from "./plugin-types";
import { Plugin } from "./plugin-class";
import { BusHookOptions } from "./bus-types";

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

    public getAllHooks(): ReadonlyMap<string, BusHookOptions> {
        return this.hooks;
    }

    public removeHook(id: string): boolean {
        return this.hooks.delete(id);
    }

    public clearHooks(): void {
        this.hooks.clear();
    }

    public hasNamespace(): boolean {
        const core = this.plugin.core as any;

        const hasNamespaceProperty = "namespace" in core;
        const hasAlias = typeof core.namespace?.alias === "string";
        const hasGetHandlers =
            typeof core.namespace?.getHandlers === "function";

        return hasNamespaceProperty && hasAlias && hasGetHandlers;
    }

    public getNamespace(
        ctx: InferPluginContext<this["type"]>,
    ) {
        if (!this.hasNamespace()) {
            return null;
        }

        try {
            const core = this.plugin.core as any;
            const alias = core.namespace.alias as string;

            // Call getHandlers with context and config
            const handlers = core.namespace.getHandlers(
                ctx,
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
