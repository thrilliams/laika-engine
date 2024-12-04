import type { Draft, Immutable } from "immer";
import type { GameType } from "../gameType/GameType";
import type { Next } from "../gameType/Next";
import type {
	DecisionOf,
	InterruptOf,
	ModelOf,
} from "../helperTypes/GameDerivers";
import type {
	InterruptReducers,
	ReducerReturnType,
} from "../helperTypes/Reducers";
import { reduceInterrupt } from "./reduceInterrupt";

/**
 * reduces an entry from next and applies it to the model
 * @param model the current draft of the model, provided by immer and passed by `reduceChoice`
 * @param next the next entry to reduce to a valid state
 * @returns the decision and next entires to append to the state
 */
export function reduceNext<Game extends GameType>(
	interruptReducers: InterruptReducers<Game>,
	model: Draft<ModelOf<Game>>,
	next: Immutable<Next<DecisionOf<Game>, InterruptOf<Game>>>
): ReducerReturnType<DecisionOf<Game>, InterruptOf<Game>> {
	if (next.kind === "decision") return [next.value as DecisionOf<Game>];
	if (next.kind === "interrupt")
		return reduceInterrupt(interruptReducers, model, next.value);
	throw "unexpected next kind";
}
