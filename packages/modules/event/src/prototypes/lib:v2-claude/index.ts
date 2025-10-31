/**
 * @module @monitext/event/lib_alt
 *
 * Enhanced event bus system with comprehensive type safety, plugin architecture,
 * and flexible event routing.
 *
 * This module provides:
 * - Type-safe plugin system with consumer/producer patterns
 * - Event routing with hooks and middleware
 * - Namespace support for plugin-specific APIs
 * - Comprehensive error handling and validation
 *
 * @example
 * ```typescript
 * import { Monitor, createPlugin, T } from '@monitext/event/lib_alt';
 *
 * // Define a plugin
 * const LoggerPlugin = createPlugin({
 *   name: 'logger',
 *   type: 'consumer',
 *   opts: T.object({
 *     properties: {
 *       level: T.literals({ enum: ['info', 'debug', 'error'] })
 *     }
 *   })
 * }, {
 *   init(ctx, config) {
 *     ctx.subscribe((event) => {
 *       console.log(`[${config.level}]`, event.type, event.payload);
 *     });
 *   }
 * });
 *
 * // Create monitor with plugins
 * const monitor = new Monitor({
 *   plugins: [new LoggerPlugin({ level: 'info' })]
 * });
 *
 * // Subscribe to events
 * monitor.on('user.login', (event) => {
 *   console.log('User logged in:', event.payload);
 * });
 * ```
 */

// Core classes
export { Monitor } from "./monitor";
export { Plugin, createPlugin } from "./plugin";
export { BusConnection } from "./bus-connection";

// Type definitions
export type {
    EventData,
    BusHookOptions,
    HookHandler,
} from "./monitor-types";

export type {
    PluginType,
    ConsumerCtx,
    ProducerCtx,
    PluginCtx,
    PluginDescriptor,
    PluginInitializer,
    PluginNamespaces,
    PluginMethods,
    PluginArchitecture,
    ExtractPluginOption,
    ExtractPluginType,
    InferPluginInstance,
    AnyPluginInstance,
} from "./plugin-types";

// Utility functions
export { isEventData, createEventData } from "./monitor-types";
export { isPluginInstance } from "./plugin-types";

// Helper types
export type { PluginConfig, PluginTypeFromInstance } from "./plugin";

/**
 * Re-export commonly used types from typson for convenience
 */
export type { Schema } from "@monitext/typson";
export { T } from "@monitext/typson";
