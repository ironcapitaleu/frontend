import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { RadioGroup, RadioGroupItem } from ".";

type RadioGroupProps = ComponentProps<typeof RadioGroup>;

function renderRadioGroup(props: RadioGroupProps = {}) {
	return render(
		<RadioGroup {...props}>
			<RadioGroupItem value="quarterly" aria-label="Quarterly" />
			<RadioGroupItem value="yearly" aria-label="Yearly" />
		</RadioGroup>,
	);
}

describe("RadioGroup", () => {
	it("should render one radio per option when mounted", () => {
		renderRadioGroup();

		const expectedResult = 2;

		const result = screen.getAllByRole("radio").length;

		expect(result).toBe(expectedResult);
	});

	it("should select the default option when a defaultValue is given", () => {
		renderRadioGroup({ defaultValue: "yearly" });

		const expectedResult = "true";

		const result = screen
			.getByRole("radio", { name: "Yearly" })
			.getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});

	it("should select an option when the reader clicks it", async () => {
		const user = userEvent.setup();
		renderRadioGroup({ defaultValue: "quarterly" });

		const expectedResult = "true";

		await user.click(screen.getByRole("radio", { name: "Yearly" }));

		const result = screen
			.getByRole("radio", { name: "Yearly" })
			.getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});

	it("should clear the earlier choice when the reader selects another option", async () => {
		const user = userEvent.setup();
		renderRadioGroup({ defaultValue: "quarterly" });

		const expectedResult = "false";

		await user.click(screen.getByRole("radio", { name: "Yearly" }));

		const result = screen
			.getByRole("radio", { name: "Quarterly" })
			.getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});

	it("should report the selected value when the reader clicks an option", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		renderRadioGroup({ onValueChange });

		const expectedResult = "yearly";

		await user.click(screen.getByRole("radio", { name: "Yearly" }));

		const result = onValueChange.mock.calls[0]?.[0];

		expect(result).toBe(expectedResult);
	});

	it("should keep its selection when the group is disabled and the reader clicks another option", async () => {
		const user = userEvent.setup();
		renderRadioGroup({ defaultValue: "quarterly", disabled: true });

		const expectedResult = "false";

		await user.click(screen.getByRole("radio", { name: "Yearly" }));

		const result = screen
			.getByRole("radio", { name: "Yearly" })
			.getAttribute("aria-checked");

		expect(result).toBe(expectedResult);
	});
});
