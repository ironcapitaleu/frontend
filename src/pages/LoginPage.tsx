import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { KeyRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { useAuthContext } from "../contexts/AuthContext";

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
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			<main className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8">
				<div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center">
					<Link to="/" aria-label="Iron Capital home">
						<img
							src="/icon.svg"
							alt="Iron Capital"
							className="w-12 h-12 rounded-full object-cover"
						/>
					</Link>
					<h2 className="mt-8 text-center text-2xl/9 font-bold font-classic sm:text-3xl/9 tracking-tight text-foreground">
						{isSignUp ? "Create an account" : "Sign in to your account"}
					</h2>
				</div>

				<div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm flex flex-col gap-6">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<Button
						className="w-full gap-2 py-6 text-base font-medium cursor-pointer"
						disabled={loading}
						onClick={handlePasskey}
					>
						<KeyRound size={18} />
						{loading ? "Continuing..." : "Continue with passkey"}
					</Button>

					<p className="mt-2 text-center text-sm text-muted-foreground">
						{isSignUp ? "Already a member? " : "Not a member? "}
						<button
							type="button"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError(null);
							}}
							className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
						>
							{isSignUp ? "Sign in" : "Create an account"}
						</button>
					</p>
				</div>
			</main>
			<Footer />
		</div>
	);
}
