import {
    PluginArchitecture,
    PluginDescriptor,
    PluginMethods,
} from "./plugin-types";

/**
 * Wrapper class around a raw, plugin core architecture
 */
class Plugin<
    N extends string,
    O extends object | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        P extends { type: infer Y extends string } ? Y : never,
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
    O extends object | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        P extends { type: infer Y extends string } ? Y : never,
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

    return class extends Plugin<N, O, P, A, X> {
        constructor() {
            super(core);
        }

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

const loggerPlugin = createPlugin({
    name: "logger-plugin",
    type: "both",
}, {
    init(ctx) {
        console.log("Logger initialized");
    },
    namespace: {
        alias: "log", // ✅ Typed as 'log' without 'as const'!
        getHandlers(ctx) {
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
