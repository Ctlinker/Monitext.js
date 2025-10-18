import { Logger, obsPlugin } from "./plugin";
import { AnyPluginInstance, InferPluginInstance } from "./plugin-types";
import { EventData, HookHandler, Rule } from "./monitor-types";
import { BusConnection } from "./bus-connection";

export class Monitor<P extends Array<InferPluginInstance<any>>> {
    public readonly plugins: [...P];

    private connections = new Map<
        symbol,
        { [K in keyof P]: BusConnection<P[K]> }[number]
    >();

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
        const namespaces: Record<string, any> = {};

        for (const [_signature, connection] of this.connections) {
            const plugin = connection.plugin as AnyPluginInstance;

            const core = plugin.core;
            if ("namespace" in core && core.namespace) {
                const alias = (core.namespace as any).alias as string;
            }
        }

        return namespaces as any;
    }
}

const m = new Monitor({
    plugins: [
        Logger,
        new obsPlugin({}),
    ],
});

m.namespaces;
