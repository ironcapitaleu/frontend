import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import Layout from "./Layout";

describe("Layout", () => {
	it("should render the routed page inside the outlet", () => {
		render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>Routed page body</p>} />
				</Route>
			</Routes>,
		);

		const expectedResult = "Routed page body";

		const result = screen.getByText("Routed page body");

		expect(result).toHaveTextContent(expectedResult);
	});

	it("should render the footer copyright alongside the routed page", () => {
		render(
			<Routes>
				<Route element={<Layout />}>
					<Route index element={<p>Routed page body</p>} />
				</Route>
			</Routes>,
		);

		const expectedResult = `© ${new Date().getFullYear()} Iron Capital. All rights reserved.`;

		const result = screen.getByText(/All rights reserved/i);

		expect(result).toHaveTextContent(expectedResult);
	});
});
