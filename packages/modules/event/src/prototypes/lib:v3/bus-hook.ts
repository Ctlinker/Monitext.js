import { BusHookOptions, EventData, SortedHooks } from "./bus-types";
import { Connection } from "./connection";

export class HookManager {
    public hooks = new Map<string, BusHookOptions>();

    public addHook(
        p: {
            hookId: string;
            param: BusHookOptions;
            connections: Map<symbol, Connection<any>>;
        },
    ): void {
        const { param, hookId, connections } = p;
        if (!param.plugins || param.plugins.length === 0) {
            // Global hook
            if (this.hooks.has(hookId)) {
                console.warn(
                    `[@monitext/event]: Global hook "${hookId}" already exists, overwriting`,
                );
            }
            this.hooks.set(hookId, param);
            this.clearSortedCache(this.hooks);
            return;
        }

        // Plugin-specific hooks
        for (const plugin of param.plugins) {
            const conn = connections.get(plugin.signature());
            if (!conn) {
                console.warn(
                    `[@monitext/event]: Hook "${hookId}" references plugin "${
                        plugin.core?.name || "unknown"
                    }" which is not registered on this monitor`,
                );
                continue;
            }
            conn.setHook(hookId, param);
            this.clearSortedCache(conn.getAllHooks());
        }
    }

    /**
     * Executes multiple types of hooks for a given event.
     *
     * Runs all specified hook types (in order) across the provided hook provider,
     * respecting hook priority metadata and falling back to `general` handlers if needed.
     *
     * @param hookTypes - The hook types to execute (e.g. ["emit", "receive"])
     * @param event - The event being processed
     * @param sourceSignature - The signature of the plugin that originated the event
     * @param hookProvider - The hook map (global or plugin-level)
     */
    public async executeMultipleHooks(param: {
        hookTypes: ("emit" | "receive")[];
        event: EventData;
        sourceSignature: symbol;
        hookProvider: Map<string, BusHookOptions>;
    }): Promise<void> {
        for (const hookType of param.hookTypes) {
            await this.executeHooks({ ...param, hookType });
        }
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
    public async executeHooks(param: {
        hookType: "emit" | "receive";
        event: EventData;
        sourceSignature: symbol;
        hookProvider: Map<string, BusHookOptions>;
    }): Promise<void> {
        const { hookType, event, hookProvider } = param;
        const sortedHooks = this.getSortedHooks(hookProvider, hookType);

        for (const { hookId, handlers } of sortedHooks) {
            await this.runHookHandlers(hookId, handlers, event);
        }
    }

    private sortedHookCache = new Map<
        Map<string, BusHookOptions>,
        SortedHooks
    >();

    private getSortedHooks(
        hookProvider: Map<string, BusHookOptions>,
        hookType: "emit" | "receive",
    ): SortedHooks {
        if (this.sortedHookCache.has(hookProvider)) {
            return this.sortedHookCache.get(hookProvider)!;
        }

        const sorted: SortedHooks = Array.from(hookProvider.entries())
            .sort(([, a], [, b]) =>
                (b.meta?.priority ?? 0) - (a.meta?.priority ?? 0)
            )
            .map(([hookId, hookOptions]) => ({
                hookId,
                handlers: hookOptions.handlers[hookType] ?? [],
            }))
            .filter((h) => h.handlers.length > 0);

        this.sortedHookCache.set(hookProvider, sorted);

        return sorted;
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

    private clearSortedCache(hookProvider: Map<string, BusHookOptions>): void {
        this.sortedHookCache.delete(hookProvider);
    }
}
