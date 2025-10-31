export interface EventData<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    metadata?: Record<string, any>;
}

type HookHandler = (e: EventData) => void | Promise<void>;

import { type Plugin } from "./plugin-class";

export interface BusHookOptions {
    handlers: {
        receive?: HookHandler[];
        emit?: HookHandler[];
    };
    plugins?: (Plugin<any>)[];
    meta?: {
        description?: string;
        priority?: number;
        [key: string]: any;
    };
}

export type SortedHooks = {
    hookId: string;
    handlers: ((event: EventData) => void | Promise<void>)[];
}[];

export interface Rule {
    targets: (Plugin<any> | symbol)[];
    receiveEvent?: (string | RegExp | ((event: EventData) => boolean))[];
}
