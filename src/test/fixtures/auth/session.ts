import type { Session, User } from "@supabase/supabase-js";

/** A fixed authenticated user for tests that need a signed-in world. */
export const fakeUser: User = {
	id: "00000000-0000-0000-0000-000000000000",
	aud: "authenticated",
	email: "investor@ironcapital.test",
	app_metadata: {},
	user_metadata: {},
	created_at: "2026-01-01T00:00:00.000Z",
};

/** A fixed session wrapping {@link fakeUser}. */
export const fakeSession: Session = {
	access_token: "fake-access-token",
	refresh_token: "fake-refresh-token",
	expires_in: 3600,
	token_type: "bearer",
	user: fakeUser,
};
