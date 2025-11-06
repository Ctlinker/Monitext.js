import type { BuildHelpers, BuildParams } from "./build-types"
import { spawnSync } from "node:child_process"
import { UsrEvaluatedStep } from "./step-types"

/** --- Types --- */

/** --- Default Helpers Factory --- */
export function createDefaultHelpers(p:{ ctxDirname: string, ctxFilename: string, ctxPkg: string }): BuildHelpers {
    return {
        getDirname: () => p.ctxDirname,
        getFilename: () => p.ctxFilename,
        getPkgManager: () => "pnpm", // or autodetect from lockfiles
        run({ cmd, args = [], cwd = p.ctxDirname, stdout }) {
            const result = spawnSync(cmd, args, { cwd, encoding: "utf8" })
            if (stdout) stdout(result.stdout)
            else console.log(result.stdout)
        },
        execStep() {
            return false
        }
    }
}


/** --- Build Class --- */
export class Build {
	private helpers: BuildHelpers

	constructor(private ctx: BuildParams, overrides?: Partial<BuildHelpers>) {
		const baseHelpers = createDefaultHelpers({
            ctxDirname: ctx.params.dirname,
            ctxFilename: ctx.params.filename ?? "",
            ctxPkg: ctx.params.packageManager ?? ""
        })

		// We create execStep *after* helpers exist, so it can reference itself
		this.helpers = {
			...baseHelpers,
			...overrides,
			execStep: (steps: UsrEvaluatedStep[]) => {
				for (const step of steps) {
					try {
						const result = step(this.helpers)
						if (result === false) {
							console.warn(`⚠️ Nested step returned false`)
						}
					} catch (err) {
						console.error(`❌ Nested step failed:`, err)
						throw err
					}
				}
                return true
			},
		}
	}

	async run() {
		const { steps, params } = this.ctx
		console.log(`🧱 Running build: ${params.name}`)

		for (const step of steps as UsrEvaluatedStep[]) {
			console.log(`→ Executing step...`)
			try {
				const result = await step(this.helpers)
				if (result === false) {
					console.warn(`⚠️ Step returned false — build may be incomplete.`)
				}
			} catch (err) {
				console.error(`❌ Step failed:`, err)
				throw err
			}
		}

		console.log(`✅ Build complete.`)
	}
}
