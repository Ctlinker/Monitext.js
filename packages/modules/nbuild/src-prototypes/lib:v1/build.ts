import { Step } from "./step"
import { BuildParam } from "./step-types"

/**
 * Executes a build pipeline from a series of Steps.
 */
export function Build(p: BuildParam): boolean {
    const ctx = {
        param: {
            label: buildParam.fn.getFilename(),
            dirname: buildParam.fn.getDirname(),
            pkgManager: buildParam.fn.getPkgManager()
        },
        run: [] as InstanceType<typeof Step>[]
    }

    try {
        const result = fn(ctx)
        return result
    } catch (err) {
        console.error("[Build] Error executing build:", err)
        return false
    }
}


Build.prototype.f