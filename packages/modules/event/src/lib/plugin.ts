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
class Plugin<
    N extends string,
    const O extends Schema | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        ExtractPluginType<P>,
        ExtractPluginOption<P>,
        A extends undefined ? never : A
    >,
> {
    constructor(public readonly core: PluginArchitecture<N, O, P, A, X>) {}
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

    type InstanceOpts = T.Infer<ExtractPluginOption<P>>;
    type ThisPluginCtx = PluginCtx<ExtractPluginType<P>>;
    type RealInstanceOpts = InstanceOpts extends never ? null
        : InstanceOpts;

    return class extends Plugin<N, O, P, A, X> {
        constructor(cfg: RealInstanceOpts) {
            super(core);
            this.congigure(cfg);
        }

        /**
         * Bus Binding Api, loag the core's initialization function
         */
        public activate(ctx: ThisPluginCtx) {
            let result: any = null;
            try {
                result = this.core.init(ctx as any, this.config.store as any);
            } catch (error) {
                error;
                return new Error(
                    `[@monitext/event]: Erreur while initializing plugin "${this.core.name}", see error cause for more info`,
                    { cause: error },
                );
            }
        }

        /**
         * User defined config storage for a running plugin
         */
        private config!: {
            store: RealInstanceOpts;
        };

        /**
         * Api for config override
         */
        public congigure(param: RealInstanceOpts) {
            this.config = { store: param };
        }

        /**
         * Expose the core of the plugin, on static access
         */
        public static readonly core = core;

        /**
         * Unique signature used to differentiate set of Plugin instance
         */
        private static readonly uniqueSignature = Symbol();

        /**
         * Identify a given specifique group of Plugin instance
         */
        public static signature() {
            return this.uniqueSignature;
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

new LoggerPlugin({
    "mode": "json",
});

type d = T.Infer<typeof t>;
