import type { Draft, Immutable } from "immer";
import type { Next } from "./Next";
import type { Game as GameType } from "./Game";
import type { ChoiceOf, DecisionOf, InterruptOf, ModelOf } from "./createGame";

export type ReducerReturnType<Decision, Interrupt> =
	| [Decision, ...Next<Decision, Interrupt>[]]
	| [];

export type DecisionReducer<
	Game extends GameType,
	T extends DecisionOf<Game>["type"]
> = (
	model: Draft<ModelOf<Game>>,
	decision: Immutable<DecisionOf<Game> & { type: T }>,
	choice: Immutable<ChoiceOf<Game> & { type: T }>
) => ReducerReturnType<DecisionOf<Game>, InterruptOf<Game>>;

export type DecisionReducers<Game extends GameType> = {
	[K in DecisionOf<Game>["type"]]: DecisionReducer<Game, K>;
};

export type InterruptReducer<
	Game extends GameType,
	T extends InterruptOf<Game>["type"]
> = (
	model: Draft<ModelOf<Game>>,
	interrupt: Immutable<InterruptOf<Game> & { type: T }>
) => ReducerReturnType<DecisionOf<Game>, InterruptOf<Game>>;

export type InterruptReducers<Game extends GameType> = {
	[K in InterruptOf<Game>["type"]]: InterruptReducer<Game, K>;
};
