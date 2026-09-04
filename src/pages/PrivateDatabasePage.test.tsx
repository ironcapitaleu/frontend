import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { alwaysAuthenticatedAuth } from "../test/fixtures/auth/always-authenticated";
import { alwaysUnauthenticatedAuth } from "../test/fixtures/auth/always-unauthenticated";
import { fakeUser } from "../test/fixtures/auth/user";
import { alwaysEmptyNotes } from "../test/fixtures/notes/always-empty";
import { alwaysFailingNotes } from "../test/fixtures/notes/always-failing";
import { alwaysListingNotes } from "../test/fixtures/notes/always-listing";
import { failingOnAddNotes } from "../test/fixtures/notes/failing-on-add";
import { failingOnDeleteNotes } from "../test/fixtures/notes/failing-on-delete";
import { sampleNotes } from "../test/fixtures/notes/notes";
import { render, screen, waitFor } from "../test/render";
import PrivateDatabasePage from "./PrivateDatabasePage";

describe("PrivateDatabasePage", () => {
	it("should show the authentication-required prompt when nobody is signed in", async () => {
		render(<PrivateDatabasePage notesGateway={alwaysEmptyNotes()} />, {
			gateway: alwaysUnauthenticatedAuth(),
		});

		const expectedResult = "Authentication Required";

		const result = (
			await screen.findByRole("heading", { name: "Authentication Required" })
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the signed-in email when a user is authenticated", async () => {
		render(<PrivateDatabasePage notesGateway={alwaysEmptyNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = fakeUser.email;

		const result = (await screen.findByText(fakeUser.email ?? "")).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should show the empty-notes message when the user has no notes", async () => {
		render(<PrivateDatabasePage notesGateway={alwaysEmptyNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = "No notes yet";

		const result = (await screen.findByText("No notes yet")).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should list a note's title when the gateway returns notes", async () => {
		render(<PrivateDatabasePage notesGateway={alwaysListingNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = sampleNotes[0].title;

		const result = (await screen.findByText(sampleNotes[0].title)).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should disable the add button when the title is blank", async () => {
		render(<PrivateDatabasePage notesGateway={alwaysEmptyNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = true;

		const result = (
			await screen.findByRole("button", { name: "Add Note" })
		).hasAttribute("disabled");

		expect(result).toBe(expectedResult);
	});

	it("should enable the add button when a title is entered", async () => {
		const user = userEvent.setup();
		render(<PrivateDatabasePage notesGateway={alwaysEmptyNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = false;

		await user.type(await screen.findByLabelText("Title"), "New note");
		const result = screen
			.getByRole("button", { name: "Add Note" })
			.hasAttribute("disabled");

		expect(result).toBe(expectedResult);
	});

	it("should surface an error when loading the notes fails", async () => {
		render(<PrivateDatabasePage notesGateway={alwaysFailingNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = "We couldn't load your notes. Please try again.";

		const result = (
			await screen.findByText("We couldn't load your notes. Please try again.")
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should surface an error when adding a note fails", async () => {
		const user = userEvent.setup();
		render(<PrivateDatabasePage notesGateway={failingOnAddNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = "We couldn't save your note. Please try again.";

		await user.type(await screen.findByLabelText("Title"), "New note");
		await user.click(screen.getByRole("button", { name: "Add Note" }));
		const result = (
			await screen.findByText("We couldn't save your note. Please try again.")
		).textContent;

		expect(result).toBe(expectedResult);
	});

	it("should clear the title field when a note is added successfully", async () => {
		const user = userEvent.setup();
		render(<PrivateDatabasePage notesGateway={alwaysEmptyNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = "";

		const titleInput = await screen.findByLabelText<HTMLInputElement>("Title");
		await user.type(titleInput, "New note");
		await user.click(screen.getByRole("button", { name: "Add Note" }));
		await waitFor(() => titleInput.value === "");
		const result = titleInput.value;

		expect(result).toBe(expectedResult);
	});

	it("should surface an error when deleting a note fails", async () => {
		const user = userEvent.setup();
		render(<PrivateDatabasePage notesGateway={failingOnDeleteNotes()} />, {
			gateway: alwaysAuthenticatedAuth(),
		});

		const expectedResult = "We couldn't delete your note. Please try again.";

		const deleteButtons = await screen.findAllByRole("button", {
			name: /delete/i,
		});
		await user.click(deleteButtons[0]);
		const result = (
			await screen.findByText("We couldn't delete your note. Please try again.")
		).textContent;

		expect(result).toBe(expectedResult);
	});
});
