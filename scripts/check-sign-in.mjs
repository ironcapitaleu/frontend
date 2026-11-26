// Recorded check of the passwordless sign-in against the local Supabase stack.
//
// The script drives the running app in a headless Chromium. It signs up a new
// email with the code from the mail, then signs the same email in again with the
// link from the mail. It reads each mail as plain text through the JSON API of
// Mailpit, the mail viewer of the local stack. It prints one line per step and
// exits with 1 at the first step that fails.
//
// CI starts no Supabase, so CI does not run this script. Run it by hand, with
// the local stack and `npm run dev -- --host 127.0.0.1 --port 3000` running. The
// README section "Sign-In Against the Local Supabase Stack" lists the steps.
//
// The run takes a little over a minute. Supabase sends a new mail to the same
// email once a minute (`max_frequency`), so the script waits before the sign-in.

import { chromium } from "playwright";

const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:3000";
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const RESEND_WAIT_MS = 61_000;
const MAIL_TIMEOUT_MS = 10_000;

const email = `check-${Date.now()}@example.com`;
const browser = await chromium.launch();

try {
	await run();
} catch (error) {
	console.error(`FAIL: ${error.message}`);
	process.exitCode = 1;
} finally {
	await browser.close();
}

async function run() {
	const page = await browser.newPage();
	console.log(`Email: ${email}`);

	const signUpMessage = await requestMail(page);
	pass(`sign-up: a new email shows "${signUpMessage}"`);

	const signUpMail = await readMail(1);
	const wrongCode = codeOf(signUpMail) === "000000" ? "111111" : "000000";
	await submitCode(page, wrongCode);
	pass(`a wrong code shows "${await alertText(page)}"`);

	await submitCode(page, codeOf(signUpMail));
	await page.getByText(`Signed in as ${email}.`).waitFor();
	pass("sign-up: the code from the mail signs in the new account");

	await page.reload();
	await page.getByText(`Signed in as ${email}.`).waitFor();
	pass("the session stays across a page reload");

	await page.getByRole("button", { name: "Sign out" }).click();
	await page
		.getByRole("heading", { name: "Sign in or create an account" })
		.waitFor();
	pass("sign-out returns to the email step");

	console.log(`Waiting ${RESEND_WAIT_MS / 1000} s for the resend limit`);
	await new Promise((resolve) => setTimeout(resolve, RESEND_WAIT_MS));

	const signInMessage = await requestMail(page);
	if (signInMessage !== signUpMessage) {
		throw new Error(`The known email shows "${signInMessage}"`);
	}
	pass("sign-in: the known email shows the same message as the new email");

	const link = linkOf(await readMail(2));
	await openLinkWithoutClick(link);
	await page.goto(link);
	await page.getByRole("button", { name: "Sign in" }).click();
	await page.getByText(`Signed in as ${email}.`).waitFor();
	pass(
		`sign-in: the link signs in on the click, after an open without a click, and leads to ${new URL(page.url()).pathname}`,
	);

	const usedLinkPage = await browser.newPage();
	await usedLinkPage.goto(link);
	await usedLinkPage.getByRole("button", { name: "Sign in" }).click();
	pass(`a used link shows "${await alertText(usedLinkPage)}"`);
}

/** Submits `email` on the email step and returns the text of the code step. */
async function requestMail(page) {
	await page.goto(`${APP_URL}/login`);
	await page.getByLabel("Email").fill(email);
	await page.getByRole("button", { name: "Continue with email" }).click();
	await page.getByRole("heading", { name: "Check your email" }).waitFor();
	return page.getByText("We sent a 6-digit code").textContent();
}

async function submitCode(page, code) {
	await page.getByLabel("Code").fill(code);
	await page.getByRole("button", { name: "Sign in" }).click();
}

async function alertText(page) {
	const alert = page.getByRole("alert");
	await alert.waitFor();
	return (await alert.textContent()).trim();
}

/** Opens the link in a fresh page, as a mail scanner does, and clicks nothing. */
async function openLinkWithoutClick(link) {
	const scanner = await browser.newPage();
	await scanner.goto(link);
	await scanner.getByRole("button", { name: "Sign in" }).waitFor();
	await scanner.close();
}

/** Waits for mail number `count` to `email` and returns its plain-text part. */
async function readMail(count) {
	const query = encodeURIComponent(`to:"${email}"`);
	const deadline = Date.now() + MAIL_TIMEOUT_MS;
	while (Date.now() < deadline) {
		const search = await getJson(`/api/v1/search?query=${query}`);
		if (search.messages.length >= count) {
			// Mailpit lists the newest message first.
			const message = await getJson(`/api/v1/message/${search.messages[0].ID}`);
			return message.Text;
		}
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Mail ${count} to ${email} did not arrive in Mailpit`);
}

async function getJson(path) {
	const response = await fetch(`${MAILPIT_URL}${path}`);
	if (!response.ok) {
		throw new Error(`Mailpit answered ${response.status} for ${path}`);
	}
	return response.json();
}

function codeOf(text) {
	const match = text.match(/^\s*(\d{6})\s*$/m);
	if (!match) {
		throw new Error("The mail holds no 6-digit code");
	}
	return match[1];
}

function linkOf(text) {
	const match = text.match(/(https?:\/\/\S+\/auth\/confirm\?\S+)/);
	if (!match) {
		throw new Error("The mail holds no link to /auth/confirm");
	}
	return match[1];
}

function pass(step) {
	console.log(`PASS: ${step}`);
}
