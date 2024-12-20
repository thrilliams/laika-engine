import type { Immutable } from "immer";
import type { ZodType } from "zod";
import type { GameType } from "../gameType/GameType";
import type { ChoiceOf, DecisionOf, ModelOf } from "./GameDerivers";

export type ChoiceValidator<
	Game extends GameType,
	Type extends ChoiceOf<Game>["type"]
> = (
	model: Immutable<ModelOf<Game>>,
	decision: Immutable<DecisionOf<Game> & { type: Type }>
) => ZodType<ChoiceOf<Game> & { type: Type }>;

export type ChoiceValidators<Game extends GameType> = {
	[K in ChoiceOf<Game>["type"]]: ChoiceValidator<Game, K>;
};
