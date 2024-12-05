import type { HistoryObjectID } from "./HistoryObject";

export interface LogObject<LogObjectContext> {
	historyObjectID: HistoryObjectID;
	side: "before" | "after";

	stringParts: string[];
	context: LogObjectContext[];
}
