import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import PrivacyPage from "./PrivacyPage";

describe("PrivacyPage", () => {
	it("should render the Privacy Policy title", () => {
		render(<PrivacyPage />);

		const expectedResult = "Privacy Policy";

		const result = screen.getByRole("heading", { level: 1 });

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should link the contact form reference to the contact route", () => {
		render(<PrivacyPage />);

		const expectedResult = "/contact";

		const result = screen.getByRole("link", { name: "contact form" });

		expect(result).toHaveAttribute("href", expectedResult);
	});

	it("should link to the Resend privacy policy when listing processors", () => {
		render(<PrivacyPage />);

		const expectedResult = "https://resend.com/legal/privacy-policy";

		const result = screen.getByRole("link", { name: "Resend Privacy Policy" });

		expect(result).toHaveAttribute("href", expectedResult);
	});
});
