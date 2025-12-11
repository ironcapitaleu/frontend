import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
	if (user) {
		navigate("/");
		return null;
	}

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
		<div className="min-h-screen flex items-center justify-center py-12 px-4">
			<div className="glass p-8 max-w-md w-full">
				<h1 className="h2 text-center mb-6">
					{isSignUp ? "Create Account" : "Welcome Back"}
				</h1>

				<p className="text-secondary text-center mb-8">
					{isSignUp
						? "Sign up to access Iron Capital tools"
						: "Sign in to your Iron Capital account"}
				</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="email" className="block text-sm font-semibold mb-2">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="input"
							placeholder="you@example.com"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-semibold mb-2"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="input"
							placeholder="••••••••"
							required
							minLength={6}
						/>
					</div>

					{error && (
						<div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
							{error}
						</div>
					)}

					{message && (
						<div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
							{message}
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="btn btn-primary w-full justify-center"
					>
						{loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
					</button>
				</form>

				<div className="mt-6 text-center">
					<button
						type="button"
						onClick={() => {
							setIsSignUp(!isSignUp);
							setError(null);
							setMessage(null);
						}}
						className="text-secondary hover:text-primary transition-colors"
					>
						{isSignUp
							? "Already have an account? Sign in"
							: "Don't have an account? Sign up"}
					</button>
				</div>
			</div>
		</div>
	);
}
