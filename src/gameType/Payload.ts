import type { Immutable } from "immer";
import type { Next } from "./Next";
import type { LogObject } from "./LogObject";

export type Payload<Model, Decision, Interrupt, LogObjectContext> = Immutable<{
	model: Model;
	decision: Decision;
	next: Next<Decision, Interrupt>[];

	log: LogObject<LogObjectContext>[];
}>;
