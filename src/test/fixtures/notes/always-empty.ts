import type { NotesGateway } from "../../../lib/notes/gateway";

/**
 * A {@link NotesGateway} fake where the signed-in user has no notes and every
 * mutation succeeds. Use it to arrange the empty world.
 */
export function alwaysEmptyNotes(): NotesGateway {
	return {
		listNotes: async () => [],
		addNote: async () => {},
		deleteNote: async () => {},
	};
}
