import { BuildParam } from "./step-types"

/**
 * Represents a single build step.
 *
 * @template T - Type of user configuration for this step.
 */
export class Step<const T extends object | null> {
    /** Unique name for this step */
    readonly name: string

    /**
     * Execution logic for this step.
     */
    readonly exec: <U extends T>(ctx: {
        build: BuildParam
        usrConfig: U
    }) => boolean

    constructor(param: {
        name: string
        exec<U extends T>(ctx: {
            build: BuildParam
            usrConfig: U
            getHelper(): typeof Step
        }): boolean
    }) {
        this.name = param.name
        this.exec = <U extends T>(ctx: { build: BuildParam; usrConfig: U }) => {
            // Inject getHelper dynamically
            return param.exec({
                ...ctx,
                getHelper() {
                    return Step
                }
            })
        }
    }

    /**
     * Run a command-line process.
     *
     * @param param - Command details
     */
    static run(param: {
        cmd: string
        args?: string[]
        cwd?: string
        stdout?: (str: string) => void
    }) {
        const { cmd, args = [], cwd, stdout } = param
        const { spawn } = require("child_process")

        const proc = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] })

        proc.stdout.on("data", (chunk: Buffer) => stdout?.(chunk.toString()))
        proc.stderr.on("data", (chunk: Buffer) => stdout?.(chunk.toString()))
        proc.on("close", (code: number) => stdout?.(`Process exited with code ${code}`))
    }
}
