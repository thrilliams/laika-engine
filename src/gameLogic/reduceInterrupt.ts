import type { Draft, Immutable } from "immer";
import type { GameType } from "../gameType/GameType";
import type {
	DecisionOf,
	InterruptOf,
	ModelOf,
} from "../helperTypes/GameDerivers";
import type {
	InterruptReducers,
	ReducerReturnType,
} from "../helperTypes/Reducers";

/**
 * reduces an entry from next and applies it to the model
 * @param model the current draft of the model, provided by immer and passed by `reduceChoice`
 * @param interrupt the interrupt to reduce to a valid state
 * @returns the decision and next entries to append to the state
 */
export function reduceInterrupt<
	Game extends GameType,
	T extends InterruptOf<Game>["type"] = InterruptOf<Game>["type"]
>(
	interruptReducers: InterruptReducers<Game>,
	model: Draft<ModelOf<Game>>,
	interrupt: Immutable<InterruptOf<Game> & { type: T }>
): ReducerReturnType<DecisionOf<Game>, InterruptOf<Game>> {
	const reducer = interruptReducers[interrupt.type as T];
	if (reducer === undefined) throw "unexpected interrupt type";
	return reducer(model, interrupt);
}
