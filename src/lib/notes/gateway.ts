/**
 * A private note, in the app's own vocabulary. The `user_id` and `created_at`
 * fields keep the snake_case the row is stored under, so the value the adapter
 * reads back needs no remapping before the page renders it.
 */
export interface UserNote {
	id: string;
	title: string;
	content: string;
	created_at: string;
	user_id: string;
}

/** The fields the app supplies to create a note; the row's id and timestamp are assigned by the backend. */
export interface NewNote {
	title: string;
	content: string;
	userId: string;
}

/**
 * The app's port for a user's private notes: what {@link PrivateDatabasePage}
 * needs from a notes backend, in the app's own vocabulary, with the vendor
 * concealed. Neither Supabase nor any of its types appear here.
 *
 * Why a port? The real adapter ({@link supabaseNotesGateway}) wraps Supabase and
 * is the only place the vendor is named; test fakes (`always{Behaviour}Notes`)
 * implement this same interface with fixed behaviour. Both are injected through
 * the page's `notesGateway` prop, so the page never depends on the vendor
 * directly. Each method rejects with an `Error` on failure; the page surfaces
 * that message to the user.
 */
export interface NotesGateway {
	/** Resolves the signed-in user's notes, newest first. */
	listNotes(): Promise<UserNote[]>;
	/** Creates a new note for the signed-in user. */
	addNote(note: NewNote): Promise<void>;
	/** Deletes the note with the given id. */
	deleteNote(id: string): Promise<void>;
}
