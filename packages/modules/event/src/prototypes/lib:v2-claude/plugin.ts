import { Schema, T } from "@monitext/typson";
import {
    ExtractPluginOption,
    ExtractPluginType,
    PluginArchitecture,
    PluginCtx,
    PluginDescriptor,
    PluginMethods,
} from "./plugin-types";

/**
 * Abstract base class for all plugins in the event bus system.
 *
 * This class wraps a plugin's core architecture and provides lifecycle management,
 * configuration handling, and signature-based identification. Each plugin instance
 * has a unique signature that identifies it within the monitor/bus system.
 *
 * @template N - The plugin name type (literal string)
 * @template O - The configuration schema type (Schema | undefined)
 * @template P - The plugin descriptor type
 * @template A - The namespace alias type (string | undefined)
 * @template X - The plugin methods type (init and optional namespace)
 * @template InstanceOpts - Inferred configuration options from the schema
 * @template ThisPluginCtx - The context type for this plugin based on its PluginType
 * @template RealInstanceOpts - Normalized options type (null if no options required)
 *
 * @example
 * ```typescript
 * const MyPlugin = createPlugin({
 *   name: 'my-plugin',
 *   type: 'consumer',
 *   opts: mySchema
 * }, {
 *   init(ctx, config) {
 *     ctx.subscribe((event) => console.log(event));
 *   }
 * });
 *
 * const instance = new MyPlugin({ someOption: 'value' });
 * ```
 */
export abstract class Plugin<
    N extends string,
    const O extends Schema | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        ExtractPluginType<P>,
        ExtractPluginOption<P>,
        A extends undefined ? never : A
    >,
    InstanceOpts = T.Infer<ExtractPluginOption<P>>,
    ThisPluginCtx = PluginCtx<ExtractPluginType<P>>,
    RealInstanceOpts = InstanceOpts extends never ? null : InstanceOpts,
> {
    /**
     * Internal configuration storage for the plugin instance.
     * This holds the validated configuration passed during plugin instantiation.
     */
    #config!: {
        store: RealInstanceOpts;
    };

    /**
     * Flag to track whether the plugin has been activated.
     * Prevents double-activation and helps with debugging.
     */
    #isActivated: boolean = false;

    /**
     * Constructs a new Plugin instance with the given core architecture.
     *
     * @param core - The plugin's core architecture containing descriptor and methods
     */
    constructor(public readonly core: PluginArchitecture<N, O, P, A, X>) {}

    /**
     * Activates the plugin by calling its init method with the provided context.
     * This should only be called once per plugin instance, typically by the Monitor.
     *
     * @param ctx - The plugin context providing access to bus methods (emit, subscribe, on)
     * @returns null on success, or an Error object if initialization fails
     *
     * @remarks
     * The activation process:
     * 1. Checks if already activated (idempotent)
     * 2. Calls the plugin's init() method with context and config
     * 3. Catches any errors and wraps them in a descriptive Error
     * 4. Marks the plugin as activated on success
     *
     * @example
     * ```typescript
     * const error = plugin.activate(ctx);
     * if (error) {
     *   console.error('Failed to activate plugin:', error.message);
     *   console.error('Cause:', error.cause);
     * }
     * ```
     */
    public activate(ctx: ThisPluginCtx): Error | null {
        if (this.#isActivated) {
            return new Error(
                `[@monitext/event]: Plugin "${this.core.name}" is already activated`
            );
        }

        try {
            this.core.init(ctx as any, this.#config.store as any);
            this.#isActivated = true;
            return null;
        } catch (error) {
            return new Error(
                `[@monitext/event]: Error while initializing plugin "${this.core.name}", see error cause for more info`,
                { cause: error }
            );
        }
    }

    /**
     * Gets the current activation status of the plugin.
     *
     * @returns true if the plugin has been successfully activated, false otherwise
     *
     * @example
     * ```typescript
     * if (plugin.isActivated) {
     *   console.log('Plugin is ready to use');
     * }
     * ```
     */
    public get isActivated(): boolean {
        return this.#isActivated;
    }

    /**
     * Gets the plugin's configuration object.
     * This is the validated configuration that was passed during instantiation.
     *
     * @returns The plugin's configuration
     *
     * @example
     * ```typescript
     * const logLevel = myPlugin.config.logLevel;
     * ```
     */
    public get config(): RealInstanceOpts {
        return this.#config.store;
    }

    /**
     * Sets or updates the plugin's configuration.
     *
     * ⚠️ WARNING: This should typically only be called during plugin construction.
     * Changing configuration after activation may lead to unexpected behavior.
     *
     * @param param - The new configuration object
     *
     * @example
     * ```typescript
     * plugin.configure({ logLevel: 'debug', format: 'json' });
     * ```
     */
    public configure(param: RealInstanceOpts): void {
        this.#config = { store: param };
    }

    /**
     * Returns the unique symbol that identifies this plugin instance.
     * Each plugin class has its own unique signature that is shared across all
     * instances of that class but different from all other plugin classes.
     *
     * @returns A unique symbol for this plugin
     *
     * @remarks
     * This signature is used by the Monitor to:
     * - Prevent duplicate plugin registrations
     * - Route events to the correct plugin
     * - Manage plugin connections
     *
     * @example
     * ```typescript
     * const sig = plugin.signature();
     * console.log(typeof sig); // 'symbol'
     * ```
     */
    public abstract signature(): symbol;

    /**
     * Static signature method that must be implemented by concrete plugin classes.
     * This provides a way to get the plugin's signature without an instance.
     *
     * @returns A unique symbol for this plugin class
     */
    public static signature: () => symbol;
}

/**
 * Factory function to create a new plugin class with the specified descriptor and handlers.
 *
 * This is the primary way to define plugins in the event bus system. It combines
 * the plugin's metadata (descriptor) with its behavior (handlers) and returns a
 * concrete Plugin class that can be instantiated.
 *
 * @template N - The plugin name type (literal string)
 * @template O - The configuration schema type
 * @template P - The plugin descriptor type
 * @template A - The namespace alias type
 * @template X - The plugin methods/handlers type
 *
 * @param param - The plugin descriptor (name, type, opts, etc.)
 * @param handlers - The plugin's implementation (init method and optional namespace)
 * @returns A Plugin class constructor that can be instantiated
 *
 * @example
 * ```typescript
 * // Define a logger plugin schema
 * const loggerSchema = T.object({
 *   properties: {
 *     level: T.literals({ enum: ['info', 'debug', 'error'] }),
 *     format: T.literals({ enum: ['json', 'text'] })
 *   }
 * });
 *
 * // Create the plugin class
 * const LoggerPlugin = createPlugin({
 *   name: 'logger',
 *   type: 'consumer',
 *   opts: loggerSchema,
 *   optsRequired: true
 * }, {
 *   init(ctx, config) {
 *     ctx.subscribe((event) => {
 *       const prefix = config.format === 'json'
 *         ? JSON.stringify({ level: config.level, event })
 *         : `[${config.level}] ${event.type}`;
 *       console.log(prefix, event.payload);
 *     });
 *   }
 * });
 *
 * // Instantiate the plugin
 * const logger = new LoggerPlugin({ level: 'debug', format: 'json' });
 * ```
 *
 * @example
 * ```typescript
 * // Plugin with namespace (for producer/both types)
 * const HttpPlugin = createPlugin({
 *   name: 'http-client',
 *   type: 'both',
 *   opts: httpSchema
 * }, {
 *   init(ctx, config) {
 *     // Setup HTTP client with config
 *   },
 *   namespace: {
 *     alias: 'http',
 *     getHandlers(ctx, config) {
 *       return {
 *         get: async (url: string) => {
 *           const response = await fetch(url);
 *           const data = await response.json();
 *           await ctx.emit({
 *             type: 'http.response',
 *             payload: data,
 *             timestamp: Date.now()
 *           });
 *           return data;
 *         },
 *         post: async (url: string, body: any) => {
 *           // Implementation...
 *         }
 *       };
 *     }
 *   }
 * });
 * ```
 */
export function createPlugin<
    N extends string,
    const O extends Schema | undefined,
    P extends PluginDescriptor<N, O>,
    A extends string | undefined,
    X extends PluginMethods<
        ExtractPluginType<P>,
        ExtractPluginOption<P>,
        A extends undefined ? never : A
    >,
>(
    param: P,
    handlers: X
) {
    // Merge descriptor and handlers into a unified core architecture
    const core = {
        ...param,
        ...handlers,
    } as PluginArchitecture<N, O, P, A, X>;

    /**
     * Infer the expected instantiation options for this plugin
     */
    type InstanceOpts = T.Infer<ExtractPluginOption<P>>;

    /**
     * Normalize to null if no options are expected
     */
    type RealInstanceOpts = InstanceOpts extends never ? null : InstanceOpts;

    /**
     * Generate a unique symbol for this plugin class.
     * This symbol is shared by all instances of this plugin class but unique
     * across different plugin classes.
     */
    const uuid = Symbol(`plugin:${param.name}`);

    /**
     * Concrete Plugin class implementation returned by createPlugin.
     * This class extends the abstract Plugin base class and provides
     * the signature implementation.
     */
    return class PluginInstance extends Plugin<N, O, P, A, X> {
        /**
         * Constructs a new instance of this plugin with the given configuration.
         *
         * @param cfg - The configuration object matching the plugin's schema
         *
         * @throws {Error} If required configuration is missing
         */
        constructor(cfg: RealInstanceOpts) {
            super(core);

            // Validate required configuration
            if (core.optsRequired && (cfg === null || cfg === undefined)) {
                throw new Error(
                    `[@monitext/event]: Plugin "${core.name}" requires configuration but none was provided`
                );
            }

            this.configure(cfg);
        }

        /**
         * The plugin's core architecture (descriptor + handlers).
         * This is exposed publicly for introspection and type inference.
         */
        public readonly core = core;

        /**
         * Returns this plugin's unique signature symbol.
         *
         * @returns The unique symbol for this plugin class
         */
        public signature(): symbol {
            return uuid;
        }

        /**
         * Static method to get the plugin's signature without an instance.
         *
         * @returns The unique symbol for this plugin class
         */
        public static signature(): symbol {
            return uuid;
        }
    };
}

/**
 * Helper type to extract the configuration type from a plugin instance.
 *
 * @template P - A plugin instance type
 *
 * @example
 * ```typescript
 * type LoggerConfig = PluginConfig<typeof loggerPlugin>;
 * // Result: { level: string; format: string }
 * ```
 */
export type PluginConfig<P extends Plugin<any, any, any, any, any>> =
    P extends Plugin<any, any, any, any, any, any, any, infer Config>
        ? Config
        : never;

/**
 * Helper type to extract the plugin type (consumer/producer/both) from a plugin instance.
 *
 * @template P - A plugin instance type
 *
 * @example
 * ```typescript
 * type LoggerType = PluginTypeFromInstance<typeof loggerPlugin>;
 * // Result: 'consumer'
 * ```
 */
export type PluginTypeFromInstance<P extends Plugin<any, any, any, any, any>> =
    P extends Plugin<any, any, infer Desc, any, any> ? ExtractPluginType<Desc> : never;
