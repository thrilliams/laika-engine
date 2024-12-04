import type { Immutable } from "immer";
import type { SafeParseReturnType } from "zod";
import type { GameType } from "../gameType/GameType";
import type { ChoiceValidators } from "../helperTypes/ChoiceValidators";
import type {
	ChoiceOf,
	DecisionOf,
	ModelOf,
} from "../helperTypes/GameDerivers";

/**
 * evaluates an arbitrary choice for validity, given the current state
 * @param model the current model from the payload
 * @param decision the current decision from the payload
 * @param choice the current choice being evaluated for validity
 * @returns the results of the zod type being evaluated for validity
 */
export function validateChoiceFromModel<
	Game extends GameType,
	T extends ChoiceOf<Game>["type"] = ChoiceOf<Game>["type"]
>(
	choiceValidators: ChoiceValidators<Game>,
	model: Immutable<ModelOf<Game>>,
	decision: Immutable<DecisionOf<Game> & { type: T }>,
	choice: unknown
) {
	const validator = choiceValidators[decision.type as T];
	if (validator === undefined) throw "unexpected choice type";

	// validators do not include choice typing, for convenience's sake, so we add that here
	const zodType = validator(model, decision);

	// asserting the type of the return value here as something both immutable and neater than the inferred one
	return zodType.safeParse(choice) as Immutable<
		SafeParseReturnType<unknown, ChoiceOf<Game> & { type: T }>
	>;
}
