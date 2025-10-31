import { EventData, Rule } from "./bus-types";
import { Connection } from "./connection";

export class RuleManager {
    private rules: Rule[] = [];

    public rule(rule: Rule) {
        this.rules.push(rule);
    }

    public canReceive(connection: Connection<any>, event: EventData): boolean {
        for (const rule of this.rules) {
            if (!rule.targets.includes(connection.plugin)) continue;

            if (!rule.receiveEvent) return true;

            for (const filter of rule.receiveEvent) {
                if (typeof filter === "string" && filter === event.type) {
                    return true;
                }
                if (filter instanceof RegExp && filter.test(event.type)) {
                    return true;
                }
                if (typeof filter === "function" && filter(event)) return true;
            }

            return false; // no filters matched
        }

        return true; // no rule applies → allow by default
    }
}
