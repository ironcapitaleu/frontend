import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./accordion";

describe("Accordion", () => {
	it("should render the trigger text when given a single accordion item", () => {
		render(
			<Accordion>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);

		const expectedResult = "Account";

		const result = screen.getByText(expectedResult);

		expect(result).toBeInTheDocument();
	});

	it("should not display content when no item has been opened", () => {
		render(
			<Accordion>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);

		const expectedResult = null;

		const result = screen.queryByText("Account content");

		expect(result).toBe(expectedResult);
	});

	it("should display content when the trigger is clicked", async () => {
		render(
			<Accordion>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);
		const user = userEvent.setup();

		const expectedResult = "Account content";

		await user.click(screen.getByText("Account"));
		const result = screen.getByText(expectedResult);

		expect(result).toBeInTheDocument();
	});

	it("should hide content when an open trigger is clicked again", async () => {
		render(
			<Accordion>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);
		const user = userEvent.setup();

		const expectedResult = null;

		await user.click(screen.getByText("Account"));
		await user.click(screen.getByText("Account"));
		const result = screen.queryByText("Account content");

		expect(result).toBe(expectedResult);
	});

	it("should render multiple items when given multiple accordion items", () => {
		render(
			<Accordion>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger>Billing</AccordionTrigger>
					<AccordionContent>Billing content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);

		const expectedResult = [true, true];

		const result = ["Account", "Billing"].map(
			(title) => screen.queryByText(title) !== null,
		);

		expect(result).toEqual(expectedResult);
	});

	it("should close the first item when a second item is opened in single mode", async () => {
		render(
			<Accordion>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger>Billing</AccordionTrigger>
					<AccordionContent>Billing content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);
		const user = userEvent.setup();

		const expectedResult = null;

		await user.click(screen.getByText("Account"));
		await user.click(screen.getByText("Billing"));
		const result = screen.queryByText("Account content");

		expect(result).toBe(expectedResult);
	});

	it("should keep both items open when multiple prop is true", async () => {
		render(
			<Accordion multiple>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
				<AccordionItem value="item-2">
					<AccordionTrigger>Billing</AccordionTrigger>
					<AccordionContent>Billing content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);
		const user = userEvent.setup();

		const expectedResult = "Account content";

		await user.click(screen.getByText("Account"));
		await user.click(screen.getByText("Billing"));
		const result = screen.getByText(expectedResult);

		expect(result).toBeInTheDocument();
	});

	it("should not open content when the item is disabled", async () => {
		render(
			<Accordion>
				<AccordionItem value="item-1" disabled>
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);
		const user = userEvent.setup();

		const expectedResult = null;

		await user.click(screen.getByText("Account"));
		const result = screen.queryByText("Account content");

		expect(result).toBe(expectedResult);
	});

	it("should open the item that matches the defaultValue when rendered", () => {
		render(
			<Accordion defaultValue={["item-1"]}>
				<AccordionItem value="item-1">
					<AccordionTrigger>Account</AccordionTrigger>
					<AccordionContent>Account content</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);

		const expectedResult = "Account content";

		const result = screen.getByText(expectedResult);

		expect(result).toBeInTheDocument();
	});
});
