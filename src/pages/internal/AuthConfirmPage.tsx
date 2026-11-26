import { Link, useNavigate, useSearchParams } from "react-router";

import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text, TextLink } from "@/components/ui/text";
import { useAuthContext } from "../../contexts/AuthContext";
import { useAuthAction } from "../../hooks/useAuthAction";

/**
 * The page that the link in the sign-in mail opens, at
 * `/auth/confirm?token_hash=…`.
 *
 * Why a button? A mail scanner opens every link in a mail. The page checks the
 * token hash only after the visitor clicks, so a scanner uses up nothing. After
 * the sign-in, the page goes to `/login`, which shows the signed-in state.
 */
export default function AuthConfirmPage() {
	const [searchParams] = useSearchParams();
	const tokenHash = searchParams.get("token_hash");
	const { verifySignInLink } = useAuthContext();
	const { pending, error, run } = useAuthAction();
	const navigate = useNavigate();

	const confirm = async () => {
		if (tokenHash && (await run(() => verifySignInLink(tokenHash)))) {
			navigate("/login", { replace: true });
		}
	};

	return (
		<AuthPanel>
			<Heading level={1} variant="section" className="text-center">
				Sign in on this device
			</Heading>
			<Text font="sans" size="lg" className="text-center">
				{tokenHash
					? "Click the button to finish the sign-in."
					: "This link has no sign-in token."}{" "}
				To get a new mail, go to the{" "}
				<TextLink render={<Link to="/login" />}>sign-in page</TextLink>.
			</Text>
			<AuthErrorAlert message={error} />
			<Button
				className="w-full py-5 btn-tactile"
				disabled={!tokenHash || pending}
				onClick={confirm}
			>
				Sign in
			</Button>
		</AuthPanel>
	);
}
