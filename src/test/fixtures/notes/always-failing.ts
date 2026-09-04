import type { NotesGateway } from "../../../lib/notes/gateway";

/**
 * A {@link NotesGateway} fake where loading the notes fails, as if the notes
 * backend were unreachable. Use it to arrange the load-error path.
 */
export function alwaysFailingNotes(): NotesGateway {
	return {
		listNotes: async () => {
			throw new Error("Failed to reach the notes service.");
		},
		addNote: async () => {},
		deleteNote: async () => {},
	};
}
