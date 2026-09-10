import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from ".";

function renderTooltip(content?: ReactNode) {
	return render(
		<TooltipProvider delay={0}>
			<Tooltip>
				<TooltipTrigger>Gross margin</TooltipTrigger>
				{content ?? (
					<TooltipContent>Revenue minus cost of goods sold</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>,
	);
}

describe("Tooltip", () => {
	it("should render the trigger when mounted", () => {
		renderTooltip();

		const expectedResult = "Gross margin";

		const result = screen.getByRole("button").textContent;

		expect(result).toBe(expectedResult);
	});

	it("should keep the content hidden when the trigger is idle", () => {
		renderTooltip();

		const expectedResult = null;

		const result = screen.queryByText("Revenue minus cost of goods sold");

		expect(result).toBe(expectedResult);
	});

	it("should reveal the content when the trigger receives focus", async () => {
		renderTooltip();

		const expectedResult = "Revenue minus cost of goods sold";

		screen.getByRole("button").focus();

		const result = (await screen.findByText(expectedResult)).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should reveal the content when the trigger is hovered", async () => {
		const user = userEvent.setup();
		renderTooltip();

		const expectedResult = "Revenue minus cost of goods sold";

		await user.hover(screen.getByRole("button"));

		const result = (await screen.findByText(expectedResult)).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should place the content on the requested side when opened", async () => {
		renderTooltip(
			<TooltipContent side="right">
				Revenue minus cost of goods sold
			</TooltipContent>,
		);
		screen.getByRole("button").focus();

		const expectedResult = "right";

		const content = await screen.findByText("Revenue minus cost of goods sold");
		const result = content.closest("[data-side]")?.getAttribute("data-side");

		expect(result).toBe(expectedResult);
	});

	it("should align the content on the requested alignment when opened", async () => {
		renderTooltip(
			<TooltipContent align="start">
				Revenue minus cost of goods sold
			</TooltipContent>,
		);
		screen.getByRole("button").focus();

		const expectedResult = "start";

		const content = await screen.findByText("Revenue minus cost of goods sold");
		const result = content.closest("[data-align]")?.getAttribute("data-align");

		expect(result).toBe(expectedResult);
	});

	it("should hold the content closed on hover until the provider default delay elapses", async () => {
		const user = userEvent.setup();
		render(
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>Gross margin</TooltipTrigger>
					<TooltipContent>Revenue minus cost of goods sold</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		);
		await user.hover(screen.getByRole("button"));

		const expectedResult = {
			beforeDelay: null,
			afterDelay: "Revenue minus cost of goods sold",
		};

		const beforeDelay = screen.queryByText("Revenue minus cost of goods sold");
		const afterDelay = (
			await screen.findByText("Revenue minus cost of goods sold")
		).textContent;
		const result = { beforeDelay, afterDelay };

		expect(result).toEqual(expectedResult);
	});

	it("should hide the content when focus leaves the trigger", async () => {
		renderTooltip();
		const trigger = screen.getByRole("button");
		trigger.focus();
		await screen.findByText("Revenue minus cost of goods sold");

		const expectedResult = null;

		trigger.blur();

		await waitFor(() =>
			expect(screen.queryByText("Revenue minus cost of goods sold")).toBe(
				expectedResult,
			),
		);
	});
});
