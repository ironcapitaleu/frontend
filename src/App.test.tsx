import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { sampleCompanyGateway } from "./lib/company/sampleCompanyGateway";
import { render, screen, within } from "./test/render";
import App from "./App";

describe("App", () => {
	it("should render the brand heading when the home page loads", async () => {
		render(<App />);

		const expectedResult = "Iron Capital";

		const result = await screen.findByRole("heading", {
			name: /Iron Capital/i,
		});

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the product description when the home page loads", async () => {
		render(<App />);

		const expectedResult = "Research businesses.";

		const result = await screen.findByText(/Research businesses/i);

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the home navigation link when the home page loads", async () => {
		render(<App />);

		const expectedResult = "Iron Capital home";

		const result = await screen.findByRole("link", {
			name: /Iron Capital home/i,
		});

		expect(result).toHaveAccessibleName(expectedResult);
	});

	it("should open the MRDN company page when the reader follows the screener preview link", async () => {
		const user = userEvent.setup();
		render(<App />, {
			companyGateway: sampleCompanyGateway(),
			initialEntries: ["/screener"],
		});

		const expectedResult = "Meridian Semiconductor Corp.";

		await user.click(
			within(await screen.findByRole("table")).getByRole("button", {
				name: /^MRDN/,
			}),
		);
		await user.click(
			await screen.findByRole("link", { name: "Open company page" }),
		);
		const result = await screen.findByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});
});
