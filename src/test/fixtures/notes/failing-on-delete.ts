import type { NotesGateway } from "../../../lib/notes/gateway";
import { sampleNotes } from "./notes";

/**
 * A {@link NotesGateway} fake that lists {@link sampleNotes} but fails to delete
 * one. Use it to arrange the delete-error path.
 */
export function failingOnDeleteNotes(): NotesGateway {
	return {
		listNotes: async () => sampleNotes,
		addNote: async () => {},
		deleteNote: async () => {
			throw new Error("Failed to delete the note.");
		},
	};
}
