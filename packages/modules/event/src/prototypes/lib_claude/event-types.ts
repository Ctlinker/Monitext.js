import { T, Schema } from '@monitext/typson';

/**
 * Severity levels inspired by syslog
 */
export const SeverityLevels = [
	'emergency', // 0 - System is unusable
	'alert', // 1 - Action must be taken immediately
	'critical', // 2 - Critical conditions
	'error', // 3 - Error conditions
	'warning', // 4 - Warning conditions
	'notice', // 5 - Normal but significant condition
	'info', // 6 - Informational messages
	'debug', // 7 - Debug-level messages
] as const;

export type SeverityLevel = (typeof SeverityLevels)[number];

/**
 * Event origin types
 */
export const EventOrigins = [
	'custom', // User-defined events
	'system', // System-generated events
	'plugin', // Plugin-generated events
	'monitor', // Monitor-generated events
	'error', // Error events
	'log', // Log events
] as const;

export type EventOrigin = (typeof EventOrigins)[number];

/**
 * Schema for event data
 */
export const EventDataSchema = T.object({
	properties: {
		// Event identification
		type: T.string({
			description: 'Event type identifier',
		}),

		// Payload (any data)
		payload: T.oneOf([
			T.string(),
			T.number(),
			T.boolean(),
			T.object({
				properties: {},
				additionalProperties: true,
			}),
			T.array({ items: T.string() }),
		]),

		// Timestamp
		timestamp: T.number({
			description: 'Unix timestamp in milliseconds',
		}),

		// Severity level
		severity: T.literals({
			enum: [...SeverityLevels],
			description: 'Syslog-style severity level',
		}),

		// Origin
		origin: T.literals({
			enum: [...EventOrigins],
			description: 'Source of the event',
		}),

		// Metadata
		metadata: T.object({
			properties: {
				// Source information
				source: T.object({
					properties: {
						file: T.string(),
						line: T.number(),
						column: T.number(),
						function: T.string(),
					},
				}),

				// Context information
				context: T.object({
					properties: {
						projectId: T.string(),
						environment: T.literals({
							enum: ['development', 'staging', 'production'],
						}),
						runtime: T.literals({
							enum: ['node', 'bun', 'deno', 'browser'],
						}),
						version: T.string(),
					},
				}),

				// Additional arbitrary metadata
				custom: T.object({
					properties: {},
					additionalProperties: true,
				}),
			},
		}),
	},
	required: ['type', 'payload', 'timestamp'],
});

/**
 * Inferred TypeScript type from schema
 */
export type EventData<P = any> = {
	type: string;
	payload: P;
	timestamp: number;
	severity?: SeverityLevel;
	origin?: EventOrigin;
	metadata?: {
		source?: {
			file?: string;
			line?: number;
			column?: number;
			function?: string;
		};
		context?: {
			projectId?: string;
			environment?: 'development' | 'staging' | 'production';
			runtime?: 'node' | 'bun' | 'deno' | 'browser';
			version?: string;
		};
		custom?: Record<string, any>;
	};
};

/**
 * Helper to create a typed event
 */
export function createEvent<P = any>(
	type: string,
	payload: P,
	options?: {
		severity?: SeverityLevel;
		origin?: EventOrigin;
		metadata?: EventData['metadata'];
	},
): EventData<P> {
	return {
		type,
		payload,
		timestamp: Date.now(),
		severity: options?.severity,
		origin: options?.origin,
		metadata: options?.metadata,
	};
}

/**
 * Helper to create an error event
 */
export function createErrorEvent(
	error: Error,
	context?: {
		function?: string;
		file?: string;
		line?: number;
		column?: number;
	},
): EventData<{ name: string; message: string; stack?: string }> {
	return createEvent(
		'error',
		{
			name: error.name,
			message: error.message,
			stack: error.stack,
		},
		{
			severity: 'error',
			origin: 'error',
			metadata: {
				source: context,
			},
		},
	);
}

/**
 * Helper to create a log event
 */
export function createLogEvent(
	message: string,
	severity: SeverityLevel = 'info',
): EventData<string> {
	return createEvent(message, message, {
		severity,
		origin: 'log',
	});
}

/**
 * Type guard to check if an object is a valid EventData
 */
export function isEventData(obj: any): obj is EventData {
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj.type === 'string' &&
		'payload' in obj &&
		typeof obj.timestamp === 'number'
	);
}

/**
 * Helper to merge event metadata
 */
export function mergeEventMetadata(
	event: EventData,
	metadata: Partial<EventData['metadata']>,
): EventData {
	return {
		...event,
		metadata: {
			...event.metadata,
			...metadata,
			source: {
				...event.metadata?.source,
				...metadata?.source,
			},
			context: {
				...event.metadata?.context,
				...metadata?.context,
			},
			custom: {
				...event.metadata?.custom,
				...metadata?.custom,
			},
		},
	};
}

/**
 * Helper to check event severity level
 */
export function isSeverityAtLeast(
	event: EventData,
	minLevel: SeverityLevel,
): boolean {
	if (!event.severity) return false;
	const eventLevel = SeverityLevels.indexOf(event.severity);
	const minLevelIndex = SeverityLevels.indexOf(minLevel);
	return eventLevel <= minLevelIndex; // Lower index = higher severity
}

/**
 * Helper to filter events by origin
 */
export function hasOrigin(
	event: EventData,
	...origins: EventOrigin[]
): boolean {
	if (!event.origin) return false;
	return origins.includes(event.origin);
}

/**
 * Helper to clone an event
 */
export function cloneEvent<P = any>(event: EventData<P>): EventData<P> {
	return {
		...event,
		payload:
			typeof event.payload === 'object' && event.payload !== null
				? { ...event.payload }
				: event.payload,
		metadata: event.metadata
			? {
					source: event.metadata?.source
						? { ...event.metadata.source }
						: undefined,
					context: event.metadata?.context
						? { ...event.metadata.context }
						: undefined,
					custom: event.metadata?.custom
						? { ...event.metadata.custom }
						: undefined,
				}
			: undefined,
	};
}
