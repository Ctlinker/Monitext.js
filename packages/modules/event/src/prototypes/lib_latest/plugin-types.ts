import { Schema, T } from "@monitext/typson";

/**
 * Represents the type of plugin in the system.
 * - `consumer`: Listens to or consumes events/data.
 * - `producer`: Emits or produces events/data.
 * - `both`: Acts as both consumer and producer.
 */
export type PluginType = "consumer" | "producer" | "both";

/**
 * Describes a plugin with its metadata.
 *
 * @template p_name - Name of the plugin as a string literal.
 * @template p_type - Plugin type (`consumer`, `producer`, or `both`).
 * @template p_opts - Optional configuration object, which includes:
 *   - `schema`: a JSON schema object.
 *   - `required`: indicates if the config is mandatory.
 */
export type PluginDescriptor<
    p_name extends string,
    p_type extends PluginType,
    p_opts extends ({
        schema: Schema;
        required?: boolean;
    } | null) = null,
> = {
    name: p_name;
    type: p_type;
    opts: p_opts;
};

/**
 * Infers and returns the plugin descriptor if it matches the expected structure.
 *
 * @template X - Plugin object to be validated and inferred.
 */
export type InferPluginDescription<X> = X extends {
    name: infer _N extends string;
    type: infer _T extends PluginType;
    opts: infer _O extends ({
        schema: object;
        required?: boolean;
    } | null);
} ? X
    : never;

/**
 * Context provided to consumer-type plugins.
 */
export type ConsumerCtx = {
    subscribe(fn: (event: EventData) => void): void;
    on(
        eventType: string,
        handler: (event: EventData) => void,
    ): void;
};

/**
 * Context provided to producer-type plugins.
 */
export type ProducerCtx = {
    emit(event: EventData): Promise<void>;
};

/**
 * Extracts the plugin type from a plugin descriptor.
 *
 * @template P - Plugin descriptor.
 */
export type ExtractPluginType<P> = P extends
    { type: infer Y extends PluginType } ? Y : never;

/**
 * Extracts the configuration schema from a plugin descriptor, if available.
 *
 * @template P - Plugin descriptor.
 */
export type ExtractPluginOption<P> = P extends
    { opts: { schema: infer X extends Schema } } ? X : null;

/**
 * Infers the appropriate context object based on the plugin type.
 *
 * @template T - Plugin type.
 */
export type InferPluginContext<T extends PluginType> = T extends "consumer"
    ? ConsumerCtx
    : T extends "producer" ? ProducerCtx
    : ConsumerCtx & ProducerCtx;

/**
 * Defines the shape of an initializer method for a plugin.
 *
 * @template S - Plugin type.
 * @template X - Plugin configuration schema.
 */
export type InferPluginInitializer<S extends PluginType, X> = {
    /**
     * Initializes the plugin with the given context and configuration.
     *
     * @param ctx - The runtime context for the plugin.
     * @param cfg - The configuration object, inferred from schema or `null`.
     */
    init(
        ctx: InferPluginContext<S>,
        cfg: X extends null ? null : T.Infer<X>,
    ): void;
};

/**
 * Adds a namespace to the plugin with handler functions.
 *
 * @template S - Plugin type.
 * @template X - Plugin configuration schema.
 * @template n_alias - Namespace alias as a string.
 * @template n_handlers - A record of handler functions.
 */
export type InferPluginNamespace<
    S extends PluginType,
    X,
    n_alias extends string,
    n_handlers = Record<string, (...param: any[]) => any>,
> = {
    namespace?: {
        /** Name used to access the plugin's namespace. */
        alias: n_alias;
        /**
         * Returns a collection of handler functions.
         *
         * @param ctx - The runtime context for the plugin.
         * @param cfg - Plugin configuration or `null`.
         */
        getHandlers(
            ctx: InferPluginContext<S>,
            cfg: X extends null ? null : T.Infer<X>,
        ): n_handlers;
    };
};

/**
 * Infers the available methods (e.g., `init`, `namespace`) on a plugin
 * based on its type.
 *
 * @template S - Plugin type.
 * @template O - Plugin options/config schema.
 * @template A - Alias for the plugin's namespace.
 */
export type InferPluginMethods<
    S extends PluginType,
    O extends unknown,
    A extends string,
> = S extends "consumer" ? InferPluginInitializer<S, O>
    : InferPluginInitializer<S, O> & InferPluginNamespace<S, O, A>;

/**
 * Combines the complete architecture of a plugin by inferring:
 * - Descriptor metadata
 * - Available methods
 * - Namespace (if applicable)
 *
 * @template X - Plugin type to infer from.
 */
export type InferPluginArchitecture<X> = X extends (
    PluginDescriptor<
        infer _N,
        infer _T,
        infer _O
    > & InferPluginMethods<infer _T, infer _O, infer _A>
) ? X
    : never;

import { Plugin } from "./plugin-class";
import { EventData } from "./bus-types";

/**
 * Infers the full plugin instance type from a given plugin declaration object `X`.
 *
 * This utility type checks whether the provided type `X` has a `core` property
 * that matches the shape of a `PluginDescriptor` combined with `InferPluginMethods`.
 * If so, it returns the full plugin type by merging `X` with `Plugin<Core>`,
 * where `Core` is the inferred plugin core descriptor.
 * Otherwise, it returns `never`.
 *
 * @template X - The input type from which to infer the plugin instance.
 *
 * @remarks
 * - `PluginDescriptor<_N, _T, _O>` is assumed to define the core plugin structure.
 * - `InferPluginMethods<_T, _O, _A>` augments the descriptor with additional methods.
 * - `Plugin<Core>` wraps the core into a full plugin instance type.
 *
 * @example
 * ```ts
 * type MyPlugin = {
 *   core: PluginDescriptor<"name", ConfigType, Options> & InferPluginMethods<ConfigType, Options, API>
 *   // other custom properties...
 * };
 *
 * type Instance = InferPluginInstance<MyPlugin>;
 * // Result: MyPlugin & Plugin<...>
 * ```
 */
export type InferPluginInstance<X> = X extends {
    core: infer Core extends (
        & PluginDescriptor<
            infer _N,
            infer _T,
            infer _O
        >
        & InferPluginMethods<infer _T, infer _O, infer _A>
    );
} ? X & Plugin<Core>
    : never;
