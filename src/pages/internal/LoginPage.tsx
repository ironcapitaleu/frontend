import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";

import { KeyRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text, TextLink } from "@/components/ui/text";
import { useAuthContext } from "../../contexts/AuthContext";

export default function LoginPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const { user } = useAuthContext();
	const navigate = useNavigate();

	useEffect(() => {
		if (user) {
			navigate("/");
		}
	}, [user, navigate]);

	const handlePasskey = async () => {
		setError(null);
		setLoading(true);
		try {
			// TODO: implement passkey authentication
			await Promise.resolve();
		} catch (_err) {
			// Unreachable until real passkey auth lands: the stub above cannot
			// throw, so this error path (and the alert it drives) has no test yet.
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center gap-8">
				<Link to="/" aria-label="Iron Capital home">
					<img
						src="/icon.svg"
						alt="Iron Capital"
						className="w-12 h-12 rounded-full object-cover"
					/>
				</Link>
				<Heading level={1} variant="section" className="text-center">
					{isSignUp ? "Create an account" : "Sign in to your account"}
				</Heading>
			</div>

			<div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm flex flex-col gap-6">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<Button
					className="w-full gap-2 py-6 text-base font-medium btn-tactile"
					disabled={loading}
					onClick={handlePasskey}
				>
					<KeyRound size={18} />
					{loading ? "Continuing..." : "Continue with passkey"}
				</Button>

				<Text font="sans" size="sm" className="text-center">
					{isSignUp ? "Already a member? " : "Not a member? "}
					<TextLink
						variant="subtle"
						className="font-medium cursor-pointer"
						render={
							<button
								type="button"
								onClick={() => {
									setIsSignUp(!isSignUp);
									setError(null);
								}}
							/>
						}
					>
						{isSignUp ? "Sign in" : "Create an account"}
					</TextLink>
				</Text>
			</div>
		</div>
	);
}
