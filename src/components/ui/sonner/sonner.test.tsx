import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Toaster, toast } from ".";

describe("Toaster", () => {
	beforeEach(() => {
		document.documentElement.classList.remove("dark");
	});

	afterEach(() => {
		act(() => toast.dismiss());
	});

	it("should expose a notifications region when mounted", () => {
		render(<Toaster />);

		const expectedResult = "Notifications";

		const result = screen.getByRole("region").getAttribute("aria-label");

		expect(result).toContain(expectedResult);
	});

	it("should render the message when a toast is raised", async () => {
		render(<Toaster />);
		act(() => {
			toast.success("Company saved to your list.");
		});

		const expectedResult = "Company saved to your list.";

		const result = (await screen.findByText(expectedResult)).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should apply the dark theme when the dark class is set on the root", async () => {
		document.documentElement.classList.add("dark");
		render(<Toaster />);
		act(() => {
			toast.info("New filings arrived overnight.");
		});
		await screen.findByText("New filings arrived overnight.");

		const expectedResult = "dark";

		const result = document
			.querySelector("[data-sonner-toaster]")
			?.getAttribute("data-sonner-theme");

		expect(result).toBe(expectedResult);
	});
});
