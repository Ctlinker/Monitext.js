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
        general?: HookHandler[]; // Optional catch-all or middleware-like
    };
    plugins?: (Plugin<any>)[];
    meta?: {
        description?: string;
        priority?: number;
        [key: string]: any;
    };
}
