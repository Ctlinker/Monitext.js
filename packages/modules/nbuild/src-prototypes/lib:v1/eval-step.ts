import { Step } from "./step"
import { BuilderParam, BuildParam } from "./step-types"

/**
 * Wraps a Step to allow staged evaluation:
 *   1. Provide user config.
 *   2. Provide build context and helpers.
 * Returns the result of executing the step.
 */
export function evaluateStep<T extends object | null>(step: Step<T>) {
    return (userConfig: T) => {
        return (context: BuilderParam, helpers: BuildParam) =>
            step.exec({
                build: context,
                usrConfig: userConfig,
                getHelper: () => Step, /
            })
    }
}
