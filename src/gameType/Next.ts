import type { Prettify } from "../helperTypes/Prettify";

type NextKind =
	// representing a single "action" with multiple variant decision points.
	// most often used for discarding an outcome before returning to regular
	// action flow, and for deciding whether or not to continue a maneuver
	| "decision"
	// representing a series of discrete actions that may rely on previous
	// chocies. conceptually similar to a decision in terms of context to the
	// engine, but distinct in that it requires no player input to resolve
	| "interrupt";

export type Next<Decision, Interrupt, K extends NextKind = NextKind> = Prettify<
	(
		| {
				kind: "decision";
				value: Decision;
		  }
		| {
				kind: "interrupt";
				value: Interrupt;
		  }
	) & { kind: K }
>;
