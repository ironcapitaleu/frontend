import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from ".";

describe("Progress", () => {
	it("should report the current value to assistive technology when determinate", () => {
		render(<Progress value={40} aria-label="Upload" />);

		const expectedResult = "40";

		const result = screen
			.getByRole("progressbar")
			.getAttribute("aria-valuenow");

		expect(result).toBe(expectedResult);
	});

	it("should omit the current value when the task is indeterminate", () => {
		render(<Progress value={null} aria-label="Loading" />);

		const expectedResult = null;

		const result = screen
			.getByRole("progressbar")
			.getAttribute("aria-valuenow");

		expect(result).toBe(expectedResult);
	});

	it("should scale the reported value against a custom max when max is set", () => {
		render(<Progress value={30} max={60} aria-label="Steps" />);

		const expectedResult = "60";

		const result = screen
			.getByRole("progressbar")
			.getAttribute("aria-valuemax");

		expect(result).toBe(expectedResult);
	});
});
