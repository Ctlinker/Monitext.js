import { AnyPluginInstance } from "./plugin-types";

/**
 * Represents a standardized event data structure that flows through the event bus.
 *
 * @template T - The type of the event payload
 *
 * @example
 * ```typescript
 * const userEvent: EventData<{ userId: string; action: string }> = {
 *   type: 'user.action',
 *   payload: { userId: '123', action: 'login' },
 *   timestamp: Date.now(),
 *   metadata: { source: 'auth-service' }
 * };
 * ```
 */
export interface EventData<T = any> {
    /**
     * The event type identifier (e.g., 'user.login', 'data.update')
     * Used for routing events to specific handlers
     */
    type: string;

    /**
     * The actual data/payload of the event
     */
    payload: T;

    /**
     * Unix timestamp (in milliseconds) when the event was created
     */
    timestamp: number;

    /**
     * Optional metadata for additional context about the event
     * Can include source information, priority, correlation IDs, etc.
     */
    metadata?: Record<string, any>;
}

/**
 * Handler function type for processing events in hooks
 *
 * @param event - The event data to process
 * @returns void or a Promise that resolves when processing is complete
 *
 * @example
 * ```typescript
 * const logHandler: HookHandler = async (event) => {
 *   console.log(`[${event.type}]`, event.payload);
 * };
 * ```
 */
export type HookHandler = (event: EventData) => void | Promise<void>;

/**
 * Configuration options for event bus hooks
 *
 * Hooks allow intercepting and processing events at different stages:
 * - `receive`: Intercept events when they are received by consumers
 * - `emit`: Intercept events when they are emitted by producers
 * - `general`: Catch-all handlers that process all events regardless of stage
 *
 * @example
 * ```typescript
 * const loggingHook: BusHookOptions = {
 *   handlers: {
 *     emit: [
 *       (event) => console.log('Emitting:', event.type)
 *     ],
 *     receive: [
 *       (event) => console.log('Receiving:', event.type)
 *     ]
 *   },
 *   meta: {
 *     description: 'Logs all events',
 *     priority: 1
 *   }
 * };
 * ```
 */
export interface BusHookOptions {
    /**
     * Collection of handlers organized by interception stage
     */
    handlers: {
        /**
         * Handlers invoked when events are received by consumers
         */
        receive?: HookHandler[];

        /**
         * Handlers invoked when events are emitted by producers
         */
        emit?: HookHandler[];

        /**
         * General-purpose handlers for middleware-like behavior
         * These can act as catch-all handlers or implement cross-cutting concerns
         */
        general?: HookHandler[];
    };

    /**
     * Optional: Target specific plugins for this hook
     * If provided, the hook will only apply to the specified plugins
     * If omitted, the hook applies globally
     */
    plugins?: AnyPluginInstance[];

    /**
     * Optional metadata about the hook
     */
    meta?: {
        /**
         * Human-readable description of the hook's purpose
         */
        description?: string;

        /**
         * Execution priority (higher numbers execute first)
         * Useful when multiple hooks need to run in a specific order
         */
        priority?: number;

        /**
         * Additional custom metadata
         */
        [key: string]: any;
    };
}

/**
 * Type guard to check if an object is a valid EventData
 *
 * @param obj - Object to check
 * @returns True if the object conforms to EventData structure
 *
 * @example
 * ```typescript
 * if (isEventData(unknownObject)) {
 *   console.log(unknownObject.type, unknownObject.payload);
 * }
 * ```
 */
export function isEventData(obj: any): obj is EventData {
    return (
        obj !== null &&
        typeof obj === "object" &&
        typeof obj.type === "string" &&
        "payload" in obj &&
        typeof obj.timestamp === "number"
    );
}

/**
 * Helper function to create a properly formatted EventData object
 *
 * @template T - The type of the event payload
 * @param type - The event type identifier
 * @param payload - The event payload
 * @param metadata - Optional metadata
 * @returns A complete EventData object with timestamp
 *
 * @example
 * ```typescript
 * const event = createEventData('user.login', { userId: '123' }, { source: 'web' });
 * ```
 */
export function createEventData<T = any>(
    type: string,
    payload: T,
    metadata?: Record<string, any>
): EventData<T> {
    return {
        type,
        payload,
        timestamp: Date.now(),
        metadata,
    };
}
