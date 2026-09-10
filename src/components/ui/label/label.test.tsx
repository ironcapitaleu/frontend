import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Label } from ".";
import { Switch } from "../switch";

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

	it("should carry the sibling dimming variant when paired with a disabled base-ui control", () => {
		render(
			<div>
				<Switch aria-label="Live prices" className="peer" disabled />
				<Label>Live prices</Label>
			</div>,
		);

		const expectedResult = true;

		const result = screen
			.getByText("Live prices")
			.classList.contains("peer-data-[disabled]:opacity-50");

		expect(result).toBe(expectedResult);
	});

	it("should carry the ancestor dimming variant when nested in a disabled group", () => {
		render(
			<div className="group" data-disabled>
				<Label>Email</Label>
			</div>,
		);

		const expectedResult = true;

		const result = screen
			.getByText("Email")
			.classList.contains("group-data-[disabled]:opacity-50");

		expect(result).toBe(expectedResult);
	});
});
