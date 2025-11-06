import { join } from "node:path";
import { existsSync } from "node:fs";

/**
 * Creates a path resolver function for a given root directory or directories.
 * The resolver function can be used to construct and validate paths relative to the root.
 *
 * @param root - The root directory or an array of directory segments to create the root path.
 *               If an array is provided, the segments are joined to form the root path.
 *               If a string is provided, it is split and normalized.
 * 
 * @returns A function that takes path segments as arguments, joins them with the root path,
 *          and validates the resulting path. If the resulting path does not exist, an error is thrown.
 * 
 * @throws {Error} If the provided root path does not exist.
 * @throws {Error} If the resolved path does not exist when the returned function is called.
 */
export function createPathResolverFor(root: string | string[]) {
    let ROOT_PATH = Array.isArray(root)
        ? join(...root)
        : root.split(/(?<!^)\/+/).reduce((acc, part) => join(acc, part), "");

    if (!existsSync(ROOT_PATH)) {
        throw new Error(
            `Monitext Path Error, root path '${ROOT_PATH}' do not exist`,
        );
    }

    return (...PathPart: string[]) => {
        const resultPath = join(ROOT_PATH, ...PathPart);

        if (!existsSync(resultPath)) {
            throw new Error(
                `Monitext Path Error, path '${resultPath}' do not exist`,
            );
        }

        return resultPath;
    };
}