import { supabase } from "../supabase";
import type { NewNote, NotesGateway, UserNote } from "./gateway";

/**
 * The real {@link NotesGateway} adapter — the only place the Supabase client is
 * named for notes. Each port method delegates to `supabase.from("user_notes")`
 * and throws the vendor error so the page can surface its message. Row Level
 * Security scopes every query to the signed-in user, so no method filters by
 * user id itself.
 */
export function supabaseNotesGateway(): NotesGateway {
	return {
		listNotes: async () => {
			const { data, error } = await supabase
				.from("user_notes")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data as UserNote[] | null) ?? [];
		},
		addNote: async ({ title, content, userId }: NewNote) => {
			const { error } = await supabase
				.from("user_notes")
				.insert({ title, content, user_id: userId });

			if (error) throw error;
		},
		deleteNote: async (id: string) => {
			const { error } = await supabase.from("user_notes").delete().eq("id", id);

			if (error) throw error;
		},
	};
}
