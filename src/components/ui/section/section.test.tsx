import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Container, Section } from ".";

describe("Section", () => {
	it("should render its content when given children", () => {
		render(<Section>Band content</Section>);

		const expectedResult = "Band content";

		const result = screen.getByText("Band content");

		expect(result).toHaveTextContent(expectedResult);
	});
});

describe("Container", () => {
	it("should render its content when given children", () => {
		render(<Container>Column content</Container>);

		const expectedResult = "Column content";

		const result = screen.getByText("Column content");

		expect(result).toHaveTextContent(expectedResult);
	});
});
