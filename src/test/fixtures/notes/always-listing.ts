import type { NotesGateway } from "../../../lib/notes/gateway";
import { sampleNotes } from "./notes";

/**
 * A {@link NotesGateway} fake that always returns {@link sampleNotes} and lets
 * every mutation succeed. Use it to arrange the populated world.
 */
export function alwaysListingNotes(): NotesGateway {
	return {
		listNotes: async () => sampleNotes,
		addNote: async () => {},
		deleteNote: async () => {},
	};
}
