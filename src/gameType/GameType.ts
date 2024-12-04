import type { TypedObject } from "../helperTypes/TypedObject";
import type { HistoryObject } from "./HistoryObject";
import type { Payload } from "./Payload";

export interface GameType<
	Model = unknown,
	Decision extends TypedObject = TypedObject,
	Choice extends TypedObject<Decision["type"]> = TypedObject<
		Decision["type"]
	>,
	Interrupt extends TypedObject = TypedObject,
	LogObjectContext = unknown
> {
	state: Payload<Model, Decision, Interrupt, LogObjectContext>;
	future: HistoryObject<Choice>[];
	history: HistoryObject<Choice>[];
}
