import { Schema, T } from "@monitext/typson";

/**
 * List the possible `kind` of a given plugin
 */
export type PluginType = "consumer" | "producer" | "both";

/**
 * Consumer level ctx to the event-bus
 */
export type ConsumerCtx = {
    subscribe(): void;
    on(): void;
};

/**
 * Producer level ctx to the event-bus
 */
export type ProducerCtx = {
    emit(): void;
};

/**
 * Infer the correct type of ctx, applied to a given plugin, based of it's type
 */
export type PluginCtx<T extends PluginType> = T extends "consumer" ? ConsumerCtx
    : T extends "producer" ? ProducerCtx
    : ConsumerCtx & ProducerCtx;

/**
 * Describe a plugin a high level, it's name, type and expected opts on init
 */
export type PluginDescriptor<N, O> = {
    name: N;
    type: PluginType;
    opts?: O;
    readonly optsRequired?: boolean;
};

/**
 * Plugin Initializer type wrapper
 */
export type PluginInitializer<S extends PluginType, X> = {
    init(ctx: PluginCtx<S>, cfg: T.Infer<X>): void;
};

/**
 * Plugin Namespace type wrapper (for non  consumer only)
 */
export type PluginNamespaces<
    S extends PluginType,
    X,
    N extends string,
    H = Record<
        string,
        (...param: any[]) => any
    >,
> = {
    namespace?: {
        alias: N;
        getHandlers(ctx: PluginCtx<S>, cfg?: T.Infer<X>): H;
    };
};

/**
 * Infer the availables methods on a plugin, based of it's type
 */
export type PluginMethods<
    S extends PluginType,
    O extends unknown,
    N extends string,
> = S extends "consumer" ? PluginInitializer<S, O>
    : PluginInitializer<S, O> & PluginNamespaces<S, O, N>;

/**
 * Creates a type-level plugin's core description
 */
export type PluginArchitecture<
    N extends string,
    O extends Schema | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        ExtractPluginType<P>,
        ExtractPluginOption<P>,
        A extends undefined ? never : A
    >,
> = {
    /**
     * In order to collapse/merge the types of P & X
     */
    [K in keyof (P & X)]: (P & X)[K];
};

export type ExtractPluginOption<P> = P extends { opts: infer X extends Schema }
    ? X
    : undefined;

export type ExtractPluginType<P> = P extends
    { type: infer Y extends PluginType } ? Y
    : never;

import { type Plugin } from "./plugin";

/**
 * Infer/Unwrap the deep type of a given Plugin class instance
 */
export type InferPluginInstance<T> = T extends Plugin<
    infer _N,
    infer _O,
    infer _P,
    infer _A,
    infer _X
> ? T
    : never;

/**
 * THIS GENERIC PLUGIN IS NOT MEANT TO BE EXTENDED FROM, AS IS IT'S TOO UNSTABLE
 */
export type AnyPluginInstance = Plugin<
    string,
    Schema | undefined,
    PluginDescriptor<string, Schema | undefined>,
    string | undefined,
    PluginMethods<
        PluginType,
        Schema | undefined,
        string
    >
>;
