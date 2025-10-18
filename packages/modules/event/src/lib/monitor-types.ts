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
 * Rule definition for filtering events to plugins
 */
export interface Rule {
    receive?: Array<string | ((event: EventData) => boolean)>;
    filter?: (event: EventData, data: any) => boolean;
}

/**
 * Hook handler for intercepting data flow
 */
export interface HookHandler {
    onEmit?: (data: any) => void | Promise<void>;
    onReceive?: (data: any) => void | Promise<void>;
}
