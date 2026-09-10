import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Heading } from ".";

describe("Heading", () => {
	it("should render as a level-two heading when no render element is given", () => {
		render(<Heading>Timeless Principles</Heading>);

		const expectedResult = "Timeless Principles";

		const result = screen.getByRole("heading", { level: 2 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render at the requested level when the level prop sets it", () => {
		render(<Heading level={1}>Privacy Policy</Heading>);

		const expectedResult = "Privacy Policy";

		const result = screen.getByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});
});
