import { Schema, T } from "@monitext/typson";
import { Plugin } from "./plugin-class";
import {
    ExtractPluginOption,
    ExtractPluginType,
    InferPluginDescription,
    InferPluginMethods,
    PluginDescriptor,
    PluginType,
} from "./plugin-types";

/**
 * Creates a strongly-typed, immutable plugin descriptor.
 *
 * This is a helper to ensure type inference works correctly when defining plugins.
 *
 * @template N - Plugin name (as a string literal).
 * @template T - Plugin type: `"consumer"`, `"producer"`, or `"both"`.
 * @template O - Optional configuration options (schema + required flag).
 *
 * @param desc - Plugin metadata including name, type, and optional schema info.
 * @returns The frozen descriptor object.
 *
 * @example
 * ```ts
 * const descriptor = describePlugin({
 *   name: "logger",
 *   type: "producer",
 *   opts: {
 *     schema: LoggerSchema,
 *     required: true,
 *   },
 * });
 * ```
 */
export function describePlugin<
    N extends string,
    T extends PluginType,
    O extends ({
        schema: Schema;
        required: boolean;
    } | null) = null,
>(desc: PluginDescriptor<N, T, O>) {
    return Object.freeze(desc);
}

/**
 * Combines a plugin descriptor and its core implementation (init + namespace),
 * and returns a concrete plugin class ready for use.
 *
 * @template p_desc - The plugin descriptor object.
 * @template n_alias - Namespace alias string, if namespace is defined.
 * @template p_methods - The plugin’s implementation (`init`, and optionally `namespace.getHandlers`).
 *
 * @param desc - Plugin descriptor that defines metadata like name, type, and configuration schema.
 * @param core - Implementation of the plugin (methods based on type).
 *
 * @returns A class extending `Plugin` that can be instantiated and activated.
 *
 * @example
 * ```ts
 * const MyPlugin = assemblePlugin(descriptor, {
 *   init(ctx, cfg) {
 *     // initialization logic
 *   },
 *   namespace: {
 *     alias: "logger",
 *     getHandlers(ctx, cfg) {
 *       return {
 *         log: (msg: string) => console.log(msg),
 *       };
 *     },
 *   },
 * });
 *
 * const plugin = new MyPlugin({ level: "info" });
 * plugin.activate(context);
 * ```
 */
export function assemblePlugin<
    p_desc,
    n_alias extends string | undefined,
    p_methods extends InferPluginMethods<
        ExtractPluginType<p_desc>,
        ExtractPluginOption<p_desc>,
        n_alias extends string ? n_alias : never
    >,
>(desc: InferPluginDescription<p_desc>, core: p_methods) {
    const pluginCore = {
        ...desc,
        ...core,
    };

    const uuid = Symbol();

    type CoreOpts = T.Infer<ExtractPluginOption<p_desc>>;
    type RealOpts = CoreOpts extends never ? null : CoreOpts;

    /**
     * Concrete implementation of a plugin, with lifecycle and metadata handling.
     */
    const inst = class PluginImplementation extends Plugin<typeof pluginCore> {
        constructor(cfg: RealOpts) {
            super(pluginCore as any);

            if (
                pluginCore.opts?.required && (cfg === null || cfg === undefined)
            ) {
                throw new Error(
                    `[@monitext/event]: Plugin "${pluginCore.name}" requires configuration but none was provided`,
                );
            }

            this.configure(cfg);
        }

        /**
         * Returns a unique signature symbol for this plugin instance.
         *
         * @returns A symbol identifying this plugin at runtime.
         */
        public signature(): symbol {
            return uuid;
        }

        /**
         * Static signature symbol for identifying the plugin type.
         *
         * @returns A symbol identifying this plugin type.
         */
        public static signature(): symbol {
            return uuid;
        }
    };

    return inst;
}
