import { evaluateStep, Step } from './step';

export type EvaluableStep = ReturnType<typeof evaluateStep<Step<any, any>>>;

export type UsrEvaluatedStep = ReturnType<EvaluableStep>;
