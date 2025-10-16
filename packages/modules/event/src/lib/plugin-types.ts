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
export type PluginInitializer<S extends PluginType> = {
    init(ctx: PluginCtx<S>): void;
};

/**
 * Plugin Namespace type wrapper (for non  consumer only)
 */
export type PluginNamespaces<
    S extends PluginType,
    N extends string,
    H = Record<
        string,
        (...param: any[]) => any
    >,
> = {
    namespace?: {
        alias: N;
        getHandlers(ctx: PluginCtx<S>): H;
    };
};

/**
 * Infer the availables methods on a plugin, based of it's type
 */
export type PluginMethods<S extends PluginType, N extends string> = S extends
    "consumer" ? PluginInitializer<S>
    : PluginInitializer<S> & PluginNamespaces<S, N>;

/**
 * Creates a type-level plugin's core description
 */
export type PluginArchitecture<
    N extends string,
    O extends object | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        P extends { type: infer Y extends string } ? Y : never,
        A extends undefined ? never : A
    >,
> = {
    /**
     * In order to collapse/merge the types of P & X
     */
    [K in keyof (P & X)]: (P & X)[K];
};
