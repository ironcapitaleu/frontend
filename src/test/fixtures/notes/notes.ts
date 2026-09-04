import type { UserNote } from "../../../lib/notes/gateway";
import { fakeUser } from "../auth/user";

/** A fixed set of notes for tests that need a populated notes list. */
export const sampleNotes: UserNote[] = [
	{
		id: "11111111-1111-1111-1111-111111111111",
		title: "Quarterly thesis",
		content: "Revisit the semiconductor allocation before earnings.",
		created_at: "2026-03-18T09:00:00.000Z",
		user_id: fakeUser.id,
	},
	{
		id: "22222222-2222-2222-2222-222222222222",
		title: "Watchlist",
		content: "Track the new listing once the lock-up expires.",
		created_at: "2026-03-17T09:00:00.000Z",
		user_id: fakeUser.id,
	},
];
