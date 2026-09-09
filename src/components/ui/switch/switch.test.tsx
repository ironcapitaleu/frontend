import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Switch } from ".";

describe("Switch", () => {
	it("should start in the off state when no default is given", () => {
		render(<Switch aria-label="Live prices" />);

		const expectedResult = "false";

		const result = screen.getByRole("switch").getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});

	it("should start in the on state when defaultChecked is set", () => {
		render(<Switch aria-label="Live prices" defaultChecked />);

		const expectedResult = "true";

		const result = screen.getByRole("switch").getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});

	it("should turn on when the reader clicks it", async () => {
		const user = userEvent.setup();
		render(<Switch aria-label="Live prices" />);

		const expectedResult = "true";

		await user.click(screen.getByRole("switch"));

		const result = screen.getByRole("switch").getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});

	it("should report the new state when the reader clicks it", async () => {
		const user = userEvent.setup();
		const onCheckedChange = vi.fn();
		render(
			<Switch aria-label="Live prices" onCheckedChange={onCheckedChange} />,
		);

		const expectedResult = true;

		await user.click(screen.getByRole("switch"));

		const result = onCheckedChange.mock.calls[0]?.[0];

		expect(result).toBe(expectedResult);
	});

	it("should stay off when it is disabled and the reader clicks it", async () => {
		const user = userEvent.setup();
		render(<Switch aria-label="Live prices" disabled />);

		const expectedResult = "false";

		await user.click(screen.getByRole("switch"));

		const result = screen.getByRole("switch").getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});
});
