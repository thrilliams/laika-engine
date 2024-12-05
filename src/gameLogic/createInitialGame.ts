import type { GameType } from "../gameType/GameType";
import type { Payload } from "../gameType/Payload";
import type {
	DecisionOf,
	InterruptOf,
	LogObjectContextOf,
	ModelOf,
} from "../helperTypes/GameDerivers";
import type { MaybeDraft } from "./createHelperWrappers";

export type CreateInitialPayload<Game extends GameType, Options> = (
	options: Options
) => MaybeDraft<
	Payload<
		ModelOf<Game>,
		DecisionOf<Game>,
		InterruptOf<Game>,
		LogObjectContextOf<Game>
	>
>;

/**
 * creates the initial state of the game. a helpful wrapper around `createInitialModel`
 * @param options options passed into `createInitialModel`
 * @returns a valid game object that can be used with `reduceChoice`
 */
export function createInitialGame<Game extends GameType, Options>(
	createInitialPayload: CreateInitialPayload<Game, Options>,
	options: Options
) {
	const state = createInitialPayload(options);
	return {
		state,
		history: [],
		future: [],
	} as unknown as Game;
}
