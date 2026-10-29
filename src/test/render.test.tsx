import userEvent from "@testing-library/user-event";
import { useLocation, useNavigate } from "react-router";
import { describe, expect, it } from "vitest";

import { render, screen } from "./render";

function LocationProbe() {
	const location = useLocation();
	const navigate = useNavigate();

	return (
		<button type="button" onClick={() => navigate("/next")}>
			{location.pathname}
		</button>
	);
}

describe("render", () => {
	it("should keep the router location when the ui is rerendered", async () => {
		const user = userEvent.setup();
		const { rerender } = render(<LocationProbe />);
		await user.click(screen.getByRole("button"));

		const expectedResult = "/next";

		rerender(<LocationProbe />);
		const result = screen.getByRole("button").textContent;

		expect(result).toBe(expectedResult);
	});
});
