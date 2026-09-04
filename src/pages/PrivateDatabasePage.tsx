import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router";

import {
	CheckCircle,
	Lock,
	Plus,
	RefreshCw,
	Trash2,
	XCircle,
} from "lucide-react";

import { useAuthContext } from "@/contexts/AuthContext";
import type { NotesGateway, UserNote } from "@/lib/notes/gateway";
import { supabaseNotesGateway } from "@/lib/notes/supabaseNotesGateway";

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
				<p>{new Date(note.createdAt).toLocaleString()}</p>
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

/** The default notes backend — a real Supabase adapter, created once so the page's callbacks stay stable. */
const defaultNotesGateway = supabaseNotesGateway();

export interface PrivateDatabasePageProps {
	/**
	 * The notes backend to read and write through. Defaults to the real Supabase
	 * adapter; a test injects a fake to drive the empty, populated, and error
	 * paths without a network.
	 */
	notesGateway?: NotesGateway;
}

/** Displays and manages the signed-in user's private notes, gated behind authentication. */
function PrivateDatabasePage({
	notesGateway = defaultNotesGateway,
}: PrivateDatabasePageProps = {}) {
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
			setNotes(await notesGateway.listNotes());
		} catch {
			setError("We couldn't load your notes. Please try again.");
		} finally {
			setLoading(false);
		}
	}, [notesGateway]);

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
			await notesGateway.addNote({
				title: newTitle.trim(),
				content: newContent.trim(),
				userId: user.id,
			});

			setNewTitle("");
			setNewContent("");
			await fetchNotes();
		} catch {
			setError("We couldn't save your note. Please try again.");
		} finally {
			setSaving(false);
		}
	}

	async function deleteNote(id: string) {
		try {
			await notesGateway.deleteNote(id);
			await fetchNotes();
		} catch {
			setError("We couldn't delete your note. Please try again.");
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
