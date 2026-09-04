import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { render, screen } from "../test/render";
import ContactPage from "./ContactPage";

/** A token that stands in for a passed Turnstile challenge (never fires in jsdom). */
const VERIFIED = "verified-token";

/** Selects a subject from the Radix combobox. */
async function selectSubject(
	user: ReturnType<typeof userEvent.setup>,
	name = "General",
) {
	await user.click(screen.getByRole("combobox"));
	await user.click(await screen.findByRole("option", { name }));
}

/** Fills name, email, message, and subject — but not the privacy-consent box. */
async function fillFormWithoutConsent(
	user: ReturnType<typeof userEvent.setup>,
) {
	await user.type(screen.getByLabelText("Full Name"), "Ada Lovelace");
	await user.type(screen.getByLabelText("Email"), "ada@example.com");
	await user.type(
		screen.getByLabelText("Message"),
		"I would like to learn more about your tools.",
	);
	await selectSubject(user);
}

/** Fills every field with valid input, leaving the form ready to submit. */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
	await fillFormWithoutConsent(user);
	await user.click(screen.getByLabelText(/i have read and accept/i));
}

/** The Send button, found by its accessible name. */
function submitButton(): HTMLButtonElement {
	return screen.getByRole("button", {
		name: /send message/i,
	}) as HTMLButtonElement;
}

describe("ContactPage", () => {
	it("should show the get-in-touch heading when the page is opened", () => {
		render(<ContactPage />);

		const expectedResult = "Get in touch";

		const result = screen.getByRole("heading", {
			name: /get in touch/i,
		}).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should keep the submit button disabled until a Turnstile token is present", () => {
		render(<ContactPage />);

		const expectedResult = true;

		const result = submitButton().hasAttribute("disabled");

		expect(result).toBe(expectedResult);
	});

	it("should enable the submit button once a Turnstile token is present", () => {
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = false;

		const result = submitButton().hasAttribute("disabled");

		expect(result).toBe(expectedResult);
	});

	it("should show a full-name error when submitting with an empty full name", async () => {
		const user = userEvent.setup();
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = "Please enter your full name.";

		await user.click(submitButton());
		const result = (await screen.findByText("Please enter your full name."))
			.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show an email error when submitting with an empty email", async () => {
		const user = userEvent.setup();
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = "Please enter your email.";

		await user.click(submitButton());
		const result = (await screen.findByText("Please enter your email."))
			.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show a format error when the email is not a valid address", async () => {
		const user = userEvent.setup();
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = "Please enter a valid email address.";

		await user.type(screen.getByLabelText("Email"), "not-an-email");
		await user.click(submitButton());
		const result = (
			await screen.findByText("Please enter a valid email address.")
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show a subject error when no subject is selected", async () => {
		const user = userEvent.setup();
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = "Please select a subject.";

		await user.click(submitButton());
		const result = (await screen.findByText("Please select a subject."))
			.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show a message error when the message is empty", async () => {
		const user = userEvent.setup();
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = "Please enter a message.";

		await user.click(submitButton());
		const result = (await screen.findByText("Please enter a message."))
			.textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show a length error when the message is shorter than ten characters", async () => {
		const user = userEvent.setup();
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = "Message must be at least 10 characters.";

		await user.type(screen.getByLabelText("Message"), "too short");
		await user.click(submitButton());
		const result = (
			await screen.findByText("Message must be at least 10 characters.")
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should require privacy consent when the box is left unchecked", async () => {
		const user = userEvent.setup();
		render(<ContactPage initialTurnstileToken={VERIFIED} />);

		const expectedResult = "Please accept the Privacy Policy to continue.";

		await fillFormWithoutConsent(user);
		await user.click(submitButton());
		const result = (
			await screen.findByText("Please accept the Privacy Policy to continue.")
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should open the success dialog when a valid form is submitted", async () => {
		const user = userEvent.setup();
		render(
			<ContactPage
				initialTurnstileToken={VERIFIED}
				sendMessage={async () => {}}
			/>,
		);

		const expectedResult = "Message sent";

		await fillValidForm(user);
		await user.click(submitButton());
		const result = (await screen.findByText("Message sent")).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should surface an error when the submit action fails", async () => {
		const user = userEvent.setup();
		render(
			<ContactPage
				initialTurnstileToken={VERIFIED}
				sendMessage={async () => {
					throw new Error("delivery failed");
				}}
			/>,
		);

		const expectedResult = "We couldn't send your message. Please try again.";

		await fillValidForm(user);
		await user.click(submitButton());
		const result = (await screen.findByRole("alert")).textContent;

		expect(result).toBe(expectedResult);
	});
});
