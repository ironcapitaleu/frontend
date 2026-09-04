/**
 * App-owned notes failure, independent of the notes vendor. The real adapter
 * ({@link supabaseNotesGateway}) maps a vendor error onto this; the page renders
 * its message. Formats in the bracketed display format — `[FailedNotesRequest]
 * <description>` with an optional `, Reason: '<detail>'` tail.
 */
export class FailedNotesRequest extends Error {
	constructor(reason?: string) {
		super(
			reason
				? `[FailedNotesRequest] The notes request could not be completed, Reason: '${reason}'`
				: "[FailedNotesRequest] The notes request could not be completed",
		);
		this.name = "FailedNotesRequest";
	}
}
