import type { Step } from "./step"

export type BuildParam = {
    fn: {
        getDirname(): string,
        getFilename(): string,
        getPkgManager(): "npm" | "pnpm"
    }
}

/**
 * Represents the context and logic of a build pipeline.
 */
export type BuilderParam = (ctx: {
    /** Build metadata and project info. */
    param: {
        label: string
        dirname: string
        pkgManager?: "npm" | "pnpm"
    }

    /** The ordered list of build steps to execute. */
    run: InstanceType<typeof Step>[]
}) => boolean


