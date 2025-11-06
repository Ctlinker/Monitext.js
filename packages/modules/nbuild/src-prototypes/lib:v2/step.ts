import { BuildHelpers } from './build-types';

export class Step<T extends object | null, const N extends string> {
	public readonly name: N;

	public exec: <U extends T>(ctx: {
		config: U;
		getHelpers: BuildHelpers;
	}) => boolean | Promise<boolean>;

	constructor(param: {
		name: N;
		exec<U extends T>(ctx: { config: U; getHelpers: BuildHelpers }): boolean | Promise<boolean>;
	}) {
		this.name = param.name;
		this.exec = param.exec;
	}
}

export function evaluateStep<S extends Step<any, any>>(step: S) {
	return (p0: S extends Step<infer T extends object | null, any> ? T : never)  => {
        return (p1:BuildHelpers)=>{
            return step.exec({
                config: p0,
                getHelpers: p1
            })
        }
    };
}

export function defineStepRegistry<const U extends readonly Step<any, string>[]>(
	param: { steps: U }
) {
	const registry = Object.create(null) as Record<
		string,
		ReturnType<typeof evaluateStep<Step<any, string>>>
	>

	for (const step of param.steps) {
		registry[step.name] = evaluateStep(step)
	}

	return registry as {
		[K in U[number] as K["name"]]: ReturnType<typeof evaluateStep<K>>
	}
}
