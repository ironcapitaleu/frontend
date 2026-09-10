import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Text, TextLink } from ".";

describe("Text", () => {
	it("should render its copy when given children", () => {
		render(<Text>A claim on a real business.</Text>);

		const expectedResult = "A claim on a real business.";

		const result = screen.getByText("A claim on a real business.");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render as the element given by render when one is provided", () => {
		render(<Text render={<span />}>404</Text>);

		const expectedResult = "404";

		const result = screen.getByText("404");

		expect(result).toHaveTextContent(expectedResult);
	});
});

describe("TextLink", () => {
	it("should expose the destination when given an href", () => {
		render(<TextLink href="mailto:contact@ironcapital.eu">Email us</TextLink>);

		const expectedResult = "mailto:contact@ironcapital.eu";

		const result = screen.getByRole("link", { name: "Email us" });

		expect(result).toHaveAttribute("href", expectedResult);
	});
});
