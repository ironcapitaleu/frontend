import type { NotesGateway } from "../../../lib/notes/gateway";

/**
 * A {@link NotesGateway} fake where the notes load fine but adding one fails.
 * Use it to arrange the add-error path.
 */
export function failingOnAddNotes(): NotesGateway {
	return {
		listNotes: async () => [],
		addNote: async () => {
			throw new Error("Failed to save the note.");
		},
		deleteNote: async () => {},
	};
}
