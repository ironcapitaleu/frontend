import { describe, expect, it } from "vitest";

import { alwaysAuthenticatedAuth } from "../test/fixtures/auth/always-authenticated";
import { render, renderHook, screen } from "../test/render";
import { useAuthContext } from "./AuthContext";

function EmailProbe() {
	const { user } = useAuthContext();
	return <p>{user?.email ?? "no user"}</p>;
}

describe("useAuthContext", () => {
	it("should throw a guidance error when used outside an AuthProvider", () => {
		const expectedResult = "useAuthContext must be used within an AuthProvider";

		const result = () => renderHook(() => useAuthContext());

		expect(result).toThrow(expectedResult);
	});

	it("should expose the signed-in user's email to a consumer when the gateway is authenticated", async () => {
		render(<EmailProbe />, { gateway: alwaysAuthenticatedAuth() });

		const expectedResult = "investor@ironcapital.test";

		const result = await screen.findByText(expectedResult);

		expect(result).toHaveTextContent(expectedResult);
	});
});
