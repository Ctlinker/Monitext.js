import { Logger } from "./plugin";
import { InferPluginInstance, PluginCtx } from "./plugin-types";

export class BusConnection<P> {
    private hooks = [];
    private rules = [];

    constructor(public readonly plugin: InferPluginInstance<P>) {}

    createCtx(): PluginCtx<this["plugin"]["core"]["type"]> {
        let ctx = {};
        const self = this;
        const ctxType = this.plugin.core.type;

        if (["consumer", "both"].includes(ctxType)) {
            ctx = {};
        }

        if (["producer", "both"].includes(ctxType)) {
            ctx = { ...ctx };
        }

        return Object.freeze(ctx) as any;
    }

    getSignature() {
        return this.plugin.signature();
    }
}

const b = new BusConnection(Logger);
