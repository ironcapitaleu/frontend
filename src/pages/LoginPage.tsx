import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "../contexts/AuthContext";

export default function LoginPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const { signInWithEmail, signUpWithEmail, user } = useAuthContext();
	const navigate = useNavigate();

	// Redirect if already logged in
	useEffect(() => {
		if (user) {
			navigate("/");
		}
	}, [user, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		try {
			if (isSignUp) {
				const { error } = await signUpWithEmail(email, password);
				if (error) {
					setError(String(error));
				} else {
					setMessage("Check your email for a confirmation link!");
				}
			} else {
				const { error } = await signInWithEmail(email, password);
				if (error) {
					setError(String(error));
				} else {
					navigate("/");
				}
			}
		} catch (_err) {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main>
			<Card>
				<CardHeader>
					<CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
					<CardDescription>
						{isSignUp
							? "Sign up to access Iron Capital tools"
							: "Sign in to your Iron Capital account"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<div>
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
							/>
						</div>

						<div>
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								minLength={6}
							/>
						</div>

						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{message && (
							<Alert>
								<AlertDescription>{message}</AlertDescription>
							</Alert>
						)}

						<Button type="submit" disabled={loading}>
							{loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
						</Button>
					</form>

					<div>
						<Button
							variant="link"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError(null);
								setMessage(null);
							}}
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Don't have an account? Sign up"}
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
