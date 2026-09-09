import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from ".";

describe("Skeleton", () => {
	it("should render a skeleton placeholder when mounted", () => {
		render(<Skeleton data-testid="skeleton" />);

		const expectedResult = "skeleton";

		const result = screen.getByTestId("skeleton").dataset.slot;

		expect(result).toBe(expectedResult);
	});

	it("should pulse to signal loading when rendered", () => {
		render(<Skeleton data-testid="skeleton" />);

		const expectedResult = true;

		const result = screen
			.getByTestId("skeleton")
			.className.includes("animate-pulse");

		expect(result).toBe(expectedResult);
	});

	it("should merge a custom class when className is provided", () => {
		render(
			<Skeleton data-testid="skeleton" className="size-12 rounded-full" />,
		);

		const expectedResult = true;

		const result = screen
			.getByTestId("skeleton")
			.className.includes("rounded-full");

		expect(result).toBe(expectedResult);
	});
});
