import type { Draft, Immutable } from "immer";

export type MaybeDraft<T> = Draft<T> | Immutable<T>;

export type MatchReadonly<M extends MaybeDraft<unknown>, R> = M extends Draft<M>
	? Draft<R>
	: Immutable<R>;

/**
 * curries the types for a pair of functions that ensure writability is maintained when writing helper functions (i.e. code shared between model and controller and outside of any specific validator or reducer)
 */
export function createHelperWrappers<Model>() {
	/**
	 * wraps a function that returns values from the model in type assertions such that it can be used by both model and controller code
	 * @param f function that returns values from the model
	 * @returns type-safe wrapper around the function
	 */
	const selector =
		<Args extends any[], Return>(
			f: (model: MaybeDraft<Model>, ...args: Args) => Return
		) =>
		<M extends MaybeDraft<Model>>(model: M, ...args: Args) =>
			f(model, ...args) as MatchReadonly<M, Return>;

	/**
	 * wraps a function that generates values from the model in type assertions such that it can be used by both model and controller code
	 * @param f function that generates values from the model; functions that return types from the model should be wrapped with `selector` instead
	 * @returns type-safe wrapper around the function
	 */
	const predicate =
		<Args extends any[], Return>(
			f: (model: MaybeDraft<Model>, ...args: Args) => Return
		) =>
		<M extends MaybeDraft<Model>>(model: M, ...args: Args) =>
			f(model, ...args);

	return { selector, predicate };
}
