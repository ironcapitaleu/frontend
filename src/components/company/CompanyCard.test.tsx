import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompanyCard } from "./CompanyCard";

function renderCard() {
	render(
		<CompanyCard
			tab="shareholderReturns"
			position={3}
			title="Buybacks Net of Shares Issued to Staff"
			caption="FY2016–FY2025 · USD · 10-K"
			actions={<button type="button">Data</button>}
		>
			Chart
		</CompanyCard>,
	);
}

describe("CompanyCard", () => {
	it("should number the title with the tab's row and the card's position when it renders", () => {
		renderCard();

		const expectedResult = "4.3 Buybacks Net of Shares Issued to Staff";

		const result = screen.getByRole("heading", { level: 2 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should name the card region by its numbered title when it renders", () => {
		renderCard();

		const expectedResult = "4.3 Buybacks Net of Shares Issued to Staff";

		const result = screen.getByRole("region");

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should show the caption under the title when a caption is given", () => {
		renderCard();

		const expectedResult = "FY2016–FY2025 · USD · 10-K";

		const result = screen
			.getByRole("region")
			.querySelector('[data-slot="card-description"]');

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should put the actions in the card header when actions are given", () => {
		renderCard();

		const expectedResult = "card-action";

		const result = screen.getByRole("button", { name: "Data" }).parentElement
			?.dataset.slot;

		expect(result).toBe(expectedResult);
	});
});
