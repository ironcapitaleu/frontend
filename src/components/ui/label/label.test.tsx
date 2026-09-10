import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Label } from ".";

describe("Label", () => {
	it("should render its children as text when given content", () => {
		render(<Label>Subscribe to updates</Label>);

		const expectedResult = "Subscribe to updates";

		const result = screen.getByText("Subscribe to updates").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should forward htmlFor to the underlying label when provided", () => {
		render(<Label htmlFor="email">Email</Label>);

		const expectedResult = "email";

		const result = screen.getByText("Email").getAttribute("for");

		expect(result).toBe(expectedResult);
	});

	it("should include the sibling and ancestor bare data-disabled dimming variants in its class list", () => {
		render(<Label>Email</Label>);

		const expectedResult = { sibling: true, ancestor: true };

		const classList = screen.getByText("Email").classList;
		const result = {
			sibling: classList.contains("peer-data-[disabled]:opacity-50"),
			ancestor: classList.contains("group-data-[disabled]:opacity-50"),
		};

		expect(result).toEqual(expectedResult);
	});
});
