import type { ReactNode } from "react";
import { Link } from "react-router";

/**
 * A narrow column, centered on the page, with the brand mark above its
 * children. It holds one step of the sign-in flow.
 */
export function AuthPanel({ children }: { children: ReactNode }) {
	return (
		<div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-8">
			<div className="w-full max-w-sm flex flex-col gap-8">
				<Link to="/" aria-label="Iron Capital home" className="self-center">
					<img
						src="/icon.svg"
						alt="Iron Capital"
						className="w-12 h-12 rounded-full object-cover"
					/>
				</Link>
				{children}
			</div>
		</div>
	);
}
