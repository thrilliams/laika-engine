import type { Patch } from "immer";
import type { GameType } from "../gameType/GameType";
import type { ChoiceOf } from "../helperTypes/GameDerivers";
import { uuid } from "./uuid";

export function addHistoryObject<G extends GameType>(
	game: G,
	choice: ChoiceOf<G>,
	patches: Patch[],
	inversePatches: Patch[],
	id?: string
) {
	if (id === undefined) id = uuid();
	game.history.push({ id, choice, patches, inversePatches });
}
