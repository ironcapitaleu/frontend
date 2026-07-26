import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import { GlowNavBar } from "./GlowNavBar";

describe("GlowNavBar", () => {
	it("should render the Home navigation title", () => {
		render(<GlowNavBar />);

		const expectedResult = "Home";

		const result = screen.getByText("Home");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render one item per glow navigation entry", () => {
		render(<GlowNavBar />);

		const expectedResult = 5;

		const result = screen.getAllByRole("listitem").length;

		expect(result).toBe(expectedResult);
	});
});
