import {
	castDraft,
	enablePatches,
	produceWithPatches,
	type Draft,
	type Immutable,
} from "immer";
import type { SafeParseReturnType } from "zod";
import type { ChoiceValidators } from "./ChoiceValidators";
import { addHistoryObject, type Game as GameType } from "./Game";
import type { Next } from "./Next";
import type {
	DecisionReducers,
	InterruptReducers,
	ReducerReturnType,
} from "./Reducers";

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
	 * evaluates an arbitrary choice for validity, given the current state
	 * @param model the current model from the payload
	 * @param decision the current decision from the payload
	 * @param choice the current choice being evaluated for validity
	 * @returns the results of the zod type being evaluated for validity
	 */
	function validateChoiceFromModel<T extends Choice["type"] = Choice["type"]>(
		model: Immutable<Model>,
		decision: Immutable<Decision & { type: T }>,
		choice: unknown
	) {
		const validator = parameters.choiceValidators[decision.type as T];
		if (validator === undefined) throw "unexpected choice type";

		// validators do not include choice typing, for convenience's sake, so we add that here
		const zodType = validator(model, decision);

		// asserting the type of the return value here as something both immutable and neater than the inferred one
		return zodType.safeParse(choice) as Immutable<
			SafeParseReturnType<unknown, Choice & { type: T }>
		>;
	}

	/**
	 * reduces a decision and its choice and applies them to the model
	 * @param model the current draft of the model, provided by immer and passed by `reduceChoice`
	 * @param decision the current decision, taken from the payload
	 * @param choice the current choice (after passing validation)
	 * @returns the decision and next entries to append to the state
	 */
	function reduceDecision<T extends Decision["type"] = Decision["type"]>(
		model: Draft<Model>,
		decision: Immutable<Decision & { type: T }>,
		choice: Immutable<Choice & { type: T }>
	): ReducerReturnType<Decision, Interrupt> {
		const reducer = parameters.decisionReducers[decision.type as T];
		if (reducer === undefined) throw "unexpected decision type";
		return reducer(model, decision, choice);
	}

	/**
	 * reduces an entry from next and applies it to the model
	 * @param model the current draft of the model, provided by immer and passed by `reduceChoice`
	 * @param interrupt the interrupt to reduce to a valid state
	 * @returns the decision and next entries to append to the state
	 */
	function reduceInterrupt<T extends Interrupt["type"] = Interrupt["type"]>(
		model: Draft<Model>,
		interrupt: Immutable<Interrupt & { type: T }>
	): ReducerReturnType<Decision, Interrupt> {
		const reducer = parameters.interruptReducers[interrupt.type as T];
		if (reducer === undefined) throw "unexpected interrupt type";
		return reducer(model, interrupt);
	}

	/**
	 * reduces an entry from next and applies it to the model
	 * @param model the current draft of the model, provided by immer and passed by `reduceChoice`
	 * @param next the next entry to reduce to a valid state
	 * @returns the decision and next entires to append to the state
	 */
	function reduceNext(
		model: Draft<Model>,
		next: Immutable<Next<Decision, Interrupt>>
	): ReducerReturnType<Decision, Interrupt> {
		if (next.kind === "decision") return [next.value as Decision];
		if (next.kind === "interrupt")
			return reduceInterrupt(model, next.value);
		throw "unexpected next kind";
	}

	/**
	 * creates the initial state of the game. a helpful wrapper around `createInitialModel`
	 * @param options options passed into `createInitialModel`
	 * @returns a valid game object that can be used with `reduceChoice`
	 */
	function createInitialGameState(options: Options): Game {
		const { model, decision } = parameters.createInitialModel(options);
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
			game.state.model as Immutable<Model>,
			game.state.decision as Immutable<Decision>,
			choice
		);

		// we don't do any fancy error handling because we expect choices to have already been validated
		if (!success) throw error;

		const [nextState, patches, inversePatches] = produceWithPatches(
			game.state,
			(draft) => {
				// first, attempt regular resolution for the current decision
				let [decision, ...next] = reduceDecision(
					draft.model as Draft<Model>,
					draft.decision as Immutable<Decision>,
					validatedChoice
				);

				// if any next entries were produced, append those
				if (next) draft.next.push(...castDraft(next));

				// as long as we don't yet have a valid deicision and do have next entries to pull from, resolve those one at a time
				while (!decision && draft.next.length > 0) {
					let first = draft.next.shift()!;

					[decision, ...next] = reduceNext(
						draft.model as Draft<Model>,
						first as Immutable<Next<Decision, Interrupt>>
					);

					if (next) draft.next.push(...castDraft(next));
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
			inversePatches
		);
	}

	enablePatches();

	return {
		createInitialGameState,
		validateChoice,
		reduceChoice,
	};
}
