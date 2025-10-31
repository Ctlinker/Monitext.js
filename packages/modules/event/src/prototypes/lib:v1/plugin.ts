import { Schema, T } from "@monitext/typson";
import {
    ExtractPluginOption,
    ExtractPluginType,
    PluginArchitecture,
    PluginCtx,
    PluginDescriptor,
    PluginMethods,
} from "./plugin-types";

/**
 * Wrapper class around a raw, plugin core architecture
 */
export abstract class Plugin<
    N extends string,
    const O extends Schema | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        ExtractPluginType<P>,
        ExtractPluginOption<P>,
        A extends undefined ? never : A
    >,
    InstanceOpts = T.Infer<ExtractPluginOption<P>>,
    ThisPluginCtx = PluginCtx<ExtractPluginType<P>>,
    RealInstanceOpts = InstanceOpts extends never ? null
        : InstanceOpts,
> {
    constructor(public readonly core: PluginArchitecture<N, O, P, A, X>) {}

    public activate(ctx: ThisPluginCtx) {
        let result = null;
        try {
            this.core.init(ctx as any, this.#config.store as any);
        } catch (error) {
            result = new Error(
                `[@monitext/event]: Erreur while initializing plugin "${this.core.name}", see error cause for more info`,
                { cause: error },
            );
        }
        return result;
    }

    /**
     * User defined config storage for a running plugin
     */
    #config!: {
        store: RealInstanceOpts;
    };

    get config() {
        return this.#config.store;
    }
    /**
     * Api for config override
     */
    public congigure(param: RealInstanceOpts) {
        this.#config = { store: param };
    }

    abstract signature(): symbol;

    /**
     * Unique signature used to differentiate set of Plugin instance
     */
    public static signature: () => symbol;
}

/**
 * Declare a Plugin, through a descriptive core architecture
 */
export function createPlugin<
    N extends string,
    const O extends Schema | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        ExtractPluginType<P>,
        ExtractPluginOption<P>,
        A extends undefined ? never : A
    >,
>(
    param: P,
    handlers: X,
) {
    const core = {
        ...param,
        ...handlers,
    } as PluginArchitecture<N, O, P, A, X>;

    /**
     * Infer The expected instiation options of a the current plugin
     */
    type InstanceOpts = T.Infer<ExtractPluginOption<P>>;

    /**
     * Defer to null if no option is to be expected
     */
    type RealInstanceOpts = InstanceOpts extends never ? null
        : InstanceOpts;

    const uuid = Symbol();

    return class PluginInstance extends Plugin<N, O, P, A, X> {
        constructor(cfg: RealInstanceOpts) {
            super(core);
            this.congigure(cfg);
        }

        public readonly core = core;

        public signature(): symbol {
            return uuid;
        }

        public static signature() {
            return uuid;
        }
    };
}

let t = T.object({
    properties: {
        "mode": T.literals({ enum: ["json", "dev"] }),
    },
});

const LoggerPlugin = createPlugin({
    name: "logger-plugin",
    type: "both",
    opts: t,
}, {
    init(ctx, cfg) {
        console.log("Logger initialized");
    },
    namespace: {
        alias: "log", // ✅ Typed as 'log' without 'as const'!
        events: [""],
        getHandlers(ctx, cfg) {
            return {
                info(msg: string) {
                    console.log("[INFO]", msg);
                },
                error(msg: string) {
                    console.error("[ERROR]", msg);
                },
                debug(msg: string) {
                    console.debug("[DEBUG]", msg);
                },
            };
        },
    },
});

export const obsPlugin = createPlugin({
    name: "obs-plugin",
    type: "both",
    opts: t,
}, {
    init(ctx, cfg) {
        console.log("Logger initialized");
    },
    namespace: {
        alias: "obs", // ✅ Typed as 'log' without 'as const'!
        getHandlers(ctx, cfg) {
            return {
                info(msg: string) {
                    console.log("[INFO]", msg);
                },
                error(msg: string) {
                    console.error("[ERROR]", msg);
                },
                debug(msg: string) {
                    console.debug("[DEBUG]", msg);
                },
            };
        },
    },
});

export const Logger = new LoggerPlugin({
    "mode": "json",
});

type d = T.Infer<typeof t>;
