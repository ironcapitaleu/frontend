import { Link } from "react-router";

function Footer() {
	return (
		<footer className="border-t border-border/50">
			<div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
				<span className="text-sm text-muted-foreground text-center">
					© {new Date().getFullYear()} Iron Capital. All rights reserved.
				</span>
				<Link
					to="/privacy"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					Privacy Policy
				</Link>
				<Link
					to="/sitemap"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					Sitemap
				</Link>
			</div>
		</footer>
	);
}

export default Footer;
