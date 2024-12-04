import type { GameType } from "../gameType/GameType";
import type { Next } from "../gameType/Next";
import type {
	DecisionOf,
	InterruptOf,
	ModelOf,
} from "../helperTypes/GameDerivers";

/**
 * creates the initial state of the game. a helpful wrapper around `createInitialModel`
 * @param options options passed into `createInitialModel`
 * @returns a valid game object that can be used with `reduceChoice`
 */
export function createInitialGameState<Game extends GameType, Options>(
	createInitialModel: (options: Options) => {
		model: ModelOf<Game>;
		decision: DecisionOf<Game>;
		next: Next<DecisionOf<Game>, InterruptOf<Game>>[];
	},
	options: Options
): Game {
	const { model, decision } = createInitialModel(options);
	return {
		state: {
			model,
			decision,
			next: [],
		},
		history: [],
		future: [],
		// don't love this
	} as unknown as Game;
}
