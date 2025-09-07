import * as path from "node:path";

export function dfsResolvePaths<T extends Record<string, any>>(obj: T, root: string): T {
    function walk(current: any): any {
        if (typeof current === "string" && (current.startsWith("./") || current.startsWith("../"))) {
            return path.resolve(root, current);
        }

        if (current && typeof current === "object" && !Array.isArray(current)) {
            const result: Record<string, any> = {};
            for (const key in current) {
                result[key] = walk(current[key]);
            }
            return result;
        }

        if (Array.isArray(current)) {
            return current.map(walk);
        }

        return current;
    }

    return walk(obj);
}
