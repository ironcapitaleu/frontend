import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
	CheckCircle,
	Lock,
	Plus,
	RefreshCw,
	Trash2,
	XCircle,
} from "lucide-react";

import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface UserNote {
	id: string;
	title: string;
	content: string;
	created_at: string;
	user_id: string;
}

function AuthRequiredState() {
	return (
		<main>
			<Card>
				<CardContent>
					<Lock />
					<h1>Authentication Required</h1>
					<p>
						This page contains private data that requires authentication. Please
						sign in to view your personal notes.
					</p>
					<Button render={<Link to="/login" />}>Sign In to Continue</Button>
				</CardContent>
			</Card>
		</main>
	);
}

interface AuthStatusProps {
	email: string;
}

function AuthStatus({ email }: AuthStatusProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Authentication Status</CardTitle>
			</CardHeader>
			<CardContent>
				<div>
					<CheckCircle />
					<div>
						<p>Authenticated</p>
						<p>{email}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface AddNoteFormProps {
	title: string;
	content: string;
	saving: boolean;
	onTitleChange: (value: string) => void;
	onContentChange: (value: string) => void;
	onSubmit: () => void;
}

function AddNoteForm({
	title,
	content,
	saving,
	onTitleChange,
	onContentChange,
	onSubmit,
}: AddNoteFormProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<Plus />
					Add New Note
				</CardTitle>
				<CardDescription>
					Create a new private note that only you can see
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div>
					<Label htmlFor="title">Title</Label>
					<Input
						id="title"
						type="text"
						value={title}
						onChange={(e) => onTitleChange(e.target.value)}
						placeholder="Enter note title..."
					/>
				</div>
				<div>
					<Label htmlFor="content">Content</Label>
					<Textarea
						id="content"
						value={content}
						onChange={(e) => onContentChange(e.target.value)}
						placeholder="Enter note content..."
						rows={3}
					/>
				</div>
				<Button onClick={onSubmit} disabled={saving || !title.trim()}>
					{saving ? "Saving..." : "Add Note"}
				</Button>
			</CardContent>
		</Card>
	);
}

interface NoteItemProps {
	note: UserNote;
	onDelete: (id: string) => void;
}

function NoteItem({ note, onDelete }: NoteItemProps) {
	return (
		<div>
			<div>
				<h3>{note.title}</h3>
				{note.content && <p>{note.content}</p>}
				<p>{new Date(note.created_at).toLocaleString()}</p>
			</div>
			<Button variant="destructive" size="sm" onClick={() => onDelete(note.id)}>
				<Trash2 />
				Delete
			</Button>
		</div>
	);
}

interface NotesListProps {
	notes: UserNote[];
	loading: boolean;
	onDelete: (id: string) => void;
}

function NotesList({ notes, loading, onDelete }: NotesListProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Your Private Notes</CardTitle>
				<CardDescription>
					Only you can see these notes (protected by RLS)
				</CardDescription>
			</CardHeader>
			<CardContent>
				{loading && (
					<div>
						<RefreshCw />
						<p>Loading your notes...</p>
					</div>
				)}

				{!loading && notes.length === 0 && (
					<div>
						<p>No notes yet</p>
						<p>Add your first note above!</p>
					</div>
				)}

				{!loading && notes.length > 0 && (
					<div>
						{notes.map((note) => (
							<div key={note.id}>
								<NoteItem note={note} onDelete={onDelete} />
								<Separator />
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function PrivateDatabasePage() {
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

	if (!user) {
		return <AuthRequiredState />;
	}

	return (
		<main>
			<section>
				<h1>Private Database Test</h1>
				<p>
					This page demonstrates Row Level Security (RLS). You can only see your
					own notes.
				</p>
			</section>

			<Separator />

			<section>
				<AuthStatus email={user.email || ""} />
			</section>

			<section>
				<AddNoteForm
					title={newTitle}
					content={newContent}
					saving={saving}
					onTitleChange={setNewTitle}
					onContentChange={setNewContent}
					onSubmit={addNote}
				/>
			</section>

			{error && (
				<section>
					<Alert variant="destructive">
						<XCircle />
						<AlertTitle>Error</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</section>
			)}

			<section>
				<NotesList notes={notes} loading={loading} onDelete={deleteNote} />
			</section>

			<section>
				<Button variant="outline" onClick={fetchNotes} disabled={loading}>
					<RefreshCw />
					{loading ? "Refreshing..." : "Refresh Notes"}
				</Button>
			</section>
		</main>
	);
}

export default PrivateDatabasePage;
