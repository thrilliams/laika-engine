import type { Draft, Immutable } from "immer";
import type { GameType } from "../gameType/GameType";
import type {
	ChoiceOf,
	DecisionOf,
	InterruptOf,
	ModelOf,
} from "../helperTypes/GameDerivers";
import type {
	DecisionReducers,
	ReducerReturnType,
} from "../helperTypes/Reducers";

/**
 * reduces a decision and its choice and applies them to the model
 * @param model the current draft of the model, provided by immer and passed by `reduceChoice`
 * @param decision the current decision, taken from the payload
 * @param choice the current choice (after passing validation)
 * @returns the decision and next entries to append to the state
 */
export function reduceDecision<
	Game extends GameType,
	T extends DecisionOf<Game>["type"] = DecisionOf<Game>["type"]
>(
	decisionReducers: DecisionReducers<Game>,
	model: Draft<ModelOf<Game>>,
	decision: Immutable<DecisionOf<Game> & { type: T }>,
	choice: Immutable<ChoiceOf<Game> & { type: T }>
): ReducerReturnType<DecisionOf<Game>, InterruptOf<Game>> {
	const reducer = decisionReducers[decision.type as T];
	if (reducer === undefined) throw "unexpected decision type";
	return reducer(model, decision, choice);
}
