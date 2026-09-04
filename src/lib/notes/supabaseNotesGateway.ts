import { supabase } from "../supabase";
import { FailedNotesRequest } from "./errors";
import type { NewNote, NotesGateway, UserNote } from "./gateway";

/** The `user_notes` row as Supabase stores it, before the adapter maps it onto {@link UserNote}. */
interface NoteRow {
	id: string;
	title: string;
	content: string;
	created_at: string;
	user_id: string;
}

/** Maps a stored row onto the app's camelCase {@link UserNote}. */
function toUserNote({ created_at, user_id, ...rest }: NoteRow): UserNote {
	return { ...rest, createdAt: created_at, userId: user_id };
}

/**
 * The real {@link NotesGateway} adapter — the only place the Supabase client is
 * named for notes. Each port method delegates to `supabase.from("user_notes")`,
 * maps the stored row onto the app's own types, and wraps any vendor error in a
 * {@link FailedNotesRequest} so neither Supabase nor its error shape leaks to the
 * page. Row Level Security scopes every query to the signed-in user, so no method
 * filters by user id itself.
 */
export function supabaseNotesGateway(): NotesGateway {
	return {
		listNotes: async () => {
			const { data, error } = await supabase
				.from("user_notes")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw new FailedNotesRequest(error.message);
			return ((data as NoteRow[] | null) ?? []).map(toUserNote);
		},
		addNote: async ({ title, content, userId }: NewNote) => {
			const { error } = await supabase
				.from("user_notes")
				.insert({ title, content, user_id: userId });

			if (error) throw new FailedNotesRequest(error.message);
		},
		deleteNote: async (id: string) => {
			const { error } = await supabase.from("user_notes").delete().eq("id", id);

			if (error) throw new FailedNotesRequest(error.message);
		},
	};
}
