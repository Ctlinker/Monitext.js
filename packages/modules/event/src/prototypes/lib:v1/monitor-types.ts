import { AnyPluginInstance } from "./plugin-types";

/**
 * Event data structure
 */
export interface EventData<T = any> {
    type: string;
    payload: T;
    timestamp: number;
    metadata?: Record<string, any>;
}

/**
 * Hook handler for intercepting data flow
 */

type HookHandler = (e: EventData) => void | Promise<void>;

export interface BusHookOptions {
    handlers: {
        receive?: HookHandler[];
        emit?: HookHandler[];
        general?: HookHandler[]; // Optional catch-all or middleware-like
    };
    plugins?: AnyPluginInstance[];
    meta?: {
        description?: string;
        priority?: number;
        [key: string]: any;
    };
}
