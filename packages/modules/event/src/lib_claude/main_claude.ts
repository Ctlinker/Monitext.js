// Plugin system
export { createPlugin, Plugin } from "./plugin";
export type {
	ConsumerCtx,
	ExtractPluginOption,
	ExtractPluginType,
	InferPluginInstance,
	PluginArchitecture,
	PluginCtx,
	PluginDescriptor,
	PluginInitializer,
	PluginMethods,
	PluginNamespaces,
	PluginType,
	ProducerCtx,
} from "./plugin-types";

// Monitor
export { Monitor } from "./monitor";
export type { HookHandler, MonitorOptions, Rule } from "./monitor";

// Event types and helpers
export {
	cloneEvent,
	createErrorEvent,
	createEvent,
	createLogEvent,
	EventDataSchema,
	EventOrigins,
	hasOrigin,
	isEventData,
	isSeverityAtLeast,
	mergeEventMetadata,
	SeverityLevels,
} from "./event-types";
export type { EventData, EventOrigin, SeverityLevel } from "./event-types";

// Bus connection (internal, but exported for advanced usage)
export { BusConnection } from "./bus-connection";
export type { ConnectionHook, ConnectionRule } from "./bus-connection";
