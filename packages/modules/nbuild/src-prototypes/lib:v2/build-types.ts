import { UsrEvaluatedStep } from './step-types';

export type BuildContext = {
	name: string;
	dirname: string;
    filename?: string;
	packageManager?: string;
};

export type packageManagers = 'npm' | 'pnpm';

export type BuildHelpers = {
	getDirname(): string;
	getFilename(): string;
	getPkgManager(): packageManagers;
	run(param: {
		cmd: string;
		args?: string[];
		cwd?: string;
		stdout?: (str: string) => void;
	}): void;
    execStep(param: UsrEvaluatedStep[]): boolean | Promise<boolean>
};

export type BuildParams = {
	params: BuildContext;
	steps: UsrEvaluatedStep[];
};
