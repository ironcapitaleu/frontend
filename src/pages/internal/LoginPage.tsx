import { type FormEvent, useId, useState } from "react";
import { Link } from "react-router";

import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Text, TextLink } from "@/components/ui/text";
import { useAuthContext } from "../../contexts/AuthContext";
import { useAuthAction } from "../../hooks/useAuthAction";
import type { OAuthProvider } from "../../lib/auth/gateway";
import { Email } from "../../lib/domain/email";

const PROVIDERS: { id: OAuthProvider; label: string }[] = [
	{ id: "google", label: "Google" },
	{ id: "github", label: "GitHub" },
];

/**
 * The one page for sign-in and sign-up, without a password.
 *
 * A known email signs in and a new email creates the account, through the same
 * form. After the email step, the page asks for the 6-digit code from the mail.
 * A signed-in visitor sees the email and a sign-out button. While the first
 * lookup of the user runs, the page shows no step.
 */
export default function LoginPage() {
	const { user, loading } = useAuthContext();
	const [sentTo, setSentTo] = useState<Email | null>(null);

	return (
		<AuthPanel>
			{loading ? null : user ? (
				<SignedInStep email={user.email} />
			) : sentTo ? (
				<CodeStep email={sentTo} onExit={() => setSentTo(null)} />
			) : (
				<EmailStep onSent={setSentTo} />
			)}
		</AuthPanel>
	);
}

function EmailStep({ onSent }: { onSent: (email: Email) => void }) {
	const { sendSignInCode, signInWithProvider } = useAuthContext();
	const { pending, error, run, showError } = useAuthAction();
	const [input, setInput] = useState("");
	const inputId = useId();

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!Email.isValid(input)) {
			showError("Enter a valid email address.");
			return;
		}
		const email = Email.parse(input);
		if (await run(() => sendSignInCode(email))) {
			onSent(email);
		}
	};

	return (
		<>
			<Heading level={1} variant="section" className="text-center">
				Sign in or create an account
			</Heading>
			<div className="flex flex-col gap-3">
				{PROVIDERS.map((provider) => (
					<Button
						key={provider.id}
						variant="outline"
						className="w-full py-5 btn-tactile"
						disabled={pending}
						onClick={() =>
							run(() => signInWithProvider(provider.id, window.location.href))
						}
					>
						Continue with {provider.label}
					</Button>
				))}
			</div>
			<FieldSeparator>or</FieldSeparator>
			<form className="flex flex-col gap-4" onSubmit={submit} noValidate>
				<Field>
					<FieldLabel htmlFor={inputId}>Email</FieldLabel>
					<Input
						id={inputId}
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						value={input}
						onChange={(event) => setInput(event.target.value)}
					/>
				</Field>
				<AuthErrorAlert message={error} />
				<Button
					type="submit"
					className="w-full py-5 btn-tactile"
					disabled={pending}
				>
					Continue with email
				</Button>
			</form>
			<Text font="sans" size="sm" className="text-center">
				By continuing, you agree to the terms of service and the{" "}
				<TextLink render={<Link to="/privacy" />}>privacy policy</TextLink>.
			</Text>
		</>
	);
}

/** Asks for the code. Calls `onExit` after the sign-in or to change the email. */
function CodeStep({ email, onExit }: { email: Email; onExit: () => void }) {
	const { verifySignInCode } = useAuthContext();
	const { pending, error, run, showError } = useAuthAction();
	const [code, setCode] = useState("");
	const inputId = useId();

	const submit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const digits = code.replace(/\s/g, "");
		if (!/^\d{6}$/.test(digits)) {
			showError("Enter the 6-digit code from the mail.");
			return;
		}
		if (await run(() => verifySignInCode(email, digits))) {
			onExit();
		}
	};

	return (
		<>
			<Heading level={1} variant="section" className="text-center">
				Check your email
			</Heading>
			<Text font="sans" size="lg" className="text-center">
				We sent a 6-digit code and a sign-in link to {email.value}. Enter the
				code, or open the link on this device.
			</Text>
			<form className="flex flex-col gap-4" onSubmit={submit} noValidate>
				<Field>
					<FieldLabel htmlFor={inputId}>Code</FieldLabel>
					<Input
						id={inputId}
						inputMode="numeric"
						autoComplete="one-time-code"
						value={code}
						onChange={(event) => setCode(event.target.value)}
					/>
				</Field>
				<AuthErrorAlert message={error} />
				<Button
					type="submit"
					className="w-full py-5 btn-tactile"
					disabled={pending}
				>
					Sign in
				</Button>
			</form>
			<Button variant="link" onClick={onExit}>
				Use a different email
			</Button>
		</>
	);
}

function SignedInStep({ email }: { email: string | null }) {
	const { signOut } = useAuthContext();
	const { pending, error, run } = useAuthAction();

	return (
		<>
			<Heading level={1} variant="section" className="text-center">
				You are signed in
			</Heading>
			{email && (
				<Text font="sans" size="lg" className="text-center">
					Signed in as {email}.
				</Text>
			)}
			<AuthErrorAlert message={error} />
			<Button
				variant="outline"
				className="w-full py-5 btn-tactile"
				disabled={pending}
				onClick={() => run(signOut)}
			>
				Sign out
			</Button>
		</>
	);
}
