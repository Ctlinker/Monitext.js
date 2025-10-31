import { BusConnection } from './bus-connection';
import { BusHookOptions, EventData } from './monitor-types';
import { InferPluginInstance, PluginCtx, PluginType } from './plugin-types';

/**
 * The Monitor is the central event bus that manages plugin connections and event routing.
 *
 * It coordinates the flow of events between producer and consumer plugins, manages
 * plugin lifecycles, handles event subscriptions, and provides namespace access to
 * plugin-specific APIs.
 *
 * @template P - An array type of plugin instances
 *
 * @example
 * ```typescript
 * const monitor = new Monitor({
 *   plugins: [loggerPlugin, httpPlugin, databasePlugin]
 * });
 *
 * // Subscribe to all events
 * monitor.subscribe((event) => {
 *   console.log('Event:', event.type, event.payload);
 * });
 *
 * // Subscribe to specific event types
 * monitor.on('user.login', (event) => {
 *   console.log('User logged in:', event.payload);
 * });
 *
 * // Access plugin namespaces
 * const { log, http } = monitor.namespaces();
 * log.info('Application started');
 * ```
 */
export class Monitor<P extends Array<InferPluginInstance<any>>> {
	/**
	 * The array of plugin instances registered with this monitor.
	 */
	public readonly plugins: [...P];

	/**
	 * Map of plugin signatures to their bus connections.
	 * Each plugin gets a unique connection that manages its interaction with the bus.
	 */
	private connections = new Map<
		symbol,
		{ [K in keyof P]: BusConnection<P[K]> }[number]
	>();

	/**
	 * Map of global hook IDs to their configurations.
	 * Global hooks apply to all plugins on the bus.
	 */
	private hooks = new Map<string, BusHookOptions>();

	/**
	 * Map of event types to their registered handlers.
	 * Used for type-specific event routing (via `on` method).
	 */
	private eventHandlers = new Map<string, Set<(event: EventData) => void>>();

	/**
	 * Set of global subscribers that receive all events regardless of type.
	 */
	private globalSubscribers = new Set<(event: EventData) => void>();

	/**
	 * Flag to track if the monitor has been started/initialized.
	 */
	private isStarted: boolean = false;

	/**
	 * Creates a new Monitor instance and registers all provided plugins.
	 *
	 * @param param - Configuration object containing the plugins array
	 * @throws {Error} If plugin registration fails
	 *
	 * @example
	 * ```typescript
	 * const monitor = new Monitor({
	 *   plugins: [
	 *     new LoggerPlugin({ level: 'info' }),
	 *     new HttpPlugin({ baseUrl: 'https://api.example.com' })
	 *   ]
	 * });
	 * ```
	 */
	constructor(param: { plugins: [...P] }) {
		this.plugins = [...param.plugins] as [...P];

		// Register each plugin
		for (const plugin of this.plugins) {
			this.registerPlugin(plugin);
		}

		this.isStarted = true;
	}

	/**
	 * Registers a plugin with the monitor.
	 *
	 * This process:
	 * 1. Checks for duplicate signatures
	 * 2. Creates a BusConnection for the plugin
	 * 3. Creates an appropriate context (consumer/producer/both)
	 * 4. Activates the plugin with the context
	 * 5. Rolls back on error
	 *
	 * @template X - The plugin instance type
	 * @param plugin - The plugin instance to register
	 * @throws {Error} If the plugin signature is already registered
	 * @throws {Error} If plugin activation fails
	 *
	 * @private
	 */
	private registerPlugin<X>(plugin: InferPluginInstance<X>): void {
		const pluginAny = plugin as any;
		const signature = pluginAny.signature();

		// Check for duplicate registration
		if (this.connections.has(signature)) {
			throw new Error(
				`[@monitext/event]: Plugin "${pluginAny.core.name}" with signature already registered`,
			);
		}

		// Create the connection
		const connection = new BusConnection(plugin);
		this.connections.set(signature, connection as any);

		try {
			// Create context with actual implementations
			const ctx = this.createPluginContext(
				connection.type as PluginType,
				signature,
			);

			// Activate plugin with context
			const error = pluginAny.activate(ctx);

			if (error) {
				// Rollback on activation failure
				this.connections.delete(signature);
				throw error;
			}
		} catch (error) {
			// Ensure cleanup on any error
			this.connections.delete(signature);
			throw new Error(
				`[@monitext/event]: Failed to register plugin "${pluginAny.core.name}"`,
				{ cause: error },
			);
		}
	}

	/**
	 * Creates a properly typed context for a plugin based on its type.
	 *
	 * The context provides the appropriate methods:
	 * - Consumer: subscribe, on
	 * - Producer: emit
	 * - Both: subscribe, on, emit
	 *
	 * @template T - The plugin type (consumer/producer/both)
	 * @param pluginType - The type of plugin
	 * @param signature - The plugin's unique signature
	 * @returns A frozen context object with the appropriate methods
	 *
	 * @private
	 */
	private createPluginContext<T extends PluginType>(
		pluginType: T,
		signature: symbol,
	): PluginCtx<T> {
		const ctx: any = {};

		// Add consumer methods
		if (pluginType === 'consumer' || pluginType === 'both') {
			ctx.subscribe = (handler: (event: EventData) => void): void => {
				this.globalSubscribers.add(handler);
			};

			ctx.on = (
				eventType: string,
				handler: (event: EventData) => void,
			): void => {
				if (!this.eventHandlers.has(eventType)) {
					this.eventHandlers.set(eventType, new Set());
				}
				this.eventHandlers.get(eventType)!.add(handler);
			};
		}

		// Add producer methods
		if (pluginType === 'producer' || pluginType === 'both') {
			ctx.emit = async (event: EventData): Promise<void> => {
				await this.routeEvent(event, signature);
			};
		}

		// Freeze context to prevent modification
		return Object.freeze(ctx);
	}

	/**
	 * Routes an event to appropriate handlers based on rules and hooks.
	 *
	 * This method:
	 * 1. Executes pre-emit hooks (if applicable)
	 * 2. Routes to global subscribers
	 * 3. Routes to type-specific handlers
	 * 4. Executes post-receive hooks (if applicable)
	 * 5. Handles errors gracefully without stopping propagation
	 *
	 * @param event - The event to route
	 * @param sourceSignature - The signature of the plugin that emitted the event
	 * @returns A promise that resolves when all handlers have been executed
	 *
	 * @private
	 */
	private async routeEvent(
		event: EventData,
		sourceSignature: symbol,
	): Promise<void> {
		// Execute emit hooks (from the source plugin)
		await this.executeHooks('emit', event, sourceSignature);

		// Route to global subscribers
		for (const handler of this.globalSubscribers) {
			try {
				await handler(event);
			} catch (error) {
				console.error(
					`[@monitext/event]: Global subscriber failed for event "${event.type}":`,
					error,
				);
			}
		}

		// Route to specific event type handlers
		const handlers = this.eventHandlers.get(event.type);
		if (handlers) {
			for (const handler of handlers) {
				try {
					await handler(event);
				} catch (error) {
					console.error(
						`[@monitext/event]: Handler for "${event.type}" failed:`,
						error,
					);
				}
			}
		}

		// Execute receive hooks (for consuming plugins)
		await this.executeHooks('receive', event, sourceSignature);

		// Execute general hooks
		await this.executeHooks('general', event, sourceSignature);
	}

	/**
	 * Executes hooks of a specific type for an event.
	 *
	 * @param hookType - The type of hook to execute (emit/receive/general)
	 * @param event - The event being processed
	 * @param sourceSignature - The signature of the plugin that originated the event
	 *
	 * @private
	 */
	private async executeHooks(
		hookType: 'emit' | 'receive' | 'general',
		event: EventData,
		sourceSignature: symbol,
	): Promise<void> {
		// Execute global hooks
		for (const [hookId, hookOptions] of this.hooks) {
			const handlers = hookOptions.handlers[hookType];
			if (handlers) {
				await this.runHookHandlers(hookId, handlers, event);
			}
		}

		// Execute plugin-specific hooks
		const connection = this.connections.get(sourceSignature);
		if (connection) {
			for (const [hookId, hookOptions] of connection.getAllHooks()) {
				const handlers = hookOptions.handlers[hookType];
				if (handlers) {
					await this.runHookHandlers(hookId, handlers, event);
				}
			}
		}
	}

	/**
	 * Runs an array of hook handlers for an event.
	 *
	 * @param hookId - The ID of the hook being executed
	 * @param handlers - The array of handlers to run
	 * @param event - The event being processed
	 *
	 * @private
	 */
	private async runHookHandlers(
		hookId: string,
		handlers: ((event: EventData) => void | Promise<void>)[],
		event: EventData,
	): Promise<void> {
		for (const handler of handlers) {
			try {
				await handler(event);
			} catch (error) {
				console.error(
					`[@monitext/event]: Hook "${hookId}" handler failed for event "${event.type}":`,
					error,
				);
			}
		}
	}

	/**
	 * Collects and returns all plugin namespaces as a merged object.
	 *
	 * Namespaces provide a way to access plugin-specific APIs directly through
	 * the monitor. Each plugin with a namespace contributes its handlers under
	 * its alias key.
	 *
	 * @returns An object where keys are namespace aliases and values are handler objects
	 *
	 * @example
	 * ```typescript
	 * const monitor = new Monitor({
	 *   plugins: [loggerPlugin, httpPlugin]
	 * });
	 *
	 * const { log, http } = monitor.namespaces();
	 *
	 * // Use logger namespace
	 * log.info('Application started');
	 * log.error('An error occurred');
	 *
	 * // Use http namespace
	 * const data = await http.get('/users');
	 * await http.post('/users', { name: 'John' });
	 * ```
	 */
	public namespaces(): {
		[K in keyof [...P] as [...P][K] extends {
			core: { namespace: { alias: infer X extends string } };
		}
			? X
			: never]: [...P][K] extends {
			core: {
				namespace: {
					getHandlers: infer X extends (...param: any[]) => any;
				};
			};
		}
			? ReturnType<X>
			: never;
	} {
		const namespaces: Record<string, any> = {};

		for (const [signature, connection] of this.connections) {
			if (connection.hasNamespace()) {
				const ctx = this.createPluginContext(connection.type, signature);
				const namespace = connection.getNamespace(ctx);

				if (namespace) {
					Object.assign(namespaces, namespace);
				}
			}
		}

		return namespaces as any;
	}

	/**
	 * Subscribes a handler to all events flowing through the bus.
	 *
	 * Global subscribers receive every event regardless of type or source.
	 * Use this for cross-cutting concerns like logging, monitoring, or debugging.
	 *
	 * @param handler - The function to call for each event
	 *
	 * @example
	 * ```typescript
	 * monitor.subscribe((event) => {
	 *   console.log(`[${new Date().toISOString()}] ${event.type}`, event.payload);
	 * });
	 * ```
	 */
	public subscribe(handler: (event: EventData) => void): void {
		this.globalSubscribers.add(handler);
	}

	/**
	 * Subscribes a handler to events of a specific type.
	 *
	 * Type-specific handlers only receive events matching the specified type string.
	 * Multiple handlers can be registered for the same event type.
	 *
	 * @param eventType - The event type to listen for (e.g., 'user.login', 'data.update')
	 * @param handler - The function to call when matching events occur
	 *
	 * @example
	 * ```typescript
	 * monitor.on('user.login', (event) => {
	 *   console.log('User logged in:', event.payload.userId);
	 * });
	 *
	 * monitor.on('user.logout', (event) => {
	 *   console.log('User logged out:', event.payload.userId);
	 * });
	 * ```
	 */
	public on(eventType: string, handler: (event: EventData) => void): void {
		if (!this.eventHandlers.has(eventType)) {
			this.eventHandlers.set(eventType, new Set());
		}
		this.eventHandlers.get(eventType)!.add(handler);
	}

	/**
	 * Unsubscribes a handler from the global subscription.
	 *
	 * @param handler - The handler function to remove
	 * @returns true if the handler was found and removed, false otherwise
	 *
	 * @example
	 * ```typescript
	 * const handler = (event) => console.log(event);
	 * monitor.subscribe(handler);
	 *
	 * // Later...
	 * monitor.unsubscribe(handler); // Returns true
	 * monitor.unsubscribe(handler); // Returns false (already removed)
	 * ```
	 */
	public unsubscribe(handler: (event: EventData) => void): boolean {
		return this.globalSubscribers.delete(handler);
	}

	/**
	 * Unsubscribes a handler from a specific event type.
	 *
	 * @param eventType - The event type to unsubscribe from
	 * @param handler - The handler function to remove
	 * @returns true if the handler was found and removed, false otherwise
	 *
	 * @example
	 * ```typescript
	 * const loginHandler = (event) => console.log('Login:', event);
	 * monitor.on('user.login', loginHandler);
	 *
	 * // Later...
	 * monitor.off('user.login', loginHandler); // Returns true
	 * ```
	 */
	public off(eventType: string, handler: (event: EventData) => void): boolean {
		const handlers = this.eventHandlers.get(eventType);
		if (handlers) {
			return handlers.delete(handler);
		}
		return false;
	}

	/**
	 * Registers a hook to intercept and process events.
	 *
	 * Hooks can be global (apply to all plugins) or plugin-specific.
	 * They can intercept events at different stages: emit, receive, or general.
	 *
	 * @param hookId - Unique identifier for this hook
	 * @param param - Hook configuration including handlers, target plugins, and metadata
	 *
	 * @example
	 * ```typescript
	 * // Global logging hook
	 * monitor.hook('global-logger', {
	 *   handlers: {
	 *     emit: [
	 *       (event) => console.log('→ Emitting:', event.type)
	 *     ],
	 *     receive: [
	 *       (event) => console.log('← Received:', event.type)
	 *     ]
	 *   },
	 *   meta: {
	 *     description: 'Logs all event flow',
	 *     priority: 1
	 *   }
	 * });
	 *
	 * // Plugin-specific validation hook
	 * monitor.hook('http-validator', {
	 *   handlers: {
	 *     emit: [
	 *       async (event) => {
	 *         if (event.type.startsWith('http.') && !event.payload.url) {
	 *           throw new Error('HTTP events must have a URL');
	 *         }
	 *       }
	 *     ]
	 *   },
	 *   plugins: [httpPlugin],
	 *   meta: { description: 'Validates HTTP events' }
	 * });
	 * ```
	 */
	public hook(hookId: string, param: BusHookOptions): void {
		if (!param.plugins || param.plugins.length === 0) {
			// Global hook
			if (this.hooks.has(hookId)) {
				console.warn(
					`[@monitext/event]: Global hook "${hookId}" already exists, overwriting`,
				);
			}
			this.hooks.set(hookId, param);
			return;
		}

		// Plugin-specific hooks
		for (const plugin of param.plugins) {
			const conn = this.connections.get(plugin.signature());
			if (!conn) {
				console.warn(
					`[@monitext/event]: Hook "${hookId}" references plugin "${plugin.core?.name || 'unknown'}" which is not registered on this monitor`,
				);
				continue;
			}
			conn.setHook(hookId, param);
		}
	}

	/**
	 * Removes a hook by its ID.
	 *
	 * If the hook was global, it's removed from the monitor.
	 * If it was plugin-specific, it's removed from all targeted plugins.
	 *
	 * @param hookId - The hook identifier to remove
	 * @returns true if at least one hook was removed, false otherwise
	 *
	 * @example
	 * ```typescript
	 * monitor.removeHook('global-logger'); // Remove global hook
	 * monitor.removeHook('http-validator'); // Remove plugin-specific hook
	 * ```
	 */
	public removeHook(hookId: string): boolean {
		let removed = false;

		// Try removing from global hooks
		if (this.hooks.delete(hookId)) {
			removed = true;
		}

		// Try removing from plugin-specific hooks
		for (const connection of this.connections.values()) {
			if (connection.removeHook(hookId)) {
				removed = true;
			}
		}

		return removed;
	}

	/**
	 * Gets the number of registered plugins.
	 *
	 * @returns The count of plugins registered with this monitor
	 *
	 * @example
	 * ```typescript
	 * console.log(`Monitor has ${monitor.pluginCount} plugins`);
	 * ```
	 */
	public get pluginCount(): number {
		return this.connections.size;
	}

	/**
	 * Gets the number of global subscribers.
	 *
	 * @returns The count of global event subscribers
	 *
	 * @example
	 * ```typescript
	 * console.log(`${monitor.subscriberCount} global subscribers`);
	 * ```
	 */
	public get subscriberCount(): number {
		return this.globalSubscribers.size;
	}

	/**
	 * Gets the total number of event type handlers across all types.
	 *
	 * @returns The total count of type-specific handlers
	 *
	 * @example
	 * ```typescript
	 * console.log(`${monitor.handlerCount} type-specific handlers`);
	 * ```
	 */
	public get handlerCount(): number {
		let count = 0;
		for (const handlers of this.eventHandlers.values()) {
			count += handlers.size;
		}
		return count;
	}

	/**
	 * Gets the number of registered event types.
	 *
	 * @returns The count of unique event types that have handlers
	 *
	 * @example
	 * ```typescript
	 * console.log(`Listening to ${monitor.eventTypeCount} event types`);
	 * ```
	 */
	public get eventTypeCount(): number {
		return this.eventHandlers.size;
	}

	/**
	 * Gets statistics about the monitor's current state.
	 *
	 * @returns An object containing various statistics
	 *
	 * @example
	 * ```typescript
	 * const stats = monitor.getStats();
	 * console.log('Monitor Statistics:', {
	 *   plugins: stats.plugins,
	 *   subscribers: stats.globalSubscribers,
	 *   handlers: stats.typeSpecificHandlers,
	 *   eventTypes: stats.eventTypes,
	 *   hooks: stats.globalHooks
	 * });
	 * ```
	 */
	public getStats(): {
		plugins: number;
		globalSubscribers: number;
		typeSpecificHandlers: number;
		eventTypes: number;
		globalHooks: number;
		isStarted: boolean;
	} {
		return {
			plugins: this.pluginCount,
			globalSubscribers: this.subscriberCount,
			typeSpecificHandlers: this.handlerCount,
			eventTypes: this.eventTypeCount,
			globalHooks: this.hooks.size,
			isStarted: this.isStarted,
		};
	}

	/**
	 * Gets a list of all registered plugin names.
	 *
	 * @returns An array of plugin names
	 *
	 * @example
	 * ```typescript
	 * console.log('Registered plugins:', monitor.getPluginNames());
	 * // Output: ['logger', 'http-client', 'database']
	 * ```
	 */
	public getPluginNames(): string[] {
		return Array.from(this.connections.values()).map((conn) => conn.name);
	}

	/**
	 * Gets a list of all event types that have registered handlers.
	 *
	 * @returns An array of event type strings
	 *
	 * @example
	 * ```typescript
	 * console.log('Listening for:', monitor.getEventTypes());
	 * // Output: ['user.login', 'user.logout', 'data.update']
	 * ```
	 */
	public getEventTypes(): string[] {
		return Array.from(this.eventHandlers.keys());
	}

	/**
	 * Checks if a specific plugin is registered by its signature.
	 *
	 * @param signature - The plugin signature to check
	 * @returns true if the plugin is registered
	 *
	 * @example
	 * ```typescript
	 * const sig = LoggerPlugin.signature();
	 * if (monitor.hasPlugin(sig)) {
	 *   console.log('Logger plugin is registered');
	 * }
	 * ```
	 */
	public hasPlugin(signature: symbol): boolean {
		return this.connections.has(signature);
	}

	/**
	 * Gets a string representation of the monitor for debugging.
	 *
	 * @returns A debug string with monitor statistics
	 *
	 * @example
	 * ```typescript
	 * console.log(monitor.toString());
	 * // Output: "Monitor(plugins=3, subscribers=2, handlers=5)"
	 * ```
	 */
	public toString(): string {
		return `Monitor(plugins=${this.pluginCount}, subscribers=${this.subscriberCount}, handlers=${this.handlerCount})`;
	}
}
