import { T } from "@monitext/typson";
import {
    ExtractPluginOption,
    ExtractPluginType,
    InferPluginArchitecture,
    InferPluginContext,
} from "./plugin-types";

/**
 * Abstract base class for all Monitext plugins.
 *
 * @template Core - The plugin descriptor and methods definition.
 * @template CoreOptions - The inferred configuration schema from the plugin's `opts.schema`.
 * @template ThisContext - The inferred context object (`ConsumerCtx`, `ProducerCtx`, or both), based on plugin type.
 * @template ThisOptions - The actual configuration type passed to the plugin, or `null` if none.
 */
export abstract class Plugin<
    Core,
    CoreOptions = T.Infer<ExtractPluginOption<Core>>,
    ThisContext = InferPluginContext<ExtractPluginType<Core>>,
    ThisOptions = CoreOptions extends never ? null : CoreOptions,
> {
    /**
     * @param core - The full plugin architecture including metadata and implementation.
     */
    constructor(public readonly core: InferPluginArchitecture<Core>) {}

    /** @internal Internal configuration store. */
    #config!: {
        store: ThisOptions;
    };

    /** @internal Tracks whether the plugin has been activated. */
    #isActivated: boolean = false;

    public get config() {
        return this.#config.store;
    }

    public get isActivated() {
        return this.#isActivated;
    }

    /**
     * Activates the plugin by calling its `init` method with the provided context and configuration.
     *
     * @param ctx - The runtime context specific to the plugin type (consumer/producer/both).
     * @returns `null` on success, or an `Error` if the plugin is already activated or if initialization fails.
     */
    public activate(ctx: ThisContext): Error | null {
        if (this.#isActivated) {
            return new Error(
                `[@monitext/event]: Plugin "${this.core.name}" is already activated`,
            );
        }

        try {
            this.core.init(ctx as any, this.#config.store as any);
            this.#isActivated = true;
            return null;
        } catch (error) {
            return new Error(
                `[@monitext/event]: Error while initializing plugin "${this.core.name}", see error cause for more info`,
                { cause: error },
            );
        }
    }

    /**
     * Stores the configuration to be used when activating the plugin.
     *
     * @param param - Configuration object, type inferred from the plugin schema or `null`.
     */
    public configure(param: ThisOptions): void {
        this.#config = { store: param };
    }

    /**
     * Returns a unique symbol that identifies this plugin instance.
     * Must be implemented by subclasses.
     *
     * @returns A `Symbol` that acts as a unique signature.
     */
    public abstract signature(): symbol;

    /**
     * Static method for retrieving a unique signature for the plugin class.
     * Should be implemented by subclasses.
     *
     * @returns A `Symbol` that acts as a unique signature for the class.
     */
    public static signature: () => symbol;
}
