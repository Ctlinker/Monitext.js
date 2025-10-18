import { Logger } from "../lib_claude/plugin";
import { InferPluginInstance } from "../lib_claude/main_claude";
import { obsPlugin } from "./plugin";

export class Monitor<P extends Array<InferPluginInstance<any>>> {
    public readonly plugins: [...P];

    constructor(param: { plugins: [...P] }) {
        this.plugins = param.plugins;
    }

    namespaces(): {
        [
            K in keyof this["plugins"] as this["plugins"][K] extends
                { core: { namespace: { alias: infer X extends string } } } ? X
                : never
        ]: this["plugins"][K] extends {
            core: {
                namespace: {
                    getHandlers: infer X extends (...param: any[]) => any;
                };
            };
        } ? ReturnType<X>
            : never;
    } {
        return "" as any;
    }
}

const m = new Monitor({
    plugins: [
        Logger,
        new obsPlugin({}),
    ],
});

m.namespaces;
