import {
	applyPatches,
	castDraft,
	enablePatches,
	produceWithPatches,
	type Draft,
	type Immutable,
} from "immer";
import { addHistoryObject } from "./gameLogic/addHistoryObject";
import { createInitialGameState } from "./gameLogic/createInitialGameState";
import { reduceDecision } from "./gameLogic/reduceDecision";
import { reduceNext } from "./gameLogic/reduceNext";
import { uuid } from "./gameLogic/uuid";
import { validateChoiceFromModel } from "./gameLogic/validateChoiceFromModel";
import type { GameType } from "./gameType/GameType";
import type { Next } from "./gameType/Next";
import type { ChoiceValidators } from "./helperTypes/ChoiceValidators";
import type {
	ChoiceOf,
	DecisionOf,
	InterruptOf,
	ModelOf,
} from "./helperTypes/GameDerivers";
import type {
	DecisionReducers,
	InterruptReducers,
	Logger,
} from "./helperTypes/Reducers";
import type { HistoryObjectID } from "./gameType/HistoryObject";

/**
 * creates a game given the rules that dictate the transitions between that game's valid states
 * @param createInitialModel a function which produces the initial state of the game
 * @param choiceValidators a map of decision types to the validator functions for their choices
 * @param decisionReducers a map of decision types to their reducer functions
 * @param interruptReducers a map of interrupt types to their reducer functions
 * @param createFallbackDecision an (optional) function which produces a decision to be used when no other is available. when this is omitted, there is no assurance that every decision and choice will result in another valid state, which can lead to errors during execution if reducers do not consistently produce sufficient decisions
 * @returns functions that compose the parameter functions into a unified state machine
 */
export function createGame<Game extends GameType, Options>(parameters: {
	createInitialModel: (options: Options) => {
		model: ModelOf<Game>;
		decision: DecisionOf<Game>;
		next: Next<DecisionOf<Game>, InterruptOf<Game>>[];
	};
	choiceValidators: ChoiceValidators<Game>;
	decisionReducers: DecisionReducers<Game>;
	interruptReducers: InterruptReducers<Game>;
	createFallbackDecision?: (
		model: Immutable<ModelOf<Game>>
	) => DecisionOf<Game>;
}) {
	type Model = ModelOf<Game>;
	type Decision = DecisionOf<Game>;
	type Interrupt = InterruptOf<Game>;
	type Choice = ChoiceOf<Game>;

	/**
	 * produces the game state as it existed at the start of a choice as referenced by that choice's referent history object id. used primarily for logging context.
	 * @param game the current game object. this will not be modified.
	 * @param historyObjectID the id of the history object to roll back the state to.
	 * @returns a game state as it was before the choice was made
	 */
	function getStateByID(game: Game, historyObjectID: HistoryObjectID) {
		const index = game.history.findIndex(
			({ id }) => id === historyObjectID
		);
		if (index === -1) return null;
		const patchSequence =
			index === 0 ? game.history : game.history.slice(index);

		let state = game.state;
		for (const historyObject of patchSequence.toReversed())
			state = applyPatches(state, historyObject.inversePatches);

		return state;
	}

	/**
	 * validates a choice from the current game object. if this succeeds, that choice can be passed to `reduceChoice`
	 * @param game the current game object. this will not be modified.
	 * @param choice the current choice to evaluate for validity.
	 * @returns a zod SafeParseReturnType of the expected choice
	 */
	function validateChoice<T extends Choice["type"]>(
		game: Game,
		choice: Choice & { type: T }
	) {
		return validateChoiceFromModel(
			parameters.choiceValidators,
			game.state.model as Immutable<Model>,
			game.state.decision as Immutable<Decision>,
			choice
		);
	}

	/**
	 * consumes a choice to produce the next valid game state
	 * @param game the current game object. payload will be replaced with a new one, and history will be appended to.
	 * @param choice the choice to resolve for the current game state. will error if not valid
	 */
	function reduceChoice<T extends Choice["type"]>(
		game: Game,
		choice: Choice & { type: T }
	) {
		// we validate the input choice here so we don't starting mutating the payload unless we are allowed to
		const {
			success,
			error,
			data: validatedChoice,
		} = validateChoiceFromModel(
			parameters.choiceValidators,
			game.state.model as Immutable<Model>,
			game.state.decision as Immutable<Decision>,
			choice
		);

		// we don't do any fancy error handling because we expect choices to have already been validated
		if (!success) throw error;

		const id = uuid();

		const [nextState, patches, inversePatches] = produceWithPatches(
			game.state,
			(draft) => {
				const logger: Logger<Game> = (stringParts, ...context) =>
					draft.log.push(
						castDraft({
							historyObjectID: id,
							stringParts,
							context,
						})
					);

				// first, attempt regular resolution for the current decision
				let [decision, ...next] = reduceDecision(
					parameters.decisionReducers,
					draft.model as Draft<Model>,
					draft.decision as Immutable<Decision>,
					validatedChoice,
					logger
				);

				// if any next entries were produced, append those
				if (next) draft.next.unshift(...castDraft(next));

				// as long as we don't yet have a valid deicision and do have next entries to pull from, resolve those one at a time
				while (!decision && draft.next.length > 0) {
					let first = draft.next.shift()!;

					[decision, ...next] = reduceNext(
						parameters.interruptReducers,
						draft.model as Draft<Model>,
						first as Immutable<Next<Decision, Interrupt>>,
						logger
					);

					if (next) draft.next.unshift(...castDraft(next));
				}

				// if we exhaust those, ensure we have a valid state by producing the fallback decision
				if (!decision) {
					if (parameters.createFallbackDecision) {
						decision = parameters.createFallbackDecision(
							draft.model as Immutable<Model>
						);
					} else {
						throw "each next entry was resolved and no decisions were produced; no function was provided for createFallbackDecision";
					}
				}

				// conclude by setting the draft decision to the produced decision
				draft.decision = castDraft(decision);
			}
		);

		// conclude by updating the state and appending a new history object marking the change
		game.state = nextState;
		addHistoryObject(
			game,
			validatedChoice as Choice,
			patches,
			inversePatches,
			id
		);
	}

	enablePatches();

	// prettier-ignore
	// (it hates instantiation expressions)
	const boundCreateInitialGameState = (createInitialGameState<
		Game,
		Options
	>).bind(undefined, parameters.createInitialModel);

	return {
		getStateByID,
		createInitialGameState: boundCreateInitialGameState,
		validateChoice,
		reduceChoice,
	};
}
