import type { Immutable, Patch } from "immer";
import type { Next } from "./Next";
import { uuid } from "./uuid";
import type { TypedObject } from "./TypedObject";
import type { ChoiceOf } from "./createGame";

export type Payload<Model, Decision, Interrupt> = Immutable<{
	model: Model;
	decision: Decision;
	next: Next<Decision, Interrupt>[];
}>;

export interface HistoryObject<Choice> {
	// uuid
	id: string;

	choice: Choice;
	patches: Patch[];
	inversePatches: Patch[];
}

export interface Game<
	Model = unknown,
	Decision extends TypedObject = TypedObject,
	Choice extends TypedObject<Decision["type"]> = TypedObject<
		Decision["type"]
	>,
	Interrupt extends TypedObject = TypedObject
> {
	state: Payload<Model, Decision, Interrupt>;
	future: HistoryObject<Choice>[];
	history: HistoryObject<Choice>[];
}

export function addHistoryObject<G extends Game>(
	game: G,
	choice: ChoiceOf<G>,
	patches: Patch[],
	inversePatches: Patch[]
) {
	const id = uuid();
	game.history.push({
		id,
		choice,
		patches,
		inversePatches,
	});
}
