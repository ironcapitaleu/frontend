import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Slider } from ".";

describe("Slider", () => {
	it("should render one thumb when the value is a single number", () => {
		render(<Slider aria-label="Weighting" defaultValue={40} />);

		const expectedResult = 1;

		const result = screen.getAllByRole("slider").length;

		expect(result).toBe(expectedResult);
	});

	it("should render one thumb per entry when the value is a range", () => {
		render(<Slider defaultValue={[25, 75]} />);

		const expectedResult = 2;

		const result = screen.getAllByRole("slider").length;

		expect(result).toBe(expectedResult);
	});

	it("should hold the given value when mounted", () => {
		render(<Slider aria-label="Weighting" defaultValue={40} />);

		const expectedResult = "40";

		const result = screen.getByRole("slider").getAttribute("aria-valuenow");

		expect(result).toBe(expectedResult);
	});

	it("should reach the max when the reader presses the End key", async () => {
		const user = userEvent.setup();
		render(<Slider aria-label="Weighting" defaultValue={40} max={80} />);

		const expectedResult = "80";

		await user.tab();
		await user.keyboard("{End}");

		const result = screen.getByRole("slider").getAttribute("aria-valuenow");

		expect(result).toBe(expectedResult);
	});

	it("should move by one step when the reader presses the right arrow key", async () => {
		const user = userEvent.setup();
		render(<Slider aria-label="Weighting" defaultValue={40} step={10} />);

		const expectedResult = "50";

		await user.tab();
		await user.keyboard("{ArrowRight}");

		const result = screen.getByRole("slider").getAttribute("aria-valuenow");

		expect(result).toBe(expectedResult);
	});

	it("should report the new value when the reader moves a thumb", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<Slider
				aria-label="Weighting"
				defaultValue={40}
				step={10}
				onValueChange={onValueChange}
			/>,
		);

		const expectedResult = 50;

		await user.tab();
		await user.keyboard("{ArrowRight}");

		const result = onValueChange.mock.calls[0]?.[0];

		expect(result).toBe(expectedResult);
	});

	it("should keep its value when it is disabled and the reader presses a key", async () => {
		const user = userEvent.setup();
		render(<Slider aria-label="Weighting" defaultValue={40} disabled />);

		const expectedResult = "40";

		await user.tab();
		await user.keyboard("{ArrowRight}");

		const result = screen.getByRole("slider").getAttribute("aria-valuenow");

		expect(result).toBe(expectedResult);
	});
});
