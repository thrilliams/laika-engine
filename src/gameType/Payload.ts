import type { Immutable } from "immer";
import type { Next } from "./Next";

export type Payload<Model, Decision, Interrupt> = Immutable<{
	model: Model;
	decision: Decision;
	next: Next<Decision, Interrupt>[];
}>;
