import { PluginType } from "../lib:v2-claude";
import { EventData } from "./bus-types";
import { InferPluginContext } from "./plugin-types";

export function createContext<T extends PluginType>(param: {
    type: T;
    emit(event: EventData<any>): Promise<void>;
    globalSubscribers: Set<(event: EventData<any>) => void>;
    eventHandlers: Map<string, Set<(event: EventData<any>) => void>>;
}) {
    const { type, emit, globalSubscribers, eventHandlers } = param;
    const conext = {} as any;

    if (["consumer", "both"].includes(type)) {
        conext.subscribe = (
            handler: (event: EventData<any>) => void,
        ) => {
            globalSubscribers.add(handler);
        };

        conext.on = (
            eventType: string,
            handler: (event: EventData) => void,
        ): void => {
            if (!eventHandlers.has(eventType)) {
                eventHandlers.set(eventType, new Set());
            }
            eventHandlers.get(eventType)!.add(handler);
        };
    }

    if (["producer", "both"].includes(type)) {
        conext.emit = emit;
    }

    return Object.freeze(conext) as InferPluginContext<T>;
}

export function asyncReminder(
    label: string,
    emitFn: (...args: any[]) => Promise<any>,
) {
    return new Proxy(emitFn, {
        apply(target, thisArg, argumentsList) {
            const result = target.apply(thisArg, argumentsList);
            if (result instanceof Promise) {
                console.warn(
                    `⚠️ Warning: ${label}() returned a Promise. Did you forget to await?`,
                );
            }
            return result;
        },
    });
}

export function primitiveObjClone<T extends object>(obj: T): T {
    return typeof structuredClone === "function"
        ? structuredClone(obj)
        : JSON.parse(JSON.stringify(obj));
}
