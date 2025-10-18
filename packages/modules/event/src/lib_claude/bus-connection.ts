import { InferPluginInstance, PluginCtx } from './plugin-types';
import type { EventData } from './event-types';

/**
 * Hook handler for a specific connection
 */
export interface ConnectionHook {
	onEmit?: (data: EventData) => void | Promise<void>;
	onReceive?: (data: EventData) => void | Promise<void>;
}

/**
 * Rule for filtering events for this connection
 */
export interface ConnectionRule {
	receive?: Array<string | ((event: EventData) => boolean)>;
	filter?: (event: EventData, data: any) => boolean;
}

/**
 * BusConnection - Manages the connection between a plugin and the monitor
 */
export class BusConnection<P> {
	private hooks: ConnectionHook[] = [];
	private rule: ConnectionRule | null = null;

	constructor(public readonly plugin: InferPluginInstance<P>) {}

	/**
	 * Get the plugin's signature
	 */
	getSignature(): symbol {
		return this.plugin.signature();
	}

	/**
	 * Get the plugin's type (consumer/producer/both)
	 */
	getType(): string {
		return this.plugin.core.type;
	}

	/**
	 * Get the plugin's name
	 */
	getName(): string {
		return this.plugin.core.name;
	}

	/**
	 * Add a hook to this connection
	 */
	addHook(hook: ConnectionHook): void {
		this.hooks.push(hook);
	}

	/**
	 * Get all hooks for this connection
	 */
	getHooks(): ConnectionHook[] {
		return this.hooks;
	}

	/**
	 * Set a rule for this connection
	 */
	setRule(rule: ConnectionRule): void {
		this.rule = rule;
	}

	/**
	 * Get the rule for this connection
	 */
	getRule(): ConnectionRule | null {
		return this.rule;
	}

	/**
	 * Check if an event should be received based on the connection's rule
	 */
	shouldReceiveEvent(event: EventData): boolean {
		if (!this.rule) return true; // No rule = receive all

		// Check receive filters
		if (this.rule.receive) {
			const matches = this.rule.receive.some((filter) => {
				if (typeof filter === 'string') {
					return event.type === filter;
				} else if (typeof filter === 'function') {
					try {
						return filter(event);
					} catch (error) {
						console.error(
							`[@monitext/event]: Rule filter function failed for plugin "${this.getName()}":`,
							error,
						);
						return false;
					}
				}
				return false;
			});

			if (!matches) return false;
		}

		// Check additional filter
		if (this.rule.filter) {
			try {
				return this.rule.filter(event, event.payload);
			} catch (error) {
				console.error(
					`[@monitext/event]: Rule filter failed for plugin "${this.getName()}":`,
					error,
				);
				return false;
			}
		}

		return true;
	}

	/**
	 * Apply onEmit hooks to event data
	 */
	async applyEmitHooks(event: EventData): Promise<void> {
		for (const hook of this.hooks) {
			if (hook.onEmit) {
				try {
					await hook.onEmit(event);
				} catch (error) {
					console.error(
						`[@monitext/event]: onEmit hook failed for plugin "${this.getName()}":`,
						error,
					);
				}
			}
		}
	}

	/**
	 * Apply onReceive hooks to event data
	 */
	async applyReceiveHooks(event: EventData): Promise<void> {
		for (const hook of this.hooks) {
			if (hook.onReceive) {
				try {
					await hook.onReceive(event);
				} catch (error) {
					console.error(
						`[@monitext/event]: onReceive hook failed for plugin "${this.getName()}":`,
						error,
					);
				}
			}
		}
	}
}
