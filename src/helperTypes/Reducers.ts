import type { Draft, Immutable } from "immer";
import type { GameType } from "../gameType/GameType";
import type { Next } from "../gameType/Next";
import type {
	ChoiceOf,
	DecisionOf,
	InterruptOf,
	LogObjectContextOf,
	ModelOf,
} from "./GameDerivers";

export type Logger<Game extends GameType> = (
	stringParts: TemplateStringsArray,
	...context: LogObjectContextOf<Game>[]
) => void;

export type ReducerReturnType<Decision, Interrupt> =
	| [Decision, ...Next<Decision, Interrupt>[]]
	| [];

export type DecisionReducer<
	Game extends GameType,
	T extends DecisionOf<Game>["type"]
> = (
	model: Draft<ModelOf<Game>>,
	decision: Immutable<DecisionOf<Game> & { type: T }>,
	choice: Immutable<ChoiceOf<Game> & { type: T }>,
	logger: Logger<Game>
) => ReducerReturnType<DecisionOf<Game>, InterruptOf<Game>>;

export type DecisionReducers<Game extends GameType> = {
	[K in DecisionOf<Game>["type"]]: DecisionReducer<Game, K>;
};

export type InterruptReducer<
	Game extends GameType,
	T extends InterruptOf<Game>["type"]
> = (
	model: Draft<ModelOf<Game>>,
	interrupt: Immutable<InterruptOf<Game> & { type: T }>,
	logger: Logger<Game>
) => ReducerReturnType<DecisionOf<Game>, InterruptOf<Game>>;

export type InterruptReducers<Game extends GameType> = {
	[K in InterruptOf<Game>["type"]]: InterruptReducer<Game, K>;
};
