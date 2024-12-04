import type { GameType } from "../gameType/GameType";

export type ModelOf<G extends GameType> = G extends GameType<infer M>
	? M
	: never;
export type DecisionOf<G extends GameType> = G extends GameType<any, infer D>
	? D
	: never;
export type ChoiceOf<G extends GameType> = G extends GameType<any, any, infer C>
	? C
	: never;
export type InterruptOf<G extends GameType> = G extends GameType<
	any,
	any,
	any,
	infer I
>
	? I
	: never;
