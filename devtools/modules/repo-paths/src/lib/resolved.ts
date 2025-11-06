import { createPathResolverFor } from "./resolver";

const fromProjectRoot = createPathResolverFor([
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
]);

export const resolveFrom = {
    projectRoot: fromProjectRoot,
    packagesDir: createPathResolverFor(fromProjectRoot("packages")),
    devtoolsDir: createPathResolverFor(fromProjectRoot("devtools")),
    scriptsDir: createPathResolverFor(fromProjectRoot("devtools", "scripts")),
};
