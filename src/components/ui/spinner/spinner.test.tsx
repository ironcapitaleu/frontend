import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Spinner } from ".";

describe("Spinner", () => {
	it("should expose a status role for assistive technology when mounted", () => {
		render(<Spinner />);

		const expectedResult = "Loading";

		const result = screen.getByRole("status").getAttribute("aria-label");

		expect(result).toBe(expectedResult);
	});

	it("should announce a custom label when one is provided", () => {
		render(<Spinner label="Fetching companies" />);

		const expectedResult = "Fetching companies";

		const result = screen.getByRole("status").getAttribute("aria-label");

		expect(result).toBe(expectedResult);
	});

	it("should apply the requested size class when a size is given", () => {
		render(<Spinner size="xl" />);

		const expectedResult = true;

		const result = screen.getByRole("status").classList.contains("size-12");

		expect(result).toBe(expectedResult);
	});
});
