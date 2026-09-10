import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from ".";

// Day buttons are matched by a regex on the weekday-qualified name, not an exact
// string. react-day-picker prefixes the current day's label with "Today," and
// suffixes a selected day with ", selected", so an exact match no longer finds the
// button on the dates the suite runs. The weekday form ("Thursday, …") never matches
// the trigger label, which carries no weekday.
describe("DatePicker", () => {
	it("should show the placeholder when no date is chosen", () => {
		render(<DatePicker placeholder="Pick a date" />);

		const expectedResult = "Pick a date";

		const result = screen.getByRole("button").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the chosen date on the trigger when a default is given", () => {
		render(<DatePicker defaultValue={new Date(2026, 8, 9)} />);

		const expectedResult = "September 9th, 2026";

		const result = screen.getByRole("button").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should open the calendar when the reader clicks the trigger", async () => {
		const user = userEvent.setup();
		render(<DatePicker />);

		await user.click(screen.getByRole("button"));

		const result = screen.getByRole("button", { name: "Go to the Next Month" });

		expect(result).toBeInTheDocument();
	});

	it("should report the picked date when the reader chooses a day", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<DatePicker
				defaultValue={new Date(2026, 8, 9)}
				onValueChange={onValueChange}
			/>,
		);

		const expectedResult = new Date(2026, 8, 10);

		await user.click(screen.getByRole("button"));
		await user.click(
			screen.getByRole("button", { name: /Thursday, September 10th, 2026/ }),
		);

		const result = onValueChange.mock.calls[0]?.[0];

		expect(result).toEqual(expectedResult);
	});

	it("should update the trigger label when the reader chooses a day", async () => {
		const user = userEvent.setup();
		render(<DatePicker defaultValue={new Date(2026, 8, 9)} />);

		const expectedResult = "September 10th, 2026";

		await user.click(screen.getByRole("button"));
		await user.click(
			screen.getByRole("button", { name: /Thursday, September 10th, 2026/ }),
		);

		const result = screen.getByRole("button").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should close the calendar when the reader chooses a day", async () => {
		const user = userEvent.setup();
		render(<DatePicker defaultValue={new Date(2026, 8, 9)} />);

		await user.click(screen.getByRole("button"));
		await user.click(
			screen.getByRole("button", { name: /Thursday, September 10th, 2026/ }),
		);

		const result = screen.queryByRole("button", {
			name: "Go to the Next Month",
		});

		expect(result).toBeNull();
	});

	it("should report an empty date when the reader clicks the selected day", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		render(
			<DatePicker
				defaultValue={new Date(2026, 8, 15)}
				onValueChange={onValueChange}
			/>,
		);

		const expectedResult = undefined;

		await user.click(screen.getByRole("button"));
		await user.click(
			await screen.findByRole("button", {
				name: /Tuesday, September 15th, 2026/,
			}),
		);

		const result = onValueChange.mock.calls[0]?.[0];

		expect(result).toBe(expectedResult);
	});

	it("should show the placeholder when a controlled parent clears the value after a pick", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<DatePicker value={new Date(2026, 8, 15)} placeholder="Pick a date" />,
		);

		const expectedResult = "Pick a date";

		await user.click(screen.getByRole("button"));
		await user.click(
			await screen.findByRole("button", {
				name: /Thursday, September 10th, 2026/,
			}),
		);
		rerender(<DatePicker value={undefined} placeholder="Pick a date" />);

		const result = screen.getByRole("button").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should format the trigger label with a custom date format", () => {
		render(
			<DatePicker
				defaultValue={new Date(2026, 8, 15)}
				dateFormat="yyyy-MM-dd"
			/>,
		);

		const expectedResult = "2026-09-15";

		const result = screen.getByRole("button").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should dim the trigger for the reader when disabled", () => {
		render(<DatePicker defaultValue={new Date(2026, 8, 9)} disabled />);

		const expectedResult = true;

		const result = screen.getByRole("button").hasAttribute("disabled");

		expect(result).toBe(expectedResult);
	});

	it("should keep the calendar closed when disabled and the reader clicks the trigger", async () => {
		const user = userEvent.setup();
		render(<DatePicker disabled />);

		await user.click(screen.getByRole("button"));

		const result = screen.queryByRole("button", {
			name: "Go to the Next Month",
		});

		expect(result).toBeNull();
	});
});
