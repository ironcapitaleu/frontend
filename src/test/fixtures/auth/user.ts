import type { AuthUser } from "../../../lib/auth/gateway";

/** A fixed signed-in user for tests that need an authenticated world. */
export const fakeUser: AuthUser = {
	id: "00000000-0000-0000-0000-000000000000",
	email: "investor@ironcapital.test",
};
