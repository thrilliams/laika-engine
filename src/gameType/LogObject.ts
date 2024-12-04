import type { HistoryObjectID } from "./HistoryObject";

export interface LogObject<LogObjectContext> {
	historyObjectID: HistoryObjectID;
	stringParts: string[];
	// TODO: making this safely typed seems really hard actually :/
	context: LogObjectContext[];
}
