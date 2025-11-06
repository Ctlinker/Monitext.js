import { Build,} from "./build"
import { BuildHelpers, BuildParams } from "./build-types";
import { T } from "@monitext/typson";

type BuildTemplateFn<TSchema extends object | null> = (vars: T.Infer<TSchema>) => BuildParams;

export class BuildTemplate<TSchema extends object | null = null> {
	private buildFn: BuildTemplateFn<TSchema>;
	private schema?: T.Infer<TSchema>;

	constructor(buildFn: BuildTemplateFn<TSchema>, schema?: T.Infer<TSchema>) {
		this.buildFn = buildFn;
		this.schema = schema;
	}

	/**
	 * Generates BuildParams from user variables
	 */
	generate(vars: T.Infer<TSchema>): BuildParams {
		// Optional: if schema is defined, could do TS-only validation via Typson
		return this.buildFn(vars);
	}

	/**
	 * Runs the build immediately
	 */
	async run(vars: T.Infer<TSchema>, helpersOverride?: Partial<BuildHelpers>) {
		const buildParams = this.generate(vars);
		const build = new Build(buildParams, helpersOverride);
		return build.run();
	}
}


