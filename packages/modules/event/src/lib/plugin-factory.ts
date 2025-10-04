import { Schema, T } from "@monitext/typson";

export type PluginType = "consumer" | "producer" | "both";

export type IPluginContext<T extends PluginType> = T extends "consumer"
    ? ConsumerContext
    : T extends "producer" ? ProducerContext
    : T extends "both" ? ConsumerContext & ProducerContext
    : never;

type ConsumerContext = {
    on(event: string, fn: (data: object) => void): void;
    subscribe(fn: (data: object) => void): void;
};

type ProducerContext = {
    emit(data: object): void;
};

export type IPlugin<
    PType extends PluginType,
    Option extends Schema | undefined = undefined,
    PEvent extends readonly [...string[]] | undefined = undefined,
    NSpace extends Record<string, (() => void)> | undefined = undefined,
> = PType extends "consumer" ? {
        readonly name: string;
        type: PType;
        opts?: Option;
        init(ctx: IPluginContext<PType>): void;
    }
    : PType extends "producer" | "both" ? {
            readonly name: string;
            type: PType;
            opts?: Option;
            init(ctx: IPluginContext<PType>): void;
            events: PEvent extends string[] ? PEvent : never;
            namespace?: (
                ctx: ProducerContext,
            ) => IPluginNamespace<
                NSpace extends Record<string, (() => void)> ? NSpace : never
            >;
        }
    : never;

export type IPluginNamespace<
    S extends object,
> = {
    readonly alias: string;
    readonly handlers: S;
};

export function createPlugin<
    PType extends PluginType,
    Opts extends Schema | undefined = undefined,
    PEvent extends string[] | undefined = undefined,
    NSpace extends Record<string, (() => void)> | undefined = undefined,
>(plugin: IPlugin<PType, Opts, PEvent, NSpace>) {
    return function (cfg?: any) {
        return [plugin, cfg];
    } as Opts extends Schema ? (<Cfg extends T.Infer<Opts>>(
            param: Cfg,
        ) => [typeof plugin, Cfg])
        : (() => [typeof plugin, undefined]);
}

const obs = createPlugin({
    type: "both",

    name: "observer",

    opts: T.object({
        properties: {
            test: T.string(),
        },
    }),

    events: ["test"],

    init(ctx) {
        ctx.subscribe((data) => {
            console.log(data);
        });
    },

    namespace(ctx) {
        return {
            alias: "",
            handlers: {
                guard() {
                },
            },
        };
    },
});

// obs();
