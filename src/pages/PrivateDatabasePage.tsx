import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

interface UserNote {
	id: string;
	title: string;
	content: string;
	created_at: string;
	user_id: string;
}

export default function PrivateDatabasePage() {
	const [notes, setNotes] = useState<UserNote[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [newTitle, setNewTitle] = useState("");
	const [newContent, setNewContent] = useState("");
	const [saving, setSaving] = useState(false);
	const { user } = useAuthContext();

	const fetchNotes = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const { data, error } = await supabase
				.from("user_notes")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			setNotes(data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to fetch notes");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (user) {
			fetchNotes();
		} else {
			setLoading(false);
		}
	}, [user, fetchNotes]);

	async function addNote() {
		if (!newTitle.trim() || !user) return;

		try {
			setSaving(true);
			const { error } = await supabase.from("user_notes").insert({
				title: newTitle.trim(),
				content: newContent.trim(),
				user_id: user.id,
			});

			if (error) throw error;

			setNewTitle("");
			setNewContent("");
			fetchNotes();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add note");
		} finally {
			setSaving(false);
		}
	}

	async function deleteNote(id: string) {
		try {
			const { error } = await supabase.from("user_notes").delete().eq("id", id);

			if (error) throw error;
			fetchNotes();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete note");
		}
	}

	// Not logged in state
	if (!user) {
		return (
			<div className="container py-16">
				<div className="max-w-2xl mx-auto text-center">
					<div className="glass p-12">
						<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
							<span className="text-red-400 text-4xl">🔒</span>
						</div>
						<h1 className="h2 mb-4">Authentication Required</h1>
						<p className="text-secondary mb-8">
							This page contains private data that requires authentication.
							Please sign in to view your personal notes.
						</p>
						<Link to="/login" className="btn btn-primary">
							Sign In to Continue
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-16">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="h1 mb-2">Private Database Test</h1>
					<p className="text-secondary body-large">
						This page demonstrates Row Level Security (RLS). You can only see
						your own notes.
					</p>
				</div>

				{/* Auth Status Card */}
				<div className="glass p-6 mb-8">
					<h2 className="h3 mb-4">Authentication Status</h2>
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
							<span className="text-green-400 text-xl">✓</span>
						</div>
						<div>
							<p className="font-semibold text-green-400">Authenticated</p>
							<p className="text-secondary">{user.email}</p>
						</div>
					</div>
				</div>

				{/* Add Note Form */}
				<div className="glass p-6 mb-8">
					<h2 className="h3 mb-4">Add New Note</h2>
					<div className="space-y-4">
						<div>
							<label htmlFor="title" className="block text-sm font-medium mb-2">
								Title
							</label>
							<input
								id="title"
								type="text"
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								placeholder="Enter note title..."
								className="w-full px-4 py-3 rounded-lg bg-glass-bg border border-glass-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
							/>
						</div>
						<div>
							<label
								htmlFor="content"
								className="block text-sm font-medium mb-2"
							>
								Content
							</label>
							<textarea
								id="content"
								value={newContent}
								onChange={(e) => setNewContent(e.target.value)}
								placeholder="Enter note content..."
								rows={3}
								className="w-full px-4 py-3 rounded-lg bg-glass-bg border border-glass-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
							/>
						</div>
						<button
							type="button"
							onClick={addNote}
							disabled={saving || !newTitle.trim()}
							className="btn btn-primary"
						>
							{saving ? "Saving..." : "Add Note"}
						</button>
					</div>
				</div>

				{/* Error Display */}
				{error && (
					<div className="glass p-4 mb-8 bg-red-500/20 border border-red-500/50">
						<p className="text-red-200 font-semibold">Error</p>
						<p className="text-red-300 text-sm mt-1">{error}</p>
					</div>
				)}

				{/* Notes List */}
				<div className="glass overflow-hidden">
					<div className="p-6 border-b border-glass-border">
						<h2 className="h3">Your Private Notes</h2>
						<p className="text-secondary text-sm mt-1">
							Only you can see these notes (protected by RLS)
						</p>
					</div>

					{loading ? (
						<div className="p-12 text-center">
							<div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
							<p className="text-secondary mt-4">Loading your notes...</p>
						</div>
					) : notes.length === 0 ? (
						<div className="p-12 text-center">
							<p className="text-secondary mb-2">No notes yet</p>
							<p className="text-tertiary text-sm">
								Add your first note above!
							</p>
						</div>
					) : (
						<div className="divide-y divide-glass-border">
							{notes.map((note) => (
								<div
									key={note.id}
									className="p-6 hover:bg-glass-bg transition-colors"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<h3 className="font-semibold text-lg">{note.title}</h3>
											{note.content && (
												<p className="text-secondary mt-2">{note.content}</p>
											)}
											<p className="text-tertiary text-sm mt-3">
												{new Date(note.created_at).toLocaleString()}
											</p>
										</div>
										<button
											type="button"
											onClick={() => deleteNote(note.id)}
											className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
										>
											Delete
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Refresh Button */}
				<div className="mt-8 text-center">
					<button
						type="button"
						onClick={fetchNotes}
						disabled={loading}
						className="btn btn-glass"
					>
						{loading ? "Refreshing..." : "Refresh Notes"}
					</button>
				</div>
			</div>
		</div>
	);
}
