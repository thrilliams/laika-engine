import type { Patch } from "immer";

// uuid
export type HistoryObjectID = string;

export interface HistoryObject<Choice> {
	id: HistoryObjectID;

	choice: Choice;
	patches: Patch[];
	inversePatches: Patch[];
}
